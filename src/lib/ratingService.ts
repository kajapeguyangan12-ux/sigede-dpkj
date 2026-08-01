import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface Rating {
  id?: string;
  umkmId: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  rating: number;
  kualitasProduk: number;
  pelayanan: number;
  harga: number;
  kebersihan: number;
  ulasan?: string;
  fotoPendukung?: string[];
  helpful: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface VisitHistory {
  id?: string;
  umkmId: string;
  umkmName: string;
  userId: string;
  visitedAt: Timestamp;
  notificationSent?: boolean;
  notificationSentAt?: Timestamp;
  rated?: boolean;
  ratedAt?: Timestamp;
}

const COLLECTION_RATINGS = "e-umkm-ratings";
const COLLECTION_VISITS = "e-umkm-visits";

// Add or update rating
export const addOrUpdateRating = async (ratingData: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Check if user already rated this UMKM
    const q = query(
      collection(db, COLLECTION_RATINGS),
      where("umkmId", "==", ratingData.umkmId),
      where("userId", "==", ratingData.userId)
    );
    
    const existingRatings = await getDocs(q);
    
    if (!existingRatings.empty) {
      // Update existing rating
      const existingRatingDoc = existingRatings.docs[0];
      const ratingRef = doc(db, COLLECTION_RATINGS, existingRatingDoc.id);
      
      await updateDoc(ratingRef, {
        ...ratingData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Rating updated:', existingRatingDoc.id);
      
      // Recalculate average rating
      await updateUMKMAverageRating(ratingData.umkmId);
      
      return existingRatingDoc.id;
    } else {
      // Add new rating
      const rating: Omit<Rating, 'id'> = {
        ...ratingData,
        helpful: 0,
        createdAt: serverTimestamp() as Timestamp
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_RATINGS), rating);
      console.log('✅ Rating added:', docRef.id);
      
      // Update average rating
      await updateUMKMAverageRating(ratingData.umkmId);
      
      // Mark visit as rated
      await markVisitAsRated(ratingData.userId, ratingData.umkmId);
      
      return docRef.id;
    }
  } catch (error) {
    console.error('❌ Error adding/updating rating:', error);
    throw error;
  }
};

// Get all ratings for an UMKM
export const getUMKMRatings = async (umkmId: string): Promise<Rating[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_RATINGS),
      where("umkmId", "==", umkmId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const ratings: Rating[] = [];
    
    querySnapshot.forEach((doc) => {
      ratings.push({
        id: doc.id,
        ...doc.data()
      } as Rating);
    });
    
    return ratings;
  } catch (error) {
    console.error('❌ Error getting ratings:', error);
    throw error;
  }
};

// Get user's rating for an UMKM
export const getUserRatingForUMKM = async (userId: string, umkmId: string): Promise<Rating | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_RATINGS),
      where("umkmId", "==", umkmId),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Rating;
  } catch (error) {
    console.error('❌ Error getting user rating:', error);
    throw error;
  }
};

// Update average rating for UMKM
const updateUMKMAverageRating = async (umkmId: string) => {
  try {
    const ratings = await getUMKMRatings(umkmId);
    
    if (ratings.length === 0) {
      return;
    }
    
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    const umkmRef = doc(db, 'e-umkm', umkmId);
    await updateDoc(umkmRef, {
      rating: averageRating,
      jumlahRating: ratings.length
    });
    
    console.log(`✅ UMKM average rating updated: ${averageRating.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error updating average rating:', error);
  }
};

// Record visit history
export const recordVisit = async (userId: string, umkmId: string, umkmName: string): Promise<string> => {
  try {
    // Create unique visit ID
    const visitId = `${userId}_${umkmId}`;
    const visitRef = doc(db, COLLECTION_VISITS, visitId);
    
    // Check if visit already exists
    const existingVisit = await getDoc(visitRef);
    
    if (existingVisit.exists()) {
      // Update visit timestamp
      await updateDoc(visitRef, {
        visitedAt: serverTimestamp(),
        notificationSent: false, // Reset notification flag for new visit
      });
      console.log('✅ Visit updated:', visitId);
    } else {
      // Create new visit record
      const visit: Omit<VisitHistory, 'id'> = {
        umkmId,
        umkmName,
        userId,
        visitedAt: serverTimestamp() as Timestamp,
        notificationSent: false,
        rated: false
      };
      
      await setDoc(visitRef, visit);
      console.log('✅ Visit recorded:', visitId);
    }
    
    return visitId;
  } catch (error) {
    console.error('❌ Error recording visit:', error);
    throw error;
  }
};

// Get user's visit history
export const getUserVisitHistory = async (userId: string): Promise<VisitHistory[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_VISITS),
      where("userId", "==", userId),
      orderBy("visitedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const visits: VisitHistory[] = [];
    
    querySnapshot.forEach((doc) => {
      visits.push({
        id: doc.id,
        ...doc.data()
      } as VisitHistory);
    });
    
    return visits;
  } catch (error) {
    console.error('❌ Error getting visit history:', error);
    throw error;
  }
};

// Mark visit as rated
const markVisitAsRated = async (userId: string, umkmId: string) => {
  try {
    const visitId = `${userId}_${umkmId}`;
    const visitRef = doc(db, COLLECTION_VISITS, visitId);
    
    await updateDoc(visitRef, {
      rated: true,
      ratedAt: serverTimestamp()
    });
    
    console.log('✅ Visit marked as rated:', visitId);
  } catch (error) {
    console.error('❌ Error marking visit as rated:', error);
  }
};

// Get visits that need rating reminders (1-2 days old, not notified, not rated)
export const getVisitsNeedingReminder = async (): Promise<VisitHistory[]> => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const q = query(
      collection(db, COLLECTION_VISITS),
      where("notificationSent", "==", false),
      where("rated", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    const visits: VisitHistory[] = [];
    
    querySnapshot.forEach((doc) => {
      const visit = { id: doc.id, ...doc.data() } as VisitHistory;
      const visitDate = visit.visitedAt.toDate();
      
      // Check if visit is between 1-2 days old
      if (visitDate <= oneDayAgo && visitDate >= twoDaysAgo) {
        visits.push(visit);
      }
    });
    
    return visits;
  } catch (error) {
    console.error('❌ Error getting visits needing reminder:', error);
    throw error;
  }
};

// Mark notification as sent for a visit
export const markNotificationSent = async (visitId: string) => {
  try {
    const visitRef = doc(db, COLLECTION_VISITS, visitId);
    await updateDoc(visitRef, {
      notificationSent: true,
      notificationSentAt: serverTimestamp()
    });
    console.log('✅ Notification marked as sent for visit:', visitId);
  } catch (error) {
    console.error('❌ Error marking notification as sent:', error);
  }
};

// Mark rating as helpful
export const markRatingHelpful = async (ratingId: string) => {
  try {
    const ratingRef = doc(db, COLLECTION_RATINGS, ratingId);
    await updateDoc(ratingRef, {
      helpful: increment(1)
    });
    console.log('✅ Rating marked as helpful:', ratingId);
  } catch (error) {
    console.error('❌ Error marking rating as helpful:', error);
    throw error;
  }
};

// Delete rating
export const deleteRating = async (ratingId: string, umkmId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_RATINGS, ratingId));
    console.log('✅ Rating deleted:', ratingId);
    
    // Update average rating
    await updateUMKMAverageRating(umkmId);
  } catch (error) {
    console.error('❌ Error deleting rating:', error);
    throw error;
  }
};

// Get rating statistics for an UMKM
export const getRatingStatistics = async (umkmId: string) => {
  try {
    const ratings = await getUMKMRatings(umkmId);
    
    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        averageKualitas: 0,
        averagePelayanan: 0,
        averageHarga: 0,
        averageKebersihan: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    let totalKualitas = 0;
    let totalPelayanan = 0;
    let totalHarga = 0;
    let totalKebersihan = 0;
    
    ratings.forEach((r) => {
      const roundedRating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      distribution[roundedRating]++;
      totalRating += r.rating;
      totalKualitas += r.kualitasProduk;
      totalPelayanan += r.pelayanan;
      totalHarga += r.harga;
      totalKebersihan += r.kebersihan;
    });
    
    return {
      totalRatings: ratings.length,
      averageRating: totalRating / ratings.length,
      averageKualitas: totalKualitas / ratings.length,
      averagePelayanan: totalPelayanan / ratings.length,
      averageHarga: totalHarga / ratings.length,
      averageKebersihan: totalKebersihan / ratings.length,
      distribution
    };
  } catch (error) {
    console.error('❌ Error getting rating statistics:', error);
    throw error;
  }
};

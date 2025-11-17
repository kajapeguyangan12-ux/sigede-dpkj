import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebase';

export interface SuperAdminData {
  uid: string;
  email: string;
  displayName: string;
  userName?: string;
  role: 'administrator' | 'admin_desa';
  phoneNumber?: string;
  idNumber?: string;
  address?: string;
  notes?: string;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  lastLogin?: any;
  status: 'active' | 'inactive' | 'suspended';
}

export interface CreateSuperAdminData {
  email: string;
  password: string;
  displayName: string;
  userName?: string;
  role: 'administrator' | 'admin_desa';
  phoneNumber?: string;
  idNumber?: string;
  address?: string;
  notes?: string;
}

class SuperAdminService {
  private collectionName = 'Super_admin';

  /**
   * Create new Super Admin user
   */
  async createSuperAdmin(data: CreateSuperAdminData, createdBy: string): Promise<SuperAdminData> {
    try {
      console.log('🔥 Creating Super Admin with Firebase Auth...');
      
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase user created:', firebaseUser.uid);

      // 2. Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: data.displayName
      });

      // 3. Create Firestore document in Super_admin collection
      const superAdminData: SuperAdminData = {
        uid: firebaseUser.uid,
        email: data.email,
        displayName: data.displayName,
        userName: data.userName || data.email.split('@')[0],
        role: data.role,
        phoneNumber: data.phoneNumber,
        idNumber: data.idNumber,
        address: data.address,
        notes: data.notes,
        createdAt: serverTimestamp(),
        createdBy,
        status: 'active'
      };

      // Use the Firebase UID as document ID for easy reference
      await setDoc(doc(db, this.collectionName, firebaseUser.uid), superAdminData);

      console.log('✅ Super Admin data saved to Firestore');
      
      return {
        ...superAdminData,
        createdAt: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('❌ Error creating Super Admin:', error);
      throw new Error(`Gagal membuat Super Admin: ${error.message}`);
    }
  }

  /**
   * Get all Super Admin users
   */
  async getAllSuperAdmins(): Promise<SuperAdminData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const admins: SuperAdminData[] = [];

      querySnapshot.forEach((doc) => {
        admins.push({
          ...doc.data() as SuperAdminData,
          uid: doc.id
        });
      });

      return admins;
    } catch (error: any) {
      console.error('❌ Error getting Super Admins:', error);
      throw new Error(`Gagal memuat daftar Super Admin: ${error.message}`);
    }
  }

  /**
   * Update Super Admin data
   */
  async updateSuperAdmin(uid: string, updates: Partial<SuperAdminData>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, uid);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Super Admin updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating Super Admin:', error);
      throw new Error(`Gagal memperbarui Super Admin: ${error.message}`);
    }
  }

  /**
   * Delete Super Admin
   */
  async deleteSuperAdmin(uid: string): Promise<void> {
    try {
      // 1. Delete Firestore document
      await deleteDoc(doc(db, this.collectionName, uid));
      
      // Note: Deleting Firebase Auth user requires re-authentication
      // This should be handled carefully in production
      console.log('✅ Super Admin deleted from Firestore');
      
    } catch (error: any) {
      console.error('❌ Error deleting Super Admin:', error);
      throw new Error(`Gagal menghapus Super Admin: ${error.message}`);
    }
  }

  /**
   * Update Super Admin status
   */
  async updateStatus(uid: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      await this.updateSuperAdmin(uid, { status });
    } catch (error: any) {
      throw new Error(`Gagal mengubah status: ${error.message}`);
    }
  }

  /**
   * Get Super Admin by UID
   */
  async getSuperAdminByUid(uid: string): Promise<SuperAdminData | null> {
    try {
      const docRef = doc(db, this.collectionName, uid);
      const docSnap = await getDocs(query(collection(db, this.collectionName), where('uid', '==', uid)));
      
      if (!docSnap.empty) {
        const doc = docSnap.docs[0];
        return {
          ...doc.data() as SuperAdminData,
          uid: doc.id
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Error getting Super Admin by UID:', error);
      return null;
    }
  }

  /**
   * Authenticate Super Admin login
   */
  async authenticateSuperAdmin(email: string, password: string): Promise<SuperAdminData> {
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Get Super Admin data from Firestore
      const superAdmin = await this.getSuperAdminByUid(firebaseUser.uid);
      
      if (!superAdmin) {
        throw new Error('Super Admin tidak ditemukan di database');
      }

      if (superAdmin.status !== 'active') {
        throw new Error(`Akun ${superAdmin.status}. Hubungi administrator.`);
      }

      // 3. Update last login
      await this.updateSuperAdmin(firebaseUser.uid, {
        lastLogin: serverTimestamp()
      });

      return superAdmin;
    } catch (error: any) {
      console.error('❌ Error authenticating Super Admin:', error);
      throw new Error(`Login gagal: ${error.message}`);
    }
  }
}

// Export singleton instance
const superAdminService = new SuperAdminService();
export default superAdminService;
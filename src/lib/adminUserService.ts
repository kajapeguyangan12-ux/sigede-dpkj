import { 
  collection, 
  doc, 
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
} from 'firebase/auth';
import { auth, db } from './firebase';
import { UserRole } from '../app/masyarakat/lib/useCurrentUser';

export interface AdminUserData {
  uid: string;
  email: string;
  displayName: string;
  userName?: string;
  role: 'administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun';
  phoneNumber?: string;
  idNumber?: string;
  nik?: string; // NIK untuk kepala desa dan kepala dusun
  daerah?: string; // Daerah untuk kepala dusun
  address?: string;
  notes?: string;
  initialPassword?: string; // Password awal yang dibuat admin (hanya untuk tampilan)
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  lastLogin?: any;
  status: 'active' | 'inactive' | 'suspended';
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  displayName: string;
  userName?: string;
  role: 'administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun';
  phoneNumber?: string;
  idNumber?: string;
  nik?: string;
  daerah?: string;
  address?: string;
  notes?: string;
}

/**
 * Get collection name based on role
 */
function getCollectionNameByRole(role: string): string {
  switch (role) {
    case 'administrator':
      return 'Super_admin';
    case 'admin_desa':
      return 'Admin_Desa';
    case 'kepala_desa':
      return 'Kepala_Desa';
    case 'kepala_dusun':
      return 'Kepala_Dusun';
    default:
      return 'users';
  }
}

class AdminUserService {
  /**
   * Create new admin user (administrator, admin_desa, kepala_desa, kepala_dusun)
   */
  async createAdminUser(data: CreateAdminUserData, createdBy: string): Promise<AdminUserData> {
    try {
      console.log(`🔥 Creating ${data.role} with Firebase Auth...`);
      
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

      // 3. Determine collection name based on role
      const collectionName = getCollectionNameByRole(data.role);
      console.log('📦 Using collection:', collectionName);

      // 4. Create Firestore document
      const adminUserData: Partial<AdminUserData> = {
        uid: firebaseUser.uid,
        email: data.email,
        displayName: data.displayName,
        userName: data.userName,
        role: data.role,
        phoneNumber: data.phoneNumber,
        idNumber: data.idNumber,
        nik: data.nik,
        daerah: data.daerah,
        address: data.address,
        notes: data.notes,
        initialPassword: data.password, // Simpan password untuk ditampilkan ke admin
        createdAt: serverTimestamp(),
        createdBy,
        status: 'active'
      };

      // Filter out undefined values to avoid Firestore errors
      const filteredData = Object.fromEntries(
        Object.entries(adminUserData).filter(([_, value]) => value !== undefined)
      );

      // Save to appropriate collection
      await setDoc(doc(db, collectionName, firebaseUser.uid), filteredData);

      // Also save to main 'users' collection for unified authentication
      const userCollectionData = {
        ...filteredData,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userCollectionData);

      console.log(`✅ ${data.role} data saved to Firestore (${collectionName} & users)`);
      
      return {
        ...adminUserData,
        uid: firebaseUser.uid,
        createdAt: new Date().toISOString()
      } as AdminUserData;

    } catch (error: any) {
      console.error(`❌ Error creating ${data.role}:`, error);
      throw new Error(`Gagal membuat ${data.role}: ${error.message}`);
    }
  }

  /**
   * Get all admin users by role
   */
  async getAdminUsersByRole(role: 'administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun'): Promise<AdminUserData[]> {
    try {
      const collectionName = getCollectionNameByRole(role);
      const q = query(
        collection(db, collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const users: AdminUserData[] = [];

      querySnapshot.forEach((doc) => {
        users.push({
          ...doc.data() as AdminUserData,
          uid: doc.id
        });
      });

      return users;
    } catch (error: any) {
      console.error(`❌ Error getting ${role} users:`, error);
      throw new Error(`Gagal memuat daftar ${role}: ${error.message}`);
    }
  }

  /**
   * Get all admin users from all admin collections
   */
  async getAllAdminUsers(): Promise<AdminUserData[]> {
    try {
      const roles: ('administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun')[] = [
        'administrator',
        'admin_desa',
        'kepala_desa',
        'kepala_dusun'
      ];

      const allUsers: AdminUserData[] = [];

      for (const role of roles) {
        const users = await this.getAdminUsersByRole(role);
        allUsers.push(...users);
      }

      // Sort by createdAt
      return allUsers.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    } catch (error: any) {
      console.error('❌ Error getting all admin users:', error);
      throw new Error(`Gagal memuat daftar admin: ${error.message}`);
    }
  }

  /**
   * Update admin user data
   */
  async updateAdminUser(uid: string, role: string, updates: Partial<AdminUserData>): Promise<void> {
    try {
      const collectionName = getCollectionNameByRole(role);
      const docRef = doc(db, collectionName, uid);
      
      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries({
          ...updates,
          updatedAt: serverTimestamp()
        }).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(docRef, filteredUpdates);

      // Also update in users collection
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, filteredUpdates);

      console.log(`✅ ${role} updated successfully`);
    } catch (error: any) {
      console.error(`❌ Error updating ${role}:`, error);
      throw new Error(`Gagal memperbarui ${role}: ${error.message}`);
    }
  }

  /**
   * Delete admin user
   */
  async deleteAdminUser(uid: string, role: string): Promise<void> {
    try {
      const collectionName = getCollectionNameByRole(role);
      
      // Delete from role-specific collection
      await deleteDoc(doc(db, collectionName, uid));
      
      // Delete from users collection
      await deleteDoc(doc(db, 'users', uid));
      
      console.log(`✅ ${role} deleted from Firestore`);
      
    } catch (error: any) {
      console.error(`❌ Error deleting ${role}:`, error);
      throw new Error(`Gagal menghapus ${role}: ${error.message}`);
    }
  }

  /**
   * Update admin user status
   */
  async updateStatus(uid: string, role: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    try {
      await this.updateAdminUser(uid, role, { status });
    } catch (error: any) {
      throw new Error(`Gagal mengubah status: ${error.message}`);
    }
  }

  /**
   * Get admin user by UID from any collection
   */
  async getAdminUserByUid(uid: string): Promise<AdminUserData | null> {
    try {
      const roles = ['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun'];
      
      for (const role of roles) {
        const collectionName = getCollectionNameByRole(role);
        const docRef = doc(db, collectionName, uid);
        const docSnap = await getDocs(query(collection(db, collectionName), where('uid', '==', uid)));
        
        if (!docSnap.empty) {
          const doc = docSnap.docs[0];
          return {
            ...doc.data() as AdminUserData,
            uid: doc.id
          };
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Error getting admin user by UID:', error);
      return null;
    }
  }

  /**
   * Authenticate admin user login
   */
  async authenticateAdminUser(email: string, password: string): Promise<AdminUserData> {
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Get admin user data from Firestore
      const adminUser = await this.getAdminUserByUid(firebaseUser.uid);
      
      if (!adminUser) {
        throw new Error('Admin user tidak ditemukan di database');
      }

      if (adminUser.status !== 'active') {
        throw new Error(`Akun ${adminUser.status}. Hubungi administrator.`);
      }

      // 3. Update last login
      await this.updateAdminUser(firebaseUser.uid, adminUser.role, {
        lastLogin: serverTimestamp()
      });

      return adminUser;
    } catch (error: any) {
      console.error('❌ Error authenticating admin user:', error);
      throw new Error(`Login gagal: ${error.message}`);
    }
  }
}

// Export singleton instance
const adminUserService = new AdminUserService();
export default adminUserService;

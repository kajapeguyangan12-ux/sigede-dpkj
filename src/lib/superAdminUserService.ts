import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../app/masyarakat/lib/useCurrentUser';

export interface ManagedUser {
  uid: string;
  email: string;
  displayName: string;
  userName?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  phoneNumber?: string;
  idNumber?: string;
  nik?: string; // NIK untuk kepala dusun/desa
  address?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  lastLogin?: any;
  loginCredentials?: {
    password?: string; // For display purposes only, not stored
    passwordHash?: string; // In real app, this would be hashed
    passwordUpdatedAt?: any;
  };
}

export interface CreateManagedUserData {
  email: string;
  password: string;
  displayName: string;
  userName?: string;
  role: UserRole;
  phoneNumber?: string;
  idNumber?: string;
  address?: string;
  notes?: string;
}

class SuperAdminUserService {
  private usersCollection = collection(db, 'users');

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple password hashing (in production, use proper bcrypt or similar)
   */
  private hashPassword(password: string): string {
    // Simple hash for demo - in production use proper hashing
    return btoa(password + 'sigede_salt_2024');
  }

  /**
   * Create new user with authentication credentials
   */
  async createUser(userData: CreateManagedUserData, createdBy: string): Promise<ManagedUser> {
    try {
      console.log('🔧 Creating managed user:', userData.email);

      // Generate unique ID
      const uid = this.generateUserId();

      // Hash password
      const passwordHash = this.hashPassword(userData.password);

      // Prepare user document
      const userDoc: ManagedUser = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        userName: userData.userName || userData.email.split('@')[0],
        role: userData.role,
        status: 'active',
        phoneNumber: userData.phoneNumber,
        idNumber: userData.idNumber,
        address: userData.address,
        notes: userData.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy,
        loginCredentials: {
          passwordHash,
          passwordUpdatedAt: serverTimestamp()
        }
      };

      // Filter out undefined values to avoid Firestore errors
      const filteredDoc = Object.fromEntries(
        Object.entries(userDoc).filter(([_, value]) => value !== undefined)
      ) as ManagedUser;

      // Save to Firestore users collection
      await setDoc(doc(this.usersCollection, uid), filteredDoc);

      // If role is admin_desa, also create document in Admin_Desa collection
      // This is required for authentication service to validate password
      if (userData.role === 'admin_desa') {
        console.log('🔧 Creating Admin_Desa document for admin_desa user...');
        console.log('📝 Admin Desa Data:', {
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          userName: userData.userName
        });
        
        const adminDesaCollection = collection(db, 'Admin_Desa');
        const adminDesaDoc = {
          uid,
          email: userData.email,
          nama: userData.displayName,
          username: userData.userName || userData.email.split('@')[0],
          kataSandi: userData.password, // Store plain password as per existing Admin_Desa structure
          role: 'admin_desa',
          telepon: userData.phoneNumber || '',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy
        };
        
        // Filter out undefined values but KEEP kataSandi even if empty string
        // kataSandi is critical for authentication
        const filteredAdminDesaDoc: any = {};
        for (const [key, value] of Object.entries(adminDesaDoc)) {
          if (key === 'kataSandi') {
            // Always include password, even if empty (shouldn't happen with validation)
            filteredAdminDesaDoc[key] = value;
          } else if (value !== undefined && value !== '') {
            filteredAdminDesaDoc[key] = value;
          }
        }
        
        console.log('💾 Saving Admin_Desa document with kataSandi:', filteredAdminDesaDoc.kataSandi);
        await setDoc(doc(adminDesaCollection, uid), filteredAdminDesaDoc);
        console.log('✅ Admin_Desa document created successfully');
      }

      // If role is administrator, also create document in Super_Admin collection
      if (userData.role === 'administrator') {
        console.log('🔧 Creating Super_Admin document for administrator user...');
        console.log('📝 Super Admin Data:', {
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          userName: userData.userName
        });
        
        const superAdminCollection = collection(db, 'Super_Admin');
        const superAdminDoc = {
          uid,
          email: userData.email,
          nama: userData.displayName,
          username: userData.userName || userData.email.split('@')[0],
          kataSandi: userData.password, // Store plain password as per existing Super_Admin structure
          role: 'administrator',
          telepon: userData.phoneNumber || '',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy
        };
        
        // Filter out undefined values but KEEP kataSandi even if empty string
        // kataSandi is critical for authentication
        const filteredSuperAdminDoc: any = {};
        for (const [key, value] of Object.entries(superAdminDoc)) {
          if (key === 'kataSandi') {
            // Always include password, even if empty (shouldn't happen with validation)
            filteredSuperAdminDoc[key] = value;
          } else if (value !== undefined && value !== '') {
            filteredSuperAdminDoc[key] = value;
          }
        }
        
        console.log('💾 Saving Super_Admin document with kataSandi:', filteredSuperAdminDoc.kataSandi);
        await setDoc(doc(superAdminCollection, uid), filteredSuperAdminDoc);
        console.log('✅ Super_Admin document created successfully');
      }

      console.log('✅ Managed user created successfully:', uid);
      return userDoc;

    } catch (error) {
      console.error('❌ Error creating managed user:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<ManagedUser[]> {
    try {
      const usersQuery = query(
        this.usersCollection,
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as ManagedUser[];

      return users;

    } catch (error) {
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(uid: string): Promise<ManagedUser | null> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        uid: userDoc.id,
        ...userDoc.data()
      } as ManagedUser;

    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<ManagedUser[]> {
    try {
      const usersQuery = query(
        this.usersCollection,
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as ManagedUser[];

      return users;

    } catch (error) {
      console.error('❌ Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(uid: string, updates: Partial<ManagedUser>): Promise<void> {
    try {
      console.log('🔄 Updating user:', uid);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Remove uid from updates to avoid conflicts
      delete updateData.uid;

      await updateDoc(doc(this.usersCollection, uid), updateData);
      
      console.log('✅ User updated successfully:', uid);

    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(uid: string, newPassword: string): Promise<void> {
    try {
      console.log('🔑 Updating password for user:', uid);

      const passwordHash = this.hashPassword(newPassword);

      // Update password in users collection
      await updateDoc(doc(this.usersCollection, uid), {
        'loginCredentials.passwordHash': passwordHash,
        'loginCredentials.passwordUpdatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Get user to check role
      const userDoc = await getDoc(doc(this.usersCollection, uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as ManagedUser;
        
        // Also update in Admin_Desa collection if admin_desa role
        if (userData.role === 'admin_desa') {
          const adminDesaCollection = collection(db, 'Admin_Desa');
          const adminDesaDocRef = doc(adminDesaCollection, uid);
          const adminDesaDoc = await getDoc(adminDesaDocRef);
          
          if (adminDesaDoc.exists()) {
            await updateDoc(adminDesaDocRef, {
              kataSandi: newPassword,
              updatedAt: serverTimestamp()
            });
            console.log('✅ Password updated in Admin_Desa collection');
          }
        }
        
        // Also update in Super_Admin collection if administrator role
        if (userData.role === 'administrator') {
          const superAdminCollection = collection(db, 'Super_Admin');
          const superAdminDocRef = doc(superAdminCollection, uid);
          const superAdminDoc = await getDoc(superAdminDocRef);
          
          if (superAdminDoc.exists()) {
            await updateDoc(superAdminDocRef, {
              kataSandi: newPassword,
              updatedAt: serverTimestamp()
            });
            console.log('✅ Password updated in Super_Admin collection');
          }
        }
      }

      console.log('✅ Password updated successfully for user:', uid);

    } catch (error) {
      console.error('❌ Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      console.log('🗑️ Deleting user:', uid);

      // Get user to check role before deletion
      const userDoc = await getDoc(doc(this.usersCollection, uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as ManagedUser;
        
        // Delete from Admin_Desa collection if admin_desa role
        if (userData.role === 'admin_desa') {
          const adminDesaCollection = collection(db, 'Admin_Desa');
          const adminDesaDocRef = doc(adminDesaCollection, uid);
          const adminDesaDoc = await getDoc(adminDesaDocRef);
          
          if (adminDesaDoc.exists()) {
            await deleteDoc(adminDesaDocRef);
            console.log('✅ User deleted from Admin_Desa collection');
          }
        }
        
        // Delete from Super_Admin collection if administrator role
        if (userData.role === 'administrator') {
          const superAdminCollection = collection(db, 'Super_Admin');
          const superAdminDocRef = doc(superAdminCollection, uid);
          const superAdminDoc = await getDoc(superAdminDocRef);
          
          if (superAdminDoc.exists()) {
            await deleteDoc(superAdminDocRef);
            console.log('✅ User deleted from Super_Admin collection');
          }
        }
      }

      // Delete from users collection
      await deleteDoc(doc(this.usersCollection, uid));
      
      console.log('✅ User deleted successfully:', uid);

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with email/username and password
   */
  async authenticateUser(identifier: string, password: string): Promise<ManagedUser | null> {
    try {
      console.log('🔐 Authenticating user:', identifier);

      // Try to find user by email first
      const emailQuery = query(
        this.usersCollection,
        where('email', '==', identifier)
      );
      
      let userSnapshot = await getDocs(emailQuery);

      // If not found by email, try by username
      if (userSnapshot.empty) {
        const usernameQuery = query(
          this.usersCollection,
          where('userName', '==', identifier)
        );
        userSnapshot = await getDocs(usernameQuery);
      }

      if (userSnapshot.empty) {
        console.log('❌ User not found:', identifier);
        return null;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data() as ManagedUser;

      // Check password based on role
      let passwordValid = false;
      
      if (userData.role === 'admin_desa') {
        // For admin_desa, check plain text password from Admin_Desa collection
        console.log('🔍 Checking admin_desa password from Admin_Desa collection...');
        const adminDesaCollection = collection(db, 'Admin_Desa');
        const adminDesaQuery = query(adminDesaCollection, where('email', '==', userData.email));
        const adminDesaSnapshot = await getDocs(adminDesaQuery);
        
        if (!adminDesaSnapshot.empty) {
          const adminDesaData = adminDesaSnapshot.docs[0].data();
          console.log('🔍 Found Admin_Desa document:', {
            email: adminDesaData.email,
            hasKataSandi: !!adminDesaData.kataSandi,
            kataSandiValue: adminDesaData.kataSandi,
            inputPassword: password
          });
          
          // Check if kataSandi exists and is not empty
          if (adminDesaData.kataSandi) {
            passwordValid = adminDesaData.kataSandi === password;
            console.log('🔑 Admin Desa password check (from Admin_Desa):', passwordValid ? '✅ Valid' : '❌ Invalid');
          } else {
            console.log('⚠️ kataSandi is empty/undefined in Admin_Desa collection');
            console.log('🔄 Falling back to hashed password check from users collection...');
            // Fallback to hashed password if kataSandi not available
            const passwordHash = this.hashPassword(password);
            const storedPasswordHash = userData.loginCredentials?.passwordHash;
            passwordValid = passwordHash === storedPasswordHash;
            console.log('🔑 Admin Desa password check (from users/hashed):', passwordValid ? '✅ Valid' : '❌ Invalid');
          }
        } else {
          console.log('⚠️ Admin_Desa document not found for email:', userData.email);
          console.log('🔄 Falling back to hashed password check from users collection...');
          // Fallback to hashed password if Admin_Desa doc not found
          const passwordHash = this.hashPassword(password);
          const storedPasswordHash = userData.loginCredentials?.passwordHash;
          passwordValid = passwordHash === storedPasswordHash;
          console.log('🔑 Admin Desa password check (from users/hashed):', passwordValid ? '✅ Valid' : '❌ Invalid');
        }
      } else if (userData.role === 'administrator') {
        // For administrator, check plain text password from Super_Admin collection
        console.log('🔍 Checking administrator password from Super_Admin collection...');
        const superAdminCollection = collection(db, 'Super_Admin');
        const superAdminQuery = query(superAdminCollection, where('email', '==', userData.email));
        const superAdminSnapshot = await getDocs(superAdminQuery);
        
        if (!superAdminSnapshot.empty) {
          const superAdminData = superAdminSnapshot.docs[0].data();
          passwordValid = superAdminData.kataSandi === password;
          console.log('🔑 Administrator password check:', passwordValid ? '✅ Valid' : '❌ Invalid');
        }
      } else {
        // For other users, check hashed password from users collection
        console.log('🔍 Checking hashed password from users collection...');
        const passwordHash = this.hashPassword(password);
        const storedPasswordHash = userData.loginCredentials?.passwordHash;
        passwordValid = passwordHash === storedPasswordHash;
        console.log('🔑 Hashed password check:', passwordValid ? '✅ Valid' : '❌ Invalid');
      }

      if (!passwordValid) {
        console.log('❌ Invalid password for user:', identifier);
        return null;
      }

      // Update last login
      await updateDoc(userDoc.ref, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('✅ User authenticated successfully:', userData.uid);
      return {
        ...userData,
        uid: userDoc.id
      };

    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  }> {
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        byRole: {} as Record<UserRole, number>
      };

      // Count by role
      const roles: UserRole[] = [
        'administrator', 
        'admin_desa', 
        'kepala_desa', 
        'kepala_dusun', 
        'warga_dpkj', 
        'warga_luar_dpkj', 
        'unknown'
      ];

      roles.forEach(role => {
        stats.byRole[role] = users.filter(u => u.role === role).length;
      });

      return stats;

    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Fix/repair admin user - sync password to Admin_Desa/Super_Admin collection
   * Use this to fix users created before the multi-collection system
   */
  async repairAdminUser(uid: string, newPassword: string): Promise<void> {
    try {
      console.log('🔧 Repairing admin user:', uid);

      // Get user data
      const userDoc = await getDoc(doc(this.usersCollection, uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as ManagedUser;
      
      // Update password in users collection
      await this.updateUserPassword(uid, newPassword);

      // Sync to Admin_Desa or Super_Admin collection based on role
      if (userData.role === 'admin_desa') {
        const adminDesaCollection = collection(db, 'Admin_Desa');
        const adminDesaDocRef = doc(adminDesaCollection, uid);
        
        // Create or update Admin_Desa document
        await setDoc(adminDesaDocRef, {
          uid,
          email: userData.email,
          nama: userData.displayName,
          username: userData.userName || userData.email.split('@')[0],
          kataSandi: newPassword,
          role: 'admin_desa',
          telepon: userData.phoneNumber || '',
          status: userData.status || 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Admin_Desa document synced');
      } else if (userData.role === 'administrator') {
        const superAdminCollection = collection(db, 'Super_Admin');
        const superAdminDocRef = doc(superAdminCollection, uid);
        
        // Create or update Super_Admin document
        await setDoc(superAdminDocRef, {
          uid,
          email: userData.email,
          nama: userData.displayName,
          username: userData.userName || userData.email.split('@')[0],
          kataSandi: newPassword,
          role: 'administrator',
          telepon: userData.phoneNumber || '',
          status: userData.status || 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('✅ Super_Admin document synced');
      }

      console.log('✅ Admin user repaired successfully:', uid);

    } catch (error) {
      console.error('❌ Error repairing admin user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const superAdminUserService = new SuperAdminUserService();
export default superAdminUserService;
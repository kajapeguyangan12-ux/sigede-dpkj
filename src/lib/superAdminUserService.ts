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

      // Save to Firestore
      await setDoc(doc(this.usersCollection, uid), filteredDoc);

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

      await updateDoc(doc(this.usersCollection, uid), {
        'loginCredentials.passwordHash': passwordHash,
        'loginCredentials.passwordUpdatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

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

      // Check password
      const passwordHash = this.hashPassword(password);
      const storedPasswordHash = userData.loginCredentials?.passwordHash;

      if (passwordHash !== storedPasswordHash) {
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
}

// Export singleton instance
export const superAdminUserService = new SuperAdminUserService();
export default superAdminUserService;
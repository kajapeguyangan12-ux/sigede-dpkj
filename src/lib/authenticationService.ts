import { 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db as firestore } from './firebase';
import { FIREBASE_COLLECTIONS, UserStatus } from './rolePermissions';
import { UserRole } from '../app/masyarakat/lib/useCurrentUser';
import { FirestoreUser } from './userManagementService';
import { createUserSession, terminateSession } from './sessionService';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  userId?: string; // For ID-based login
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  userName?: string;
  phoneNumber?: string;
  idNumber?: string;
  address?: string;
  isEmailVerified: boolean;
}

class AuthenticationService {
  private usersCollection = collection(firestore, FIREBASE_COLLECTIONS.USERS);

  // Login dengan Email/Username/UserID
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      console.log('🔐 AUTH: Login attempt with credentials:', {
        email: credentials.email,
        username: credentials.username,
        userId: credentials.userId,
        hasPassword: !!credentials.password
      });

      let userDoc: FirestoreUser | null = null;

      // 1. Cari user di Firestore berdasarkan identifier yang diberikan
      if (credentials.userId) {
        // Login dengan User ID
        userDoc = await this.findUserByAnyField(credentials.userId);
      } else if (credentials.email) {
        // Login dengan email
        userDoc = await this.findUserByEmail(credentials.email);
      } else if (credentials.username) {
        // Login dengan username
        userDoc = await this.findUserByUsername(credentials.username);
      } else {
        throw new Error('Email, username, atau ID user harus diisi');
      }

      if (!userDoc) {
        throw new Error('User tidak ditemukan dalam sistem');
      }

      // 2. Cek status user
      if (userDoc.status === 'suspended') {
        throw new Error('Akun Anda telah ditangguhkan. Hubungi administrator.');
      }

      if (userDoc.status === 'inactive') {
        throw new Error('Akun Anda tidak aktif. Hubungi administrator.');
      }

      if (userDoc.status === 'pending') {
        throw new Error('Akun Anda masih menunggu persetujuan administrator.');
      }

      // 3. Untuk sementara, skip Firebase Auth validation (karena user dibuat tanpa Firebase Auth)
      // TODO: Implement proper password validation when Firebase Auth integration is complete
      
      // 4. Sign in to Firebase Auth anonymously untuk Firebase Storage access
      try {
        console.log('🔐 AUTH: Signing in to Firebase Auth for Storage access...');
        await signInAnonymously(auth);
        console.log('✅ AUTH: Firebase Auth signed in successfully');
      } catch (authError) {
        console.warn('⚠️ AUTH: Firebase Auth sign-in failed (non-critical):', authError);
        // Continue anyway, storage might still work
      }
      
      // 5. Create session (terminates other sessions for this user)
      const userType = this.isAdmin(userDoc.role) ? 'admin' : 'masyarakat';
      try {
        await createUserSession(userDoc.uid, userType);
        console.log('✅ AUTH: Session created successfully');
      } catch (sessionError) {
        console.warn('⚠️ AUTH: Session creation failed (non-critical):', sessionError);
      }
      
      // 6. Update last login (non-blocking, runs in background)
      this.updateLastLogin(userDoc.uid);

      // 7. Return AuthUser object immediately
      const authUser: AuthUser = {
        uid: userDoc.uid,
        email: userDoc.email,
        displayName: userDoc.displayName,
        role: userDoc.role,
        status: userDoc.status,
        userName: userDoc.userName,
        phoneNumber: userDoc.phoneNumber,
        idNumber: userDoc.idNumber,
        address: userDoc.address,
        isEmailVerified: false // Since no Firebase Auth yet
      };

      console.log('✅ AUTH: Login successful:', authUser);
      return authUser;

    } catch (error) {
      console.error('❌ AUTH: Login failed:', error);
      throw error;
    }
  }

  // Cari user berdasarkan email
  private async findUserByEmail(email: string): Promise<FirestoreUser | null> {
    try {
      const q = query(this.usersCollection, where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as FirestoreUser;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Cari user berdasarkan username
  private async findUserByUsername(username: string): Promise<FirestoreUser | null> {
    try {
      const q = query(this.usersCollection, where('userName', '==', username));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as FirestoreUser;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  // Cari user berdasarkan berbagai field (ID, email, username) - OPTIMIZED
  private async findUserByAnyField(identifier: string): Promise<FirestoreUser | null> {
    try {
      console.log('🔍 AUTH: Searching for user:', identifier);
      
      // Run all queries in parallel for better performance
      const [uidSnapshot, emailSnapshot, usernameSnapshot, idNumberSnapshot] = await Promise.all([
        getDocs(query(this.usersCollection, where('uid', '==', identifier))),
        getDocs(query(this.usersCollection, where('email', '==', identifier))),
        getDocs(query(this.usersCollection, where('userName', '==', identifier))),
        getDocs(query(this.usersCollection, where('idNumber', '==', identifier)))
      ]);
      
      // Check results in priority order
      if (!uidSnapshot.empty) {
        console.log('✅ AUTH: User found by UID');
        return uidSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!emailSnapshot.empty) {
        console.log('✅ AUTH: User found by email');
        return emailSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!usernameSnapshot.empty) {
        console.log('✅ AUTH: User found by username');
        return usernameSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!idNumberSnapshot.empty) {
        console.log('✅ AUTH: User found by idNumber');
        return idNumberSnapshot.docs[0].data() as FirestoreUser;
      }

      console.log('❌ AUTH: User not found');
      return null;
    } catch (error) {
      console.error('❌ AUTH: Error finding user by any field:', error);
      return null;
    }
  }

  // Update last login timestamp - NON-BLOCKING
  private updateLastLogin(uid: string): void {
    // Run in background, don't await
    (async () => {
      try {
        const q = query(this.usersCollection, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          await updateDoc(docRef, {
            lastLoginAt: serverTimestamp()
          });
          console.log('✅ AUTH: Last login updated for uid:', uid);
        }
      } catch (error) {
        console.error('⚠️ AUTH: Error updating last login (non-critical):', error);
        // Don't throw error for this non-critical operation
      }
    })();
  }

  // Logout
  async logout(): Promise<void> {
    try {
      console.log('🚪 AUTH SERVICE: Starting logout');
      
      // 1. Terminate session first
      try {
        await terminateSession();
        console.log('✅ AUTH SERVICE: Session terminated');
      } catch (sessionError) {
        console.warn('⚠️ AUTH SERVICE: Session termination failed:', sessionError);
      }
      
      // 2. Clear all auth data
      if (typeof window !== 'undefined') {
        // Clear all possible auth-related items
        const keysToRemove = [
          'sigede_auth_user',
          'userId',
          'userRole',
          'firebase:authUser',
          'firebase:host',
        ];
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Clear any Firebase auth keys that start with specific patterns
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('firebase:') || key.startsWith('sigede_'))) {
            localStorage.removeItem(key);
          }
        }
        
        console.log('🧹 AUTH SERVICE: Cleared all auth storage');
      }
      
      // 3. Sign out from Firebase Auth
      if (auth.currentUser) {
        await firebaseSignOut(auth);
        console.log('✅ AUTH SERVICE: Firebase signOut successful');
      }
      
      console.log('✅ AUTH SERVICE: Logout complete');
      
    } catch (error) {
      console.error('❌ AUTH SERVICE: Logout error:', error);
      // Even if Firebase signout fails, we've cleared storage
      // Don't throw error to allow logout to complete
    }
  }

  // Get current user (if any Firebase Auth user exists)
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Cek apakah user adalah admin
  isAdmin(role: UserRole): boolean {
    return ['administrator', 'admin_desa', 'kepala_desa'].includes(role);
  }

  // Validate login credentials format
  validateCredentials(credentials: LoginCredentials): string | null {
    if (!credentials.userId && !credentials.email && !credentials.username) {
      return 'Email, username, atau ID user harus diisi';
    }

    if (credentials.email && !this.isValidEmail(credentials.email)) {
      return 'Format email tidak valid';
    }

    // Password validation is optional for now (temp login without Firebase Auth)
    
    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Create singleton instance
export const authService = new AuthenticationService();
export default authService;
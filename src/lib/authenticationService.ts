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
import { withFirebaseRetry } from './firebaseErrorHandler';

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
  nik?: string; // NIK untuk kepala dusun dan kepala desa
  address?: string;
  isEmailVerified: boolean;
}

class AuthenticationService {
  private usersCollection = collection(firestore, FIREBASE_COLLECTIONS.USERS);
  private masyarakatCollection = collection(firestore, 'masyarakat');
  private wargaLuarCollection = collection(firestore, 'Warga_LuarDPKJ');
  private superAdminCollection = collection(firestore, 'Super_Admin');
  private adminDesaCollection = collection(firestore, 'Admin_Desa');

  // Login dengan Email/Username/UserID
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      console.log('🔐 AUTH: Login attempt with credentials:', {
        email: credentials.email,
        username: credentials.username,
        userId: credentials.userId,
        hasPassword: !!credentials.password
      });

      // Add detailed debugging
      console.log('🔍 AUTH: Starting user search process...');

      // 1. Try to authenticate with Firebase Auth using actual admin credentials
      let authAttempts = 0;
      const maxAuthAttempts = 2; // Reduced from 3 to 2
      
      // Try to authenticate with managed user service first
      let preliminaryUserDoc: FirestoreUser | null = null;
      
      // Try managed user authentication
      if (credentials.email || credentials.username || credentials.userId) {
        try {
          const { superAdminUserService } = await import('./superAdminUserService');
          const identifier = credentials.email || credentials.username || credentials.userId || '';
          const password = credentials.password || '';
          
          if (password) {
            console.log('🔐 Trying managed user authentication...');
            const managedUser = await superAdminUserService.authenticateUser(identifier, password);
            
            if (managedUser) {
              console.log('✅ Managed user authentication successful');
              
              // Convert managed user to AuthUser format
              const authUser: AuthUser = {
                uid: managedUser.uid,
                email: managedUser.email,
                displayName: managedUser.displayName,
                role: managedUser.role,
                status: managedUser.status,
                userName: managedUser.userName,
                phoneNumber: managedUser.phoneNumber,
                idNumber: managedUser.idNumber,
                nik: managedUser.nik || managedUser.idNumber, // Include NIK
                address: managedUser.address,
                isEmailVerified: true
              };
              
              // Save to localStorage for session management
              localStorage.setItem('sigede_auth_user', JSON.stringify(authUser));
              localStorage.setItem('userId', authUser.uid);
              
              console.log('✅ Managed user login successful:', authUser);
              return authUser;
            }
          }
        } catch (managedAuthError) {
          console.log('⚠️ Managed user authentication failed, trying fallback:', managedAuthError);
        }
      }
      
      // Fallback to original authentication method
      if (credentials.userId) {
        preliminaryUserDoc = await this.findUserByAnyField(credentials.userId);
      } else if (credentials.email) {
        preliminaryUserDoc = await this.findUserByEmail(credentials.email);
      } else if (credentials.username) {
        preliminaryUserDoc = await this.findUserByUsername(credentials.username);
      }

      // Skip Firebase Auth for faster login - not needed for admin panel
      // Firebase Auth adds significant delay and is not required for Firestore-only auth
      console.log('ℹ️ AUTH: Using Firestore-only authentication (faster)');


      let userDoc: FirestoreUser | null = null;

      // 2. Cari user di Firestore berdasarkan identifier yang diberikan
      if (credentials.userId) {
        // Login dengan User ID
        console.log('🔍 AUTH: Searching by userId:', credentials.userId);
        userDoc = await this.findUserByAnyField(credentials.userId);
      } else if (credentials.email) {
        // Login dengan email
        console.log('🔍 AUTH: Searching by email:', credentials.email);
        userDoc = await this.findUserByEmail(credentials.email);
      } else if (credentials.username) {
        // Login dengan username
        console.log('🔍 AUTH: Searching by username:', credentials.username);
        userDoc = await this.findUserByUsername(credentials.username);
      } else {
        throw new Error('Email, username, atau ID user harus diisi');
      }

      console.log('🔍 AUTH: User search result:', userDoc ? 'FOUND' : 'NOT FOUND');

      if (!userDoc) {
        console.error('❌ AUTH: User not found in any collection');
        throw new Error('User tidak ditemukan dalam sistem');
      }

      console.log('✅ AUTH: User found:', {
        uid: userDoc.uid,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status
      });

      // 3. Cek status user
      if (userDoc.status === 'suspended') {
        throw new Error('Akun Anda telah ditangguhkan. Hubungi administrator.');
      }

      if (userDoc.status === 'inactive') {
        throw new Error('Akun Anda tidak aktif. Hubungi administrator.');
      }

      if (userDoc.status === 'pending') {
        throw new Error('Akun Anda masih menunggu persetujuan administrator.');
      }

      // 4. Password validation for Admin (Super Admin & Admin Desa)
      // Check if this is an Admin user and validate password from Firestore
      if ((userDoc.role === 'administrator' || userDoc.role === 'admin_desa') && credentials.password) {
        console.log(`🔐 AUTH: Validating ${userDoc.role} password`);
        
        if (userDoc.role === 'administrator') {
          // Get Super Admin data from Firestore
          const superAdminQuery = query(
            this.superAdminCollection, 
            where('email', '==', userDoc.email)
          );
          const superAdminSnapshot = await getDocs(superAdminQuery);
          
          if (!superAdminSnapshot.empty) {
            const superAdminData = superAdminSnapshot.docs[0].data();
            // Simple password comparison (in production, use bcrypt or similar)
            if (superAdminData.kataSandi !== credentials.password) {
              console.error('❌ AUTH: Super Admin password mismatch');
              throw new Error('Password salah');
            }
            console.log('✅ AUTH: Super Admin password validated');
          }
        } else if (userDoc.role === 'admin_desa') {
          // Get Admin Desa data from Firestore
          const adminDesaQuery = query(
            this.adminDesaCollection, 
            where('email', '==', userDoc.email)
          );
          const adminDesaSnapshot = await getDocs(adminDesaQuery);
          
          if (!adminDesaSnapshot.empty) {
            const adminDesaData = adminDesaSnapshot.docs[0].data();
            // Simple password comparison (in production, use bcrypt or similar)
            if (adminDesaData.kataSandi !== credentials.password) {
              console.error('❌ AUTH: Admin Desa password mismatch');
              throw new Error('Password salah');
            }
            console.log('✅ AUTH: Admin Desa password validated');
          }
        }
      }
      
      // 5. Create session (terminates other sessions for this user) with reduced retries
      const userType = this.isAdmin(userDoc.role) ? 'admin' : 'masyarakat';
      
      let sessionAttempts = 0;
      const maxSessionAttempts = 2; // Reduced from 3 to 2
      
      while (sessionAttempts < maxSessionAttempts) {
        try {
          await createUserSession(userDoc.uid, userType);
          console.log('✅ AUTH: Session created successfully');
          break;
        } catch (sessionError: any) {
          sessionAttempts++;
          console.warn(`⚠️ AUTH: Session creation attempt ${sessionAttempts} failed:`, sessionError.message);
          
          if (sessionAttempts < maxSessionAttempts) {
            console.log('🔄 AUTH: Retrying session creation...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
          } else {
            console.warn('⚠️ AUTH: All session creation attempts failed (continuing login)');
            // Continue login even if session creation fails
          }
        }
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
        nik: userDoc.nik || userDoc.idNumber, // Include NIK for kepala dusun/desa
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

  // Cari user berdasarkan email dengan error handling yang lebih baik - OPTIMIZED
  private async findUserByEmail(email: string): Promise<FirestoreUser | null> {
    try {
      console.log('🔍 AUTH: Searching user by email:', email);
      
      // Search all collections in parallel with retry mechanism
      const [usersSnapshot, masyarakatSnapshot, wargaLuarSnapshot, superAdminSnapshot] = await Promise.all([
        withFirebaseRetry(() => 
          getDocs(query(this.usersCollection, where('email', '==', email)))
        ).catch(err => {
          console.error('❌ AUTH: Users collection search failed:', err.message);
          return null;
        }),
        withFirebaseRetry(() =>
          getDocs(query(this.masyarakatCollection, where('email', '==', email)))
        ).catch(err => {
          console.error('❌ AUTH: Masyarakat collection search failed:', err.message);
          return null;
        }),
        withFirebaseRetry(() =>
          getDocs(query(this.wargaLuarCollection, where('email', '==', email)))
        ).catch(err => {
          console.error('❌ AUTH: Warga_LuarDPKJ collection search failed:', err.message);
          return null;
        }),
        withFirebaseRetry(() =>
          getDocs(query(this.superAdminCollection, where('email', '==', email)))
        ).catch(err => {
          console.error('❌ AUTH: Super_Admin collection search failed:', err.message);
          return null;
        })
      ]);
      
      // Check results - prioritize Super_Admin first
      if (superAdminSnapshot && !superAdminSnapshot.empty) {
        console.log('✅ AUTH: User found in Super_Admin collection');
        const data = superAdminSnapshot.docs[0].data();
        // Convert Super_Admin data to FirestoreUser format
        return {
          uid: data.id,
          email: data.email,
          displayName: data.namaLengkap || data.name,
          role: 'administrator' as UserRole, // Super admin gets administrator role
          status: data.status || 'active',
          userName: data.username,
          phoneNumber: data.noTelepon || '',
          isEmailVerified: true,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as FirestoreUser;
      }

      if (usersSnapshot && !usersSnapshot.empty) {
        console.log('✅ AUTH: User found in users collection');
        return usersSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (masyarakatSnapshot && !masyarakatSnapshot.empty) {
        console.log('✅ AUTH: User found in masyarakat collection');
        return masyarakatSnapshot.docs[0].data() as FirestoreUser;
      }

      if (wargaLuarSnapshot && !wargaLuarSnapshot.empty) {
        console.log('✅ AUTH: User found in Warga_LuarDPKJ collection');
        return wargaLuarSnapshot.docs[0].data() as FirestoreUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  // Cari user berdasarkan username
  private async findUserByUsername(username: string): Promise<FirestoreUser | null> {
    try {
      // Search in all collections: users, masyarakat, Warga_LuarDPKJ, and Super_Admin
      const [usersSnapshot, masyarakatSnapshot, wargaLuarSnapshot, superAdminSnapshot] = await Promise.all([
        getDocs(query(this.usersCollection, where('userName', '==', username))),
        getDocs(query(this.masyarakatCollection, where('userName', '==', username))),
        getDocs(query(this.wargaLuarCollection, where('userName', '==', username))),
        getDocs(query(this.superAdminCollection, where('username', '==', username)))
      ]);
      
      // Prioritize Super_Admin
      if (!superAdminSnapshot.empty) {
        console.log('✅ AUTH: User found in Super_Admin collection');
        const data = superAdminSnapshot.docs[0].data();
        return {
          uid: data.id,
          email: data.email,
          displayName: data.namaLengkap || data.name,
          role: 'administrator' as UserRole,
          status: data.status || 'active',
          userName: data.username,
          phoneNumber: data.noTelepon || '',
          isEmailVerified: true,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as FirestoreUser;
      }

      if (!usersSnapshot.empty) {
        console.log('✅ AUTH: User found in users collection');
        return usersSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!masyarakatSnapshot.empty) {
        console.log('✅ AUTH: User found in masyarakat collection');
        return masyarakatSnapshot.docs[0].data() as FirestoreUser;
      }

      if (!wargaLuarSnapshot.empty) {
        console.log('✅ AUTH: User found in Warga_LuarDPKJ collection');
        return wargaLuarSnapshot.docs[0].data() as FirestoreUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  // Cari user berdasarkan berbagai field (ID, email, username) - OPTIMIZED
  private async findUserByAnyField(identifier: string): Promise<FirestoreUser | null> {
    try {
      console.log('🔍 AUTH: Searching for user:', identifier);
      
      // Run all queries in parallel for better performance - check all collections including Super_Admin
      const [
        usersUidSnapshot, usersEmailSnapshot, usersUsernameSnapshot, usersIdNumberSnapshot,
        masyarakatUidSnapshot, masyarakatEmailSnapshot, masyarakatUsernameSnapshot, masyarakatIdNumberSnapshot,
        wargaLuarUidSnapshot, wargaLuarEmailSnapshot, wargaLuarUsernameSnapshot,
        superAdminIdSnapshot, superAdminEmailSnapshot, superAdminUsernameSnapshot
      ] = await Promise.all([
        // Search in users collection
        getDocs(query(this.usersCollection, where('uid', '==', identifier))),
        getDocs(query(this.usersCollection, where('email', '==', identifier))),
        getDocs(query(this.usersCollection, where('userName', '==', identifier))),
        getDocs(query(this.usersCollection, where('idNumber', '==', identifier))),
        // Search in masyarakat collection
        getDocs(query(this.masyarakatCollection, where('uid', '==', identifier))),
        getDocs(query(this.masyarakatCollection, where('email', '==', identifier))),
        getDocs(query(this.masyarakatCollection, where('userName', '==', identifier))),
        getDocs(query(this.masyarakatCollection, where('idNumber', '==', identifier))),
        // Search in Warga_LuarDPKJ collection
        getDocs(query(this.wargaLuarCollection, where('uid', '==', identifier))),
        getDocs(query(this.wargaLuarCollection, where('email', '==', identifier))),
        getDocs(query(this.wargaLuarCollection, where('userName', '==', identifier))),
        // Search in Super_Admin collection
        getDocs(query(this.superAdminCollection, where('id', '==', identifier))),
        getDocs(query(this.superAdminCollection, where('email', '==', identifier))),
        getDocs(query(this.superAdminCollection, where('username', '==', identifier)))
      ]);
      
      // Check Super_Admin first (highest priority)
      if (!superAdminIdSnapshot.empty) {
        console.log('✅ AUTH: Super Admin found by ID');
        const data = superAdminIdSnapshot.docs[0].data();
        return {
          uid: data.id,
          email: data.email,
          displayName: data.namaLengkap || data.name,
          role: 'administrator' as UserRole,
          status: data.status || 'active',
          userName: data.username,
          phoneNumber: data.noTelepon || '',
          isEmailVerified: true,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as FirestoreUser;
      }

      if (!superAdminEmailSnapshot.empty) {
        console.log('✅ AUTH: Super Admin found by email');
        const data = superAdminEmailSnapshot.docs[0].data();
        return {
          uid: data.id,
          email: data.email,
          displayName: data.namaLengkap || data.name,
          role: 'administrator' as UserRole,
          status: data.status || 'active',
          userName: data.username,
          phoneNumber: data.noTelepon || '',
          isEmailVerified: true,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as FirestoreUser;
      }

      if (!superAdminUsernameSnapshot.empty) {
        console.log('✅ AUTH: Super Admin found by username');
        const data = superAdminUsernameSnapshot.docs[0].data();
        return {
          uid: data.id,
          email: data.email,
          displayName: data.namaLengkap || data.name,
          role: 'administrator' as UserRole,
          status: data.status || 'active',
          userName: data.username,
          phoneNumber: data.noTelepon || '',
          isEmailVerified: true,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        } as FirestoreUser;
      }

      // Check results in priority order - users collection
      if (!usersUidSnapshot.empty) {
        console.log('✅ AUTH: User found by UID in users collection');
        return usersUidSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!usersEmailSnapshot.empty) {
        console.log('✅ AUTH: User found by email in users collection');
        return usersEmailSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!usersUsernameSnapshot.empty) {
        console.log('✅ AUTH: User found by username in users collection');
        return usersUsernameSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!usersIdNumberSnapshot.empty) {
        console.log('✅ AUTH: User found by idNumber in users collection');
        return usersIdNumberSnapshot.docs[0].data() as FirestoreUser;
      }
      
      // Check masyarakat collection
      if (!masyarakatUidSnapshot.empty) {
        console.log('✅ AUTH: User found by UID in masyarakat collection');
        return masyarakatUidSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!masyarakatEmailSnapshot.empty) {
        console.log('✅ AUTH: User found by email in masyarakat collection');
        return masyarakatEmailSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!masyarakatUsernameSnapshot.empty) {
        console.log('✅ AUTH: User found by username in masyarakat collection');
        return masyarakatUsernameSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!masyarakatIdNumberSnapshot.empty) {
        console.log('✅ AUTH: User found by idNumber in masyarakat collection');
        return masyarakatIdNumberSnapshot.docs[0].data() as FirestoreUser;
      }

      // Check Warga_LuarDPKJ collection
      if (!wargaLuarUidSnapshot.empty) {
        console.log('✅ AUTH: User found by UID in Warga_LuarDPKJ collection');
        return wargaLuarUidSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!wargaLuarEmailSnapshot.empty) {
        console.log('✅ AUTH: User found by email in Warga_LuarDPKJ collection');
        return wargaLuarEmailSnapshot.docs[0].data() as FirestoreUser;
      }
      
      if (!wargaLuarUsernameSnapshot.empty) {
        console.log('✅ AUTH: User found by username in Warga_LuarDPKJ collection');
        return wargaLuarUsernameSnapshot.docs[0].data() as FirestoreUser;
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
    return ['administrator', 'admin_desa'].includes(role);
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
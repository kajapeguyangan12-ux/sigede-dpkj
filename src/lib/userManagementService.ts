import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, db as firestore } from './firebase';
import { UserRole } from '../app/masyarakat/lib/useCurrentUser';
import { 
  FirestoreUser, 
  UserStatus, 
  FIREBASE_COLLECTIONS 
} from './rolePermissions';

// Interface untuk user dengan data yang diperlukan
export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  userName?: string;
  idNumber?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}

export interface UpdateUserData {
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  userName?: string;
  idNumber?: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}

// Class untuk mengelola users
class UserManagementService {
  private usersCollection = collection(firestore, FIREBASE_COLLECTIONS.USERS);
  private userProfilesCollection = collection(firestore, FIREBASE_COLLECTIONS.USER_PROFILES);
  private adminLogsCollection = collection(firestore, FIREBASE_COLLECTIONS.ADMIN_LOGS);
  private masyarakatCollection = collection(firestore, 'masyarakat');
  private wargaLuarDPKJCollection = collection(firestore, 'Warga_LuarDPKJ');

  // Membuat user baru (hanya bisa dilakukan oleh admin)
  async createUser(userData: CreateUserData, createdBy: string): Promise<string> {
    console.log('🎯 SERVICE: createUser called');
    console.log('📝 SERVICE: userData received:', userData);
    console.log('👤 SERVICE: createdBy:', createdBy);
    
    try {
      console.log('🔧 SERVICE: Generating temp user ID...');
      // Generate unique ID untuk user (temporary solution)
      const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 SERVICE: Generated temp ID:', tempUserId);
      
      console.log('📊 SERVICE: Preparing Firestore data...');
      // Simpan data lengkap ke Firestore tanpa Firebase Auth untuk sementara
      const firestoreUserData: FirestoreUser = {
        uid: tempUserId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: 'pending' as UserStatus, // Set as pending karena belum ada Firebase Auth
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: createdBy,
        initialPassword: userData.password, // Simpan password awal untuk ditampilkan ke admin
        notes: userData.notes ? `${userData.notes}\n\n[TEMP] User created without Firebase Auth - needs email/password setup` : '[TEMP] User created without Firebase Auth - needs email/password setup'
      };

      // Tambahkan field optional hanya jika ada nilai (tidak undefined)
      if (userData.userName) {
        firestoreUserData.userName = userData.userName;
      }
      if (userData.idNumber) {
        firestoreUserData.idNumber = userData.idNumber;
      }
      if (userData.phoneNumber) {
        firestoreUserData.phoneNumber = userData.phoneNumber;
      }
      if (userData.address) {
        firestoreUserData.address = userData.address;
      }
      // profileImageUrl sengaja tidak disertakan karena undefined
      
      console.log('💾 SERVICE: Firestore data prepared:', firestoreUserData);
      console.log('📡 SERVICE: Calling addDoc to Firestore...');
      
      const docRef = await addDoc(this.usersCollection, firestoreUserData);
      
      console.log('✅ SERVICE: Document added successfully with ID:', docRef.id);
      console.log('📝 SERVICE: Logging admin activity...');

      // Log aktivitas admin
      await this.logAdminActivity(
        createdBy, 
        'CREATE_USER', 
        `Created user profile ${userData.displayName} with role ${userData.role} (Firestore only)`,
        { 
          targetUserId: tempUserId, 
          targetUserEmail: userData.email,
          docId: docRef.id,
          note: 'User created in Firestore only, Firebase Auth setup pending'
        }
      );
      
      console.log('🎉 SERVICE: User creation completed successfully!');
      console.log('🔙 SERVICE: Returning tempUserId:', tempUserId);

      return tempUserId;
    } catch (error: any) {
      console.error('💥 SERVICE ERROR:', error);
      console.error('💥 SERVICE ERROR details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  // Approve user (change status from pending to active)
  async approveUser(uid: string, approvedBy: string): Promise<void> {
    try {
      console.log('📝 SERVICE: Approving user:', uid);
      
      // Find user document by uid
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('User tidak ditemukan');
      }
      
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, {
        status: 'active',
        updatedAt: serverTimestamp(),
        approvedBy: approvedBy,
        approvedAt: serverTimestamp()
      });

      // Log activity
      await this.logAdminActivity(
        approvedBy,
        'APPROVE_USER',
        `Approved user ${userDoc.data().displayName}`,
        { targetUserId: uid }
      );

      console.log('✅ SERVICE: User approved successfully');
    } catch (error) {
      console.error('❌ SERVICE: Error approving user:', error);
      throw error;
    }
  }

  // Reject user (delete the pending user)
  async rejectUser(uid: string, rejectedBy: string, reason?: string): Promise<void> {
    try {
      console.log('🗑️ SERVICE: Rejecting user:', uid);
      
      // Find user document by uid
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('User tidak ditemukan');
      }
      
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Log activity before deletion
      await this.logAdminActivity(
        rejectedBy,
        'REJECT_USER',
        `Rejected user ${userData.displayName} - Reason: ${reason || 'No reason provided'}`,
        { 
          targetUserId: uid,
          targetUserEmail: userData.email,
          rejectionReason: reason 
        }
      );

      // Delete the user document
      await deleteDoc(userDoc.ref);

      console.log('✅ SERVICE: User rejected and deleted successfully');
    } catch (error) {
      console.error('❌ SERVICE: Error rejecting user:', error);
      throw error;
    }
  }

  // Mendapatkan semua user berdasarkan role
  async getUsersByRole(role?: UserRole): Promise<FirestoreUser[]> {
    try {
      const users: FirestoreUser[] = [];

      // 1. Query dari collection 'users' (existing logic)
      let q;
      if (role) {
        q = query(
          this.usersCollection,
          where('role', '==', role)
        );
      } else {
        q = query(this.usersCollection);
      }

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter client-side untuk menghindari composite index
        if (data.status !== 'deleted') {
          users.push({
            ...data,
            // Convert Firestore Timestamps to Date for easier handling
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
            lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt,
          } as FirestoreUser);
        }
      });

      // 2. Query dari collection 'masyarakat' untuk role masyarakat
      if (!role || role === 'warga_dpkj' || role === 'warga_luar_dpkj') {
        try {
          const masyarakatSnapshot = await getDocs(this.masyarakatCollection);
          
          masyarakatSnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Map data masyarakat ke format FirestoreUser
            const mappedUser: FirestoreUser = {
              uid: doc.id,
              email: data.email || '',
              displayName: data.nama || data.displayName || 'Nama tidak tersedia',
              role: data.role || 'warga_luar_dpkj', // Default role
              status: data.status || 'active', // Default status
              createdAt: data.createdAt?.toDate?.() || data.tanggalDaftar?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              lastLoginAt: data.lastLoginAt?.toDate?.() || null,
              // Additional fields from masyarakat collection
              userName: data.userName || data.username,
              initialPassword: data.initialPassword || data.password || data.kataSandi, // Ambil password
              idNumber: data.nik || data.idNumber,
              phoneNumber: data.noTelp || data.phoneNumber || data.phone,
              address: data.alamat || data.address,
              notes: `Data dari collection masyarakat`,
              // Extra masyarakat-specific fields
              nik: data.nik,
              alamat: data.alamat,
              noTelp: data.noTelp,
              tanggalLahir: data.tanggalLahir?.toDate?.() || null,
              tempatLahir: data.tempatLahir,
              jenisKelamin: data.jenisKelamin,
              pekerjaan: data.pekerjaan,
              agama: data.agama,
              statusPerkawinan: data.statusPerkawinan
            };

            // Filter by role if specified
            if (!role || mappedUser.role === role) {
              users.push(mappedUser);
            }
          });
        } catch (masyarakatError) {
          console.warn('Error querying masyarakat collection:', masyarakatError);
          // Continue execution even if masyarakat query fails
        }
      }

      // Sort client-side
      users.sort((a, b) => {
        // Sort by status first
        if (a.status !== b.status) {
          const statusOrder = ['active', 'pending', 'inactive', 'suspended'];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        }
        // Then by display name
        return (a.displayName || '').localeCompare(b.displayName || '');
      });

      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Mendapatkan user berdasarkan collection tertentu
  async getUsersByCollection(collectionName: string): Promise<FirestoreUser[]> {
    try {
      console.log(`🔍 SERVICE: Getting users from collection: ${collectionName}`);
      const users: FirestoreUser[] = [];
      const targetCollection = collection(firestore, collectionName);

      const snapshot = await getDocs(targetCollection);
      console.log(`📊 SERVICE: Found ${snapshot.size} documents in ${collectionName}`);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📄 SERVICE: Processing document ${doc.id}:`, data);
        
        // Map data collection ke format FirestoreUser
        const mappedUser: FirestoreUser = {
          uid: doc.id,
          email: data.email || '',
          displayName: data.namaLengkap || data.nama || data.displayName || 'Nama tidak tersedia',
          role: data.role || data.roleUser || (
            collectionName === 'masyarakat' ? 'warga_dpkj' : 
            collectionName === 'Warga_LuarDPKJ' ? 'warga_luar_dpkj' :
            collectionName === 'Super_Admin' ? 'super_admin' :
            'unknown'
          ),
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate?.() || data.tanggalDaftar?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate?.() || null,
          // Additional fields
          userName: data.userName || data.username,
          initialPassword: data.initialPassword || data.password || data.kataSandi, // Ambil password dari berbagai field
          idNumber: data.nik || data.idNumber || data.id,
          phoneNumber: data.noTelepon || data.noTelp || data.phoneNumber || data.phone,
          address: data.alamat || data.address,
          notes: `Data dari collection ${collectionName}`,
          // Masyarakat-specific fields
          nik: data.nik,
          alamat: data.alamat,
          noTelp: data.noTelp,
          tanggalLahir: data.tanggalLahir?.toDate?.() || null,
          tempatLahir: data.tempatLahir,
          jenisKelamin: data.jenisKelamin,
          pekerjaan: data.pekerjaan,
          agama: data.agama,
          statusPerkawinan: data.statusPerkawinan
        };

        console.log(`✅ SERVICE: Mapped user:`, mappedUser);
        users.push(mappedUser);
      });

      // Sort client-side
      users.sort((a, b) => {
        // Sort by status first
        if (a.status !== b.status) {
          const statusOrder = ['active', 'pending', 'inactive', 'suspended'];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        }
        // Then by display name
        return (a.displayName || '').localeCompare(b.displayName || '');
      });

      console.log(`🎯 SERVICE: Returning ${users.length} users from ${collectionName}`);
      return users;
    } catch (error) {
      console.error(`Error getting users from collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Mendapatkan user berdasarkan UID
  async getUserById(uid: string): Promise<FirestoreUser | null> {
    try {
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt,
      } as FirestoreUser;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Mendapatkan user berdasarkan ID Number
  async getUserByIdNumber(idNumber: string): Promise<FirestoreUser | null> {
    try {
      // Simple query tanpa composite index
      const q = query(
        this.usersCollection, 
        where('idNumber', '==', idNumber)
      );
      const snapshot = await getDocs(q);
      
      // Filter client-side untuk status
      const validDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status !== 'deleted';
      });

      if (validDocs.length === 0) {
        return null;
      }

      const doc = validDocs[0];
      const data = doc.data();
      
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt,
      } as FirestoreUser;
    } catch (error) {
      console.error('Error getting user by ID number:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(uid: string, updateData: UpdateUserData, updatedBy: string): Promise<void> {
    try {
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('User not found');
      }

      const docRef = snapshot.docs[0].ref;
      const currentData = snapshot.docs[0].data();
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Log aktivitas admin
      await this.logAdminActivity(
        updatedBy,
        'UPDATE_USER',
        `Updated user ${currentData.displayName}`,
        { 
          targetUserId: uid, 
          targetUserEmail: currentData.email,
          changes: updateData 
        }
      );
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Soft delete user (mengubah status menjadi deleted)
  async deleteUser(uid: string, deletedBy: string): Promise<void> {
    try {
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('User not found');
      }

      const docRef = snapshot.docs[0].ref;
      const currentData = snapshot.docs[0].data();
      
      await updateDoc(docRef, {
        status: 'deleted' as UserStatus,
        updatedAt: serverTimestamp()
      });

      // Log aktivitas admin
      await this.logAdminActivity(
        deletedBy,
        'DELETE_USER',
        `Deleted user ${currentData.displayName}`,
        { 
          targetUserId: uid, 
          targetUserEmail: currentData.email 
        }
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update last login time
  async updateLastLogin(uid: string): Promise<void> {
    try {
      const q = query(this.usersCollection, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          lastLoginAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for login tracking
    }
  }

  // Log aktivitas admin
  private async logAdminActivity(
    adminId: string, 
    action: string, 
    description: string, 
    metadata?: any
  ): Promise<void> {
    try {
      await addDoc(this.adminLogsCollection, {
        adminId,
        action,
        description,
        metadata: metadata || {},
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
      // Don't throw error for logging
    }
  }

  // Get statistics
  async getUserStats(): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    usersByStatus: Record<UserStatus, number>;
  }> {
    try {
      const snapshot = await getDocs(
        query(this.usersCollection, where('status', '!=', 'deleted'))
      );
      
      const stats = {
        totalUsers: snapshot.size,
        usersByRole: {} as Record<UserRole, number>,
        usersByStatus: {} as Record<UserStatus, number>
      };

      // Initialize counters
      const roles: UserRole[] = ['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun', 'warga_dpkj', 'warga_luar_dpkj', 'unknown'];
      const statuses: UserStatus[] = ['active', 'inactive', 'suspended', 'pending'];
      
      roles.forEach(role => stats.usersByRole[role] = 0);
      statuses.forEach(status => stats.usersByStatus[status] = 0);

      // Count users
      snapshot.forEach(doc => {
        const data = doc.data();
        const role = data.role as UserRole;
        const status = data.status as UserStatus;
        
        if (role && stats.usersByRole[role] !== undefined) {
          stats.usersByRole[role]++;
        }
        if (status && stats.usersByStatus[status] !== undefined) {
          stats.usersByStatus[status]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Batch create users (untuk migrasi data atau import)
  async batchCreateUsers(users: CreateUserData[], createdBy: string): Promise<{
    success: number;
    failed: Array<{ user: CreateUserData; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: [] as Array<{ user: CreateUserData; error: string }>
    };

    for (const userData of users) {
      try {
        await this.createUser(userData, createdBy);
        results.success++;
      } catch (error) {
        results.failed.push({
          user: userData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Self-registration untuk masyarakat (tanpa persetujuan admin)
  async registerMasyarakat(userData: {
    username: string;
    displayName: string;
    nik: string;
    alamat: string;
    daerah?: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    agama: string;
    pekerjaan: string;
    statusKawin: string;
    kewarganegaraan: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<{ success: boolean; userId?: string; message: string }> {
    console.log('🎯 SERVICE: registerMasyarakat called');
    console.log('📝 SERVICE: Registration data:', { ...userData, password: '***' });
    
    try {
      // Cek apakah email sudah terdaftar di collection masyarakat
      console.log('🔍 SERVICE: Checking if email already exists in masyarakat...');
      const emailQuery = query(this.masyarakatCollection, where('email', '==', userData.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        console.log('❌ SERVICE: Email already registered');
        return {
          success: false,
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
        };
      }

      // Cek apakah username sudah terdaftar di collection masyarakat
      console.log('🔍 SERVICE: Checking if username already exists in masyarakat...');
      const usernameQuery = query(this.masyarakatCollection, where('userName', '==', userData.username));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        console.log('❌ SERVICE: Username already taken');
        return {
          success: false,
          message: 'Username sudah digunakan. Silakan pilih username lain.'
        };
      }

      // Cek apakah NIK sudah terdaftar di collection masyarakat
      console.log('🔍 SERVICE: Checking if NIK already exists in masyarakat...');
      const nikQuery = query(this.masyarakatCollection, where('idNumber', '==', userData.nik));
      const nikSnapshot = await getDocs(nikQuery);
      
      if (!nikSnapshot.empty) {
        console.log('❌ SERVICE: NIK already registered');
        return {
          success: false,
          message: 'NIK sudah terdaftar. Jika ini akun Anda, silakan login.'
        };
      }

      // Generate unique ID untuk user
      console.log('🔧 SERVICE: Generating user ID...');
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 SERVICE: Generated user ID:', userId);
      
      // Simpan data user ke Firestore collection 'masyarakat' dengan role 'warga'
      console.log('💾 SERVICE: Preparing Firestore data for masyarakat collection...');
      const firestoreUserData: FirestoreUser = {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        userName: userData.username,
        idNumber: userData.nik,
        phoneNumber: userData.phoneNumber,
        initialPassword: userData.password, // Simpan password untuk ditampilkan ke admin
        role: 'warga' as UserRole,
        status: 'active' as UserStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        notes: 'Self-registered user from masyarakat registration page',
        // Data lengkap dari form registrasi
        nik: userData.nik,
        alamat: userData.alamat,
        daerah: userData.daerah || '',
        tempatLahir: userData.tempatLahir,
        tanggalLahir: userData.tanggalLahir,
        jenisKelamin: userData.jenisKelamin,
        agama: userData.agama,
        pekerjaan: userData.pekerjaan,
        statusPerkawinan: userData.statusKawin,
        kewarganegaraan: userData.kewarganegaraan,
        noTelp: userData.phoneNumber
      };
      
      console.log('💾 SERVICE: Firestore data prepared with all fields:', {
        ...firestoreUserData,
        createdAt: '[timestamp]',
        updatedAt: '[timestamp]'
      });
      console.log('📡 SERVICE: Saving to masyarakat collection...');
      
      const docRef = await addDoc(this.masyarakatCollection, firestoreUserData);
      
      console.log('✅ SERVICE: User registered successfully in masyarakat collection with doc ID:', docRef.id);
      console.log('🎉 SERVICE: Registration completed! User can now login.');

      return {
        success: true,
        userId: userId,
        message: 'Pendaftaran berhasil! Silakan login untuk melanjutkan.'
      };
    } catch (error: any) {
      console.error('💥 SERVICE ERROR during registration:', error);
      console.error('💥 SERVICE ERROR details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      return {
        success: false,
        message: `Terjadi kesalahan saat mendaftar: ${error.message || 'Unknown error'}`
      };
    }
  }

  // Registrasi khusus untuk warga luar DPKJ (hanya perlu username, phone, email, password)
  async registerWargaLuar(userData: {
    username: string;
    phoneNumber: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; userId?: string; message: string }> {
    console.log('🎯 SERVICE: registerWargaLuar called');
    console.log('📝 SERVICE: Registration data:', { ...userData, password: '***' });
    
    try {
      // Cek apakah email sudah terdaftar di collection Warga_LuarDPKJ
      console.log('🔍 SERVICE: Checking if email already exists in Warga_LuarDPKJ...');
      const emailQuery = query(
        collection(firestore, 'Warga_LuarDPKJ'), 
        where('email', '==', userData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        console.log('❌ SERVICE: Email already registered');
        return {
          success: false,
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
        };
      }

      // Cek apakah username sudah terdaftar di collection Warga_LuarDPKJ
      console.log('🔍 SERVICE: Checking if username already exists in Warga_LuarDPKJ...');
      const usernameQuery = query(
        collection(firestore, 'Warga_LuarDPKJ'), 
        where('userName', '==', userData.username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        console.log('❌ SERVICE: Username already taken');
        return {
          success: false,
          message: 'Username sudah digunakan. Silakan pilih username lain.'
        };
      }

      // Generate unique ID untuk user
      console.log('🔧 SERVICE: Generating user ID...');
      const userId = `warga_luar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 SERVICE: Generated user ID:', userId);
      
      // Simpan data user ke Firestore collection 'Warga_LuarDPKJ' dengan role 'warga_luar_dpkj'
      console.log('💾 SERVICE: Preparing Firestore data for Warga_LuarDPKJ collection...');
      const firestoreUserData: FirestoreUser = {
        uid: userId,
        email: userData.email,
        displayName: userData.username, // Use username as display name for warga luar
        userName: userData.username,
        phoneNumber: userData.phoneNumber,
        initialPassword: userData.password, // Simpan password untuk ditampilkan ke admin
        role: 'warga_luar_dpkj' as UserRole, // Set role sebagai 'warga_luar_dpkj'
        status: 'active' as UserStatus, // Langsung active, tidak perlu approval admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId, // Self-registered
        notes: 'Self-registered warga luar DPKJ user'
      };
      
      console.log('💾 SERVICE: Firestore data prepared (role: warga_luar_dpkj, status: active)');
      console.log('📡 SERVICE: Saving to Warga_LuarDPKJ collection...');
      
      const docRef = await addDoc(collection(firestore, 'Warga_LuarDPKJ'), firestoreUserData);
      
      console.log('✅ SERVICE: User registered successfully in Warga_LuarDPKJ collection with doc ID:', docRef.id);
      console.log('🎉 SERVICE: Registration completed! User can now login.');

      return {
        success: true,
        userId: userId,
        message: 'Pendaftaran berhasil! Silakan login untuk melanjutkan.'
      };
    } catch (error: any) {
      console.error('💥 SERVICE ERROR during warga luar registration:', error);
      console.error('💥 SERVICE ERROR details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      return {
        success: false,
        message: `Terjadi kesalahan saat mendaftar: ${error.message || 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();

// Export types and functions for easier import
export type { FirestoreUser, UserStatus };
export default userManagementService;
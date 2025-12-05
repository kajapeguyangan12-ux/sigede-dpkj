import { UserRole } from '../app/masyarakat/lib/useCurrentUser';

// Permission structure for CRUD operations
export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  'e-news': Permission;
  'profil-desa': Permission;
  'regulasi-desa': Permission;
  'keuangan': Permission;
  'layanan-publik': Permission;
  'ikm': Permission;
  'wisata-budaya': Permission;
  'pengaduan': Permission;
  'e-umkm': Permission;
  'kelola-pengguna': Permission;
  'data-desa': Permission;
  'super-admin': Permission;
}

// Administrative access control
export interface AdminAccess {
  canAccessAdminPanel: boolean;
  canAccessMasyarakatPanel: boolean;
}

// Data Desa specific access control
export interface DataDesaAccess {
  canAccessAnalisisData: boolean;
}

// Role permissions mapping
export const rolePermissions: Record<UserRole, RolePermissions> = {
  super_admin: {
    'e-news': { read: true, create: true, update: true, delete: true },
    'profil-desa': { read: true, create: true, update: true, delete: true },
    'regulasi-desa': { read: true, create: true, update: true, delete: true },
    'keuangan': { read: true, create: true, update: true, delete: true },
    'layanan-publik': { read: true, create: true, update: true, delete: true },
    'ikm': { read: true, create: true, update: true, delete: true },
    'wisata-budaya': { read: true, create: true, update: true, delete: true },
    'pengaduan': { read: true, create: true, update: true, delete: true },
    'e-umkm': { read: true, create: true, update: true, delete: true },
    'kelola-pengguna': { read: true, create: true, update: true, delete: true },
    'data-desa': { read: true, create: true, update: true, delete: true },
    'super-admin': { read: true, create: true, update: true, delete: true },
  },
  
  administrator: {
    'e-news': { read: true, create: true, update: true, delete: true },
    'profil-desa': { read: true, create: true, update: true, delete: true },
    'regulasi-desa': { read: true, create: true, update: true, delete: true },
    'keuangan': { read: true, create: true, update: true, delete: true },
    'layanan-publik': { read: true, create: true, update: true, delete: true },
    'ikm': { read: true, create: true, update: true, delete: true },
    'wisata-budaya': { read: true, create: true, update: true, delete: true },
    'pengaduan': { read: true, create: true, update: true, delete: true },
    'e-umkm': { read: true, create: true, update: true, delete: true },
    'kelola-pengguna': { read: true, create: true, update: true, delete: true },
    'data-desa': { read: true, create: true, update: true, delete: true },
    'super-admin': { read: true, create: true, update: true, delete: true },
  },
  
  admin_desa: {
    'e-news': { read: true, create: true, update: true, delete: true },
    'profil-desa': { read: true, create: true, update: true, delete: true },
    'regulasi-desa': { read: true, create: true, update: true, delete: true },
    'keuangan': { read: true, create: true, update: true, delete: true },
    'layanan-publik': { read: true, create: true, update: true, delete: true },
    'ikm': { read: true, create: true, update: true, delete: true },
    'wisata-budaya': { read: true, create: true, update: true, delete: true },
    'pengaduan': { read: true, create: true, update: true, delete: true },
    'e-umkm': { read: true, create: true, update: true, delete: true },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: true, create: true, update: true, delete: true },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
  
  kepala_desa: {
    'e-news': { read: false, create: false, update: false, delete: false },
    'profil-desa': { read: false, create: false, update: false, delete: false },
    'regulasi-desa': { read: false, create: false, update: false, delete: false },
    'keuangan': { read: false, create: false, update: false, delete: false },
    'layanan-publik': { read: true, create: true, update: true, delete: true },
    'ikm': { read: false, create: false, update: false, delete: false },
    'wisata-budaya': { read: false, create: false, update: false, delete: false },
    'pengaduan': { read: false, create: false, update: false, delete: false },
    'e-umkm': { read: false, create: false, update: false, delete: false },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: true, create: true, update: true, delete: true },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
  
  kepala_dusun: {
    'e-news': { read: false, create: false, update: false, delete: false },
    'profil-desa': { read: false, create: false, update: false, delete: false },
    'regulasi-desa': { read: false, create: false, update: false, delete: false },
    'keuangan': { read: false, create: false, update: false, delete: false },
    'layanan-publik': { read: true, create: true, update: true, delete: true },
    'ikm': { read: false, create: false, update: false, delete: false },
    'wisata-budaya': { read: false, create: false, update: false, delete: false },
    'pengaduan': { read: true, create: true, update: true, delete: true },
    'e-umkm': { read: false, create: false, update: false, delete: false },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: false, create: false, update: false, delete: false },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
  
  warga_dpkj: {
    'e-news': { read: false, create: false, update: false, delete: false },
    'profil-desa': { read: false, create: false, update: false, delete: false },
    'regulasi-desa': { read: false, create: false, update: false, delete: false },
    'keuangan': { read: false, create: false, update: false, delete: false },
    'layanan-publik': { read: false, create: false, update: false, delete: false },
    'ikm': { read: false, create: false, update: false, delete: false },
    'wisata-budaya': { read: false, create: false, update: false, delete: false },
    'pengaduan': { read: false, create: false, update: false, delete: false },
    'e-umkm': { read: false, create: false, update: false, delete: false },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: false, create: false, update: false, delete: false },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
  
  warga_luar_dpkj: {
    'e-news': { read: true, create: false, update: false, delete: false },
    'profil-desa': { read: false, create: false, update: false, delete: false },
    'regulasi-desa': { read: false, create: false, update: false, delete: false },
    'keuangan': { read: false, create: false, update: false, delete: false },
    'layanan-publik': { read: false, create: false, update: false, delete: false },
    'ikm': { read: false, create: false, update: false, delete: false },
    'wisata-budaya': { read: true, create: false, update: false, delete: false },
    'pengaduan': { read: false, create: false, update: false, delete: false },
    'e-umkm': { read: true, create: true, update: true, delete: true },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: false, create: false, update: false, delete: false },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
  
  unknown: {
    'e-news': { read: false, create: false, update: false, delete: false },
    'profil-desa': { read: false, create: false, update: false, delete: false },
    'regulasi-desa': { read: false, create: false, update: false, delete: false },
    'keuangan': { read: false, create: false, update: false, delete: false },
    'layanan-publik': { read: false, create: false, update: false, delete: false },
    'ikm': { read: false, create: false, update: false, delete: false },
    'wisata-budaya': { read: false, create: false, update: false, delete: false },
    'pengaduan': { read: false, create: false, update: false, delete: false },
    'e-umkm': { read: false, create: false, update: false, delete: false },
    'kelola-pengguna': { read: false, create: false, update: false, delete: false },
    'data-desa': { read: false, create: false, update: false, delete: false },
    'super-admin': { read: false, create: false, update: false, delete: false },
  },
};

// Administrative panel access control
export const adminAccess: Record<UserRole, AdminAccess> = {
  super_admin: { canAccessAdminPanel: true, canAccessMasyarakatPanel: true },
  administrator: { canAccessAdminPanel: true, canAccessMasyarakatPanel: true },
  admin_desa: { canAccessAdminPanel: true, canAccessMasyarakatPanel: true },
  kepala_desa: { canAccessAdminPanel: true, canAccessMasyarakatPanel: true },
  kepala_dusun: { canAccessAdminPanel: true, canAccessMasyarakatPanel: true },
  warga_dpkj: { canAccessAdminPanel: false, canAccessMasyarakatPanel: true },
  warga_luar_dpkj: { canAccessAdminPanel: false, canAccessMasyarakatPanel: true },
  unknown: { canAccessAdminPanel: false, canAccessMasyarakatPanel: false },
};

// Data Desa Analisis access control
export const dataDesaAnalisisAccess: Record<UserRole, DataDesaAccess> = {
  super_admin: { canAccessAnalisisData: true },
  administrator: { canAccessAnalisisData: true },
  admin_desa: { canAccessAnalisisData: true },
  kepala_desa: { canAccessAnalisisData: true },
  kepala_dusun: { canAccessAnalisisData: false },
  warga_dpkj: { canAccessAnalisisData: false },
  warga_luar_dpkj: { canAccessAnalisisData: false },
  unknown: { canAccessAnalisisData: false },
};

// Masyarakat page access for each role
export const masyarakatPageAccess: Record<UserRole, Record<string, boolean>> = {
  super_admin: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: true, regulasi: true, riwayat: true, notifikasi: true,
  },
  administrator: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: true, regulasi: true, riwayat: true, notifikasi: true,
  },
  admin_desa: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: true, regulasi: true, riwayat: true, notifikasi: true,
  },
  kepala_desa: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: false, regulasi: true, riwayat: true, notifikasi: true,
  },
  kepala_dusun: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: true, regulasi: true, riwayat: true, notifikasi: true,
  },
  warga_dpkj: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': true, pengaduan: true, keuangan: true,
    'data-desa': true, ikm: true, regulasi: true, riwayat: true, notifikasi: true,
  },
  warga_luar_dpkj: {
    home: true, profile: true, 'profil-desa': true, 'e-news': true, 'e-umkm': true,
    'wisata-budaya': true, 'layanan-publik': false, pengaduan: false, keuangan: false,
    'data-desa': false, ikm: false, regulasi: false, riwayat: false, notifikasi: false,
  },
  unknown: {
    home: false, profile: false, 'profil-desa': false, 'e-news': false, 'e-umkm': false,
    'wisata-budaya': false, 'layanan-publik': false, pengaduan: false, keuangan: false,
    'data-desa': false, ikm: false, regulasi: false, riwayat: false, notifikasi: false,
  },
};

// Role descriptions
export const roleDescriptions: Record<UserRole, { title: string; description: string }> = {
  super_admin: {
    title: 'Super Administrator',
    description: 'Akses penuh ke seluruh sistem dengan wewenang tertinggi'
  },
  administrator: {
    title: 'Administrator',
    description: 'Akses penuh ke seluruh sistem admin dan masyarakat'
  },
  admin_desa: {
    title: 'Admin Desa',
    description: 'Akses admin kecuali kelola pengguna dan data desa'
  },
  kepala_desa: {
    title: 'Kepala Desa',
    description: 'Akses data desa & layanan publik + halaman masyarakat'
  },
  kepala_dusun: {
    title: 'Kepala Dusun',
    description: 'Akses pengaduan & layanan publik + halaman masyarakat'
  },
  warga_dpkj: {
    title: 'Warga DPKJ',
    description: 'Akses lengkap ke fitur masyarakat'
  },
  warga_luar_dpkj: {
    title: 'Warga Luar DPKJ',
    description: 'Akses terbatas: profil desa, e-news, UMKM, wisata budaya'
  },
  unknown: {
    title: 'Unknown',
    description: 'Role belum ditentukan'
  },
};

// Firebase collections structure
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  USER_PROFILES: 'user-profiles',
  USER_SESSIONS: 'user-sessions',
  ADMIN_LOGS: 'admin-logs',
  ROLE_REQUESTS: 'role-requests',
} as const;

// User status types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Extended user interface for Firestore
export interface FirestoreUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  userName?: string;          // Username untuk identifikasi
  initialPassword?: string;   // Password awal yang dibuat admin (hanya untuk tampilan)
  idNumber?: string;           // ID yang diperlukan untuk login
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt: any;             // Firestore Timestamp
  updatedAt: any;             // Firestore Timestamp
  lastLoginAt?: any;          // Firestore Timestamp
  createdBy?: string;         // Admin yang membuat user (jika dibuat manual)
  notes?: string;             // Catatan admin
  
  // Additional fields for masyarakat data
  nik?: string;               // NIK dari collection masyarakat
  alamat?: string;            // Alamat lengkap
  daerah?: string;            // Daerah/Banjar
  noTelp?: string;            // Nomor telepon
  tanggalLahir?: string;      // Tanggal lahir (format: YYYY-MM-DD)
  tempatLahir?: string;       // Tempat lahir
  jenisKelamin?: string;      // Jenis kelamin (L/P)
  pekerjaan?: string;         // Pekerjaan
  agama?: string;             // Agama
  statusPerkawinan?: string;  // Status perkawinan
  noKK?: string;              // Nomor Kartu Keluarga
  kewarganegaraan?: string;   // Kewarganegaraan (WNI/WNA)
}

// Helper functions
export function hasPermission(role: UserRole, feature: keyof RolePermissions, action: keyof Permission): boolean {
  return rolePermissions[role]?.[feature]?.[action] || false;
}

export function canAccessAdminPanel(role: UserRole): boolean {
  return adminAccess[role]?.canAccessAdminPanel || false;
}

export function canAccessMasyarakatPanel(role: UserRole): boolean {
  return adminAccess[role]?.canAccessMasyarakatPanel || false;
}

export function canAccessMasyarakatPage(role: UserRole, page: string): boolean {
  return masyarakatPageAccess[role]?.[page] || false;
}

export function canAccessDataDesaAnalisis(role: UserRole): boolean {
  return dataDesaAnalisisAccess[role]?.canAccessAnalisisData || false;
}

export function getRoleDescription(role: UserRole): string {
  return roleDescriptions[role]?.description || 'Role tidak dikenal';
}

export function getRoleTitle(role: UserRole): string {
  return roleDescriptions[role]?.title || 'Unknown';
}

export default {
  rolePermissions,
  adminAccess,
  dataDesaAnalisisAccess,
  masyarakatPageAccess,
  roleDescriptions,
  FIREBASE_COLLECTIONS,
  hasPermission,
  canAccessAdminPanel,
  canAccessMasyarakatPanel,
  canAccessMasyarakatPage,
  canAccessDataDesaAnalisis,
  getRoleDescription,
  getRoleTitle,
};
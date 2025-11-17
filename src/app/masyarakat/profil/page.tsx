"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from '../../../contexts/AuthContext';
import { handleMasyarakatLogout } from '../../../lib/masyarakatLogoutHelper';
import { getMasyarakatByEmail } from '../../../lib/masyarakatService';
import { getKependudukanPhotoURL } from '../../../lib/kependudukanPhotoService';
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
const SiGedeLogo = "/logo/LOGO_DPKJ.png";

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  nik?: string;
  noTelepon?: string;
  alamat?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  pekerjaan?: string;
  kecamatan?: string;
  desa?: string;
  rt?: string;
  rw?: string;
  userName?: string;
  userType?: 'masyarakat' | 'warga_luar_dpkj';
}

export default function ProfilMasyarakatPage() {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    // Debug: Log semua data user dari AuthContext
    console.log('👤 USER DATA dari AuthContext:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      idNumber: user.idNumber,
      address: user.address,
      role: user.role,
      status: user.status
    });

    // Set initial data from AuthContext immediately
    const initialData: UserProfile = {
      id: user.uid || 'user-id',
      nama: user.displayName || user.userName || 'User',
      email: user.email,
      nik: user.idNumber || undefined,
      noTelepon: user.phoneNumber || undefined,
      userName: user.userName || undefined,
      alamat: user.address || undefined,
      jenisKelamin: undefined,
      agama: undefined,
      pekerjaan: undefined,
      desa: undefined,
      kecamatan: undefined,
      rt: undefined,
      rw: undefined,
      userType: 'masyarakat'
    };
    
    console.log('📋 INITIAL DATA yang di-set:', initialData);
    setUserProfile(initialData);
    setLoading(false);

    // Try to fetch from database in background
    try {
      console.log('🔍 Fetching profile for email:', user.email);
      const profileData = await getMasyarakatByEmail(user.email);
      
      if (profileData) {
        console.log('✅ Profile data found from database:', profileData);
        setUserProfile(profileData);
      } else {
        console.log('❌ No profile data found in database, using AuthContext data');
      }

      // Load profile photo if user has uid
      if (user.uid) {
        console.log('📸 PROFIL: Loading profile photo for:', user.uid);
        const photoUrl = await getKependudukanPhotoURL(user.uid, 'foto_profil');
        
        if (photoUrl) {
          console.log('✅ PROFIL: Profile photo found');
          setProfilePhotoUrl(photoUrl);
        } else {
          console.log('ℹ️ PROFIL: No profile photo found');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchUserProfile();
    }
  }, [user?.email, fetchUserProfile]);

  const handleLogout = async () => {
    await handleMasyarakatLogout(() => logout('masyarakat'));
  };

  // Don't show loading spinner since we set data immediately
  if (!user) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
          <HeaderCard 
            title="Profil" 
            subtitle="Data Pribadi"
            backUrl="/masyarakat/home"
            showBackButton={false}
          />
          <div className="flex items-center justify-center mt-20">
            <div className="text-gray-500">Silakan login terlebih dahulu</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard 
          title="Profil" 
          subtitle="Data Pribadi"
          backUrl="/masyarakat/home"
          showBackButton={false}
        />
        
        {/* Profile Header */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 shadow-xl">
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white/20 bg-white/10 backdrop-blur-sm">
              {profilePhotoUrl ? (
                <Image
                  src={profilePhotoUrl}
                  alt="Profile Photo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-white">
                  {userProfile?.nama?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-white">
              <div className="text-xl font-bold">
                {userProfile?.nama || 'Nama Pengguna'}
              </div>
              <div className="text-sm text-blue-100">
                {userProfile?.email || 'email@example.com'}
              </div>
              {userProfile?.userName && (
                <div className="text-xs text-blue-200 opacity-90">
                  @{userProfile.userName}
                </div>
              )}
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/5"></div>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"></div>
        </div>

        {/* Profile Details */}
        <div className="space-y-3">
          {/* Personal Info Card */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-lg">👤</div>
              <div className="text-sm font-semibold text-gray-700">Informasi Pribadi</div>
            </div>
            <div className="space-y-2">
              {userProfile?.nik && (
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">NIK</div>
                  <div className="text-sm font-medium">{userProfile.nik}</div>
                </div>
              )}
              {userProfile?.noTelepon && (
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">No. Telepon</div>
                  <div className="text-sm font-medium">{userProfile.noTelepon}</div>
                </div>
              )}
              {userProfile?.jenisKelamin && (
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">Jenis Kelamin</div>
                  <div className="text-sm font-medium">{userProfile.jenisKelamin}</div>
                </div>
              )}
              {userProfile?.agama && (
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">Agama</div>
                  <div className="text-sm font-medium">{userProfile.agama}</div>
                </div>
              )}
              {userProfile?.pekerjaan && (
                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">Pekerjaan</div>
                  <div className="text-sm font-medium">{userProfile.pekerjaan}</div>
                </div>
              )}
            </div>
          </div>

          {/* Address Info Card */}
          {(userProfile?.alamat || userProfile?.desa || userProfile?.rt || userProfile?.rw) && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-lg">📍</div>
                <div className="text-sm font-semibold text-gray-700">Alamat</div>
              </div>
              <div className="space-y-2">
                {userProfile?.alamat && (
                  <div className="text-sm text-gray-600">{userProfile.alamat}</div>
                )}
                <div className="flex gap-4">
                  {userProfile?.rt && (
                    <div className="text-sm">
                      <span className="text-gray-600">RT:</span> <span className="font-medium">{userProfile.rt}</span>
                    </div>
                  )}
                  {userProfile?.rw && (
                    <div className="text-sm">
                      <span className="text-gray-600">RW:</span> <span className="font-medium">{userProfile.rw}</span>
                    </div>
                  )}
                </div>
                {userProfile?.desa && (
                  <div className="text-sm">
                    <span className="text-gray-600">Desa:</span> <span className="font-medium">{userProfile.desa}</span>
                  </div>
                )}
                {userProfile?.kecamatan && (
                  <div className="text-sm">
                    <span className="text-gray-600">Kecamatan:</span> <span className="font-medium">{userProfile.kecamatan}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Type */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="text-lg">🏠</div>
              <div className="text-sm font-semibold text-gray-700">Status Kependudukan</div>
            </div>
            <div className="text-sm font-medium capitalize text-blue-600">
              {userProfile?.userType === 'warga_luar_dpkj' ? 'Warga Luar DPKJ' : 'Warga DPKJ'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href="/masyarakat/profil/edit"
              className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg">✏️</div>
                <div className="text-sm font-medium">Edit Profil</div>
              </div>
              <div className="text-white">›</div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl bg-red-500 px-4 py-3 text-white shadow-sm transition-colors hover:bg-red-600"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg">🚪</div>
                <div className="text-sm font-medium">Keluar</div>
              </div>
              <div className="text-white">›</div>
            </button>
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-8 flex items-center justify-center gap-4 rounded-2xl bg-white/80 py-4 shadow-sm backdrop-blur-sm">
          <Image src={SiGedeLogo} alt="Logo" width={32} height={32} className="h-8 w-8" />
          <div className="text-xs font-semibold text-gray-600">
            Sistem Informasi Desa
          </div>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
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
  desil?: string;
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
  const [showImagePopup, setShowImagePopup] = useState(false);

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
      desil: undefined,
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

  // Handle ESC key and body scroll lock for image popup
  useEffect(() => {
    if (showImagePopup) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowImagePopup(false);
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = originalStyle;
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showImagePopup]);

  const handleLogout = async () => {
    await handleMasyarakatLogout(() => logout('masyarakat'));
  };

  // Don't show loading spinner since we set data immediately
  if (!user) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 pt-3 sm:pt-4">
          <HeaderCard 
            title="Profil" 
            subtitle="Data Pribadi"
            backUrl="/masyarakat/home"
            showBackButton={false}
          />
          <div className="flex items-center justify-center mt-16 sm:mt-20">
            <div className="text-gray-500 text-sm sm:text-base">Silakan login terlebih dahulu</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 pt-3 sm:pt-4">
        <HeaderCard 
          title="Profil" 
          subtitle="Data Pribadi"
          backUrl="/masyarakat/home"
          showBackButton={false}
        />
        
        {/* Profile Header */}
        <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 sm:p-6 md:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div 
              className={`relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 overflow-hidden rounded-2xl border-4 border-white/20 bg-white/10 backdrop-blur-sm flex-shrink-0 ${
                profilePhotoUrl ? 'cursor-pointer hover:border-white/40 hover:scale-105 transition-all duration-200' : ''
              }`}
              onClick={() => profilePhotoUrl && setShowImagePopup(true)}
              title={profilePhotoUrl ? 'Klik untuk melihat foto penuh' : ''}
            >
              {profilePhotoUrl ? (
                <>
                  <Image
                    src={profilePhotoUrl}
                    alt="Profile Photo"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-2xl sm:text-3xl md:text-4xl text-white font-bold">
                  {userProfile?.nama?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-white text-center sm:text-left">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                {userProfile?.nama || 'Nama Pengguna'}
              </div>
              <div className="text-sm sm:text-base text-blue-100">
                {userProfile?.email || 'email@example.com'}
              </div>
              {userProfile?.userName && (
                <div className="text-xs sm:text-sm text-blue-200 opacity-90 mt-1">
                  @{userProfile.userName}
                </div>
              )}
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-white/5"></div>
          <div className="absolute -right-4 -top-4 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white/10"></div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Personal Info Card */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl">👤</div>
              <div className="text-sm sm:text-base font-semibold text-gray-700">Informasi Pribadi</div>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {userProfile?.nik && (
                <div className="flex justify-between items-start">
                  <div className="text-sm sm:text-base text-gray-600">NIK</div>
                  <div className="text-sm sm:text-base font-medium text-right">{userProfile.nik}</div>
                </div>
              )}
              {userProfile?.noTelepon && (
                <div className="flex justify-between items-start">
                  <div className="text-sm sm:text-base text-gray-600">No. Telepon</div>
                  <div className="text-sm sm:text-base font-medium text-right">{userProfile.noTelepon}</div>
                </div>
              )}
              {userProfile?.jenisKelamin && (
                <div className="flex justify-between items-start">
                  <div className="text-sm sm:text-base text-gray-600">Jenis Kelamin</div>
                  <div className="text-sm sm:text-base font-medium text-right">{userProfile.jenisKelamin}</div>
                </div>
              )}
              {userProfile?.agama && (
                <div className="flex justify-between items-start">
                  <div className="text-sm sm:text-base text-gray-600">Agama</div>
                  <div className="text-sm sm:text-base font-medium text-right">{userProfile.agama}</div>
                </div>
              )}
              {userProfile?.pekerjaan && (
                <div className="flex justify-between items-start">
                  <div className="text-sm sm:text-base text-gray-600">Pekerjaan</div>
                  <div className="text-sm sm:text-base font-medium text-right">{userProfile.pekerjaan}</div>
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="text-sm sm:text-base text-gray-600">Desil</div>
                <div className="text-sm sm:text-base font-medium text-right">
                  {userProfile?.desil ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200">
                      Desil {userProfile.desil}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Info Card */}
          {(userProfile?.alamat || userProfile?.desa || userProfile?.rt || userProfile?.rw) && (
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl">📍</div>
                <div className="text-sm sm:text-base font-semibold text-gray-700">Alamat</div>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {userProfile?.alamat && (
                  <div className="text-sm sm:text-base text-gray-600 leading-relaxed">{userProfile.alamat}</div>
                )}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {userProfile?.rt && (
                    <div className="text-sm sm:text-base">
                      <span className="text-gray-600">RT:</span> <span className="font-medium">{userProfile.rt}</span>
                    </div>
                  )}
                  {userProfile?.rw && (
                    <div className="text-sm sm:text-base">
                      <span className="text-gray-600">RW:</span> <span className="font-medium">{userProfile.rw}</span>
                    </div>
                  )}
                </div>
                {userProfile?.desa && (
                  <div className="text-sm sm:text-base">
                    <span className="text-gray-600">Desa:</span> <span className="font-medium">{userProfile.desa}</span>
                  </div>
                )}
                {userProfile?.kecamatan && (
                  <div className="text-sm sm:text-base">
                    <span className="text-gray-600">Kecamatan:</span> <span className="font-medium">{userProfile.kecamatan}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Type */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow md:col-span-2">
            <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl">🏠</div>
              <div className="text-sm sm:text-base font-semibold text-gray-700">Status Kependudukan</div>
            </div>
            <div className="text-sm sm:text-base font-medium capitalize text-blue-600">
              {userProfile?.userType === 'warga_luar_dpkj' ? 'Warga Luar DPKJ' : 'Warga DPKJ'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <Link
              href="/masyarakat/profil/edit"
              className="flex items-center justify-between rounded-xl bg-blue-600 px-4 sm:px-5 py-3 sm:py-3.5 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl sm:text-2xl">✏️</div>
                <div className="text-sm sm:text-base font-medium">Edit Profil</div>
              </div>
              <div className="text-white text-xl">›</div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-between rounded-xl bg-red-500 px-4 sm:px-5 py-3 sm:py-3.5 text-white shadow-md transition-all hover:bg-red-600 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl sm:text-2xl">🚪</div>
                <div className="text-sm sm:text-base font-medium">Keluar</div>
              </div>
              <div className="text-white text-xl">›</div>
            </button>
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4 rounded-2xl bg-white/80 py-4 sm:py-5 shadow-md backdrop-blur-sm">
          <Image src={SiGedeLogo} alt="Logo" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10" />
          <div className="text-xs sm:text-sm font-semibold text-gray-600">
            Sistem Informasi Desa
          </div>
        </div>
      </div>

      {/* Image Popup Modal - Professional & Optimized */}
      {showImagePopup && profilePhotoUrl && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/96 flex items-center justify-center overflow-hidden"
          style={{ 
            animation: 'fadeIn 0.2s ease-out',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setShowImagePopup(false)}
        >
          {/* Header Bar - Desktop & Mobile */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              {/* Title - Hidden on small mobile */}
              <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm md:text-base truncate">
                    Foto Profil - {userProfile?.nama}
                  </p>
                  <p className="text-white/60 text-xs hidden md:block">
                    Klik di luar atau tekan ESC untuk menutup
                  </p>
                </div>
              </div>
              
              {/* Mobile only - Simple title */}
              <div className="flex sm:hidden items-center gap-2 flex-1">
                <svg className="w-4 h-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white text-sm font-medium truncate">Foto Profil</span>
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImagePopup(false);
                }}
                className="p-2 sm:p-2.5 md:p-3 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 ml-3"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Image Container - Centered & Optimized */}
          <div 
            className="relative w-full h-full flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-16 sm:py-20 md:py-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
              {/* Loading Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>

              {/* Profile Photo */}
              <div className="relative z-10 w-full max-w-2xl aspect-square">
                <Image
                  src={profilePhotoUrl}
                  alt={`Foto Profil - ${userProfile?.nama}`}
                  fill
                  quality={100}
                  priority
                  className="object-contain rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl"
                  style={{
                    animation: 'scaleIn 0.3s ease-out'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Instructions - Desktop Only */}
          <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg">
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono">ESC</kbd>
              <span>untuk menutup</span>
            </div>
          </div>

          {/* Mobile Swipe Indicator */}
          <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
            <p className="text-white/60 text-xs font-medium">Ketuk di luar untuk menutup</p>
          </div>

          {/* Inline Styles for Animations */}
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}

      <BottomNavigation />
    </main>
  );
}
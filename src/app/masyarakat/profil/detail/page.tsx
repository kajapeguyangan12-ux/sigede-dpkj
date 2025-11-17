"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from '../../../../contexts/AuthContext';
import { getMasyarakatByEmail, MasyarakatData } from '../../../../lib/masyarakatService';
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';

export default function ProfilDetailMasyarakatPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<MasyarakatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      // Debug: Log semua data user dari AuthContext
      console.log('👤 DETAIL: USER DATA dari AuthContext:', {
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
      const initialData: MasyarakatData = {
        id: user.uid || 'user-id',
        nama: user.displayName || user.userName || 'User',
        email: user.email,
        nik: user.idNumber || undefined,
        noTelepon: user.phoneNumber || undefined,
        userName: user.userName || undefined,
        alamat: user.address || undefined,
        userType: 'masyarakat'
      };
      
      console.log('📋 DETAIL: INITIAL DATA yang di-set:', initialData);
      setUserProfile(initialData);
      setLoading(false);

      // Try to fetch from database in background
      try {
        console.log('🔍 DETAIL: Fetching profile for email:', user.email);
        const profileData = await getMasyarakatByEmail(user.email);
        
        if (profileData) {
          console.log('✅ DETAIL: Profile data found from database:', profileData);
          setUserProfile(profileData);
        } else {
          console.log('❌ DETAIL: No profile data found in database, using AuthContext data');
        }
      } catch (error) {
        console.error('❌ DETAIL: Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatAddress = () => {
    if (!userProfile?.alamat) return '-';
    let address = userProfile.alamat;
    if (userProfile.rt) address += `, RT ${userProfile.rt}`;
    if (userProfile.rw) address += `, RW ${userProfile.rw}`;
    if (userProfile.desa) address += `, ${userProfile.desa}`;
    if (userProfile.kecamatan) address += `, ${userProfile.kecamatan}`;
    return address;
  };

  const formatBirthPlace = () => {
    if (!userProfile?.tempatLahir && !userProfile?.tanggalLahir) return '-';
    const place = userProfile?.tempatLahir || '';
    const date = formatDate(userProfile?.tanggalLahir);
    if (place && date !== '-') return `${place}, ${date}`;
    if (place) return place;
    if (date !== '-') return date;
    return '-';
  };

  // Different detail arrays based on user type
  const detailWargaDPKJ = [
    { label: "Nama", value: userProfile?.nama || '-' },
    { label: "Email", value: userProfile?.email || '-' },
    { label: "NIK", value: userProfile?.nik || '-' },
    { label: "Alamat", value: formatAddress() },
    { label: "No. Telp", value: userProfile?.noTelepon || '-' },
    { label: "Jenis Kelamin", value: userProfile?.jenisKelamin || '-' },
    { label: "Pekerjaan", value: userProfile?.pekerjaan || '-' },
    { label: "Agama", value: userProfile?.agama || '-' },
    { label: "Tempat/Tanggal Lahir", value: formatBirthPlace() },
    { label: "Desa", value: userProfile?.desa || '-' },
    { label: "Kecamatan", value: userProfile?.kecamatan || '-' },
    { label: "RT/RW", value: userProfile?.rt && userProfile?.rw ? `${userProfile.rt}/${userProfile.rw}` : '-' },
  ];

  const detailWargaLuar = [
    { label: "Nama", value: userProfile?.nama || '-' },
    { label: "Username", value: userProfile?.userName || '-' },
    { label: "Email", value: userProfile?.email || '-' },
    { label: "No. Telp", value: userProfile?.noTelepon || '-' },
  ];

  const detail = userProfile?.userType === 'warga_luar_dpkj' ? detailWargaLuar : detailWargaDPKJ;

  // Don't show loading spinner since we set data immediately
  if (!user) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
        <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4">
          <HeaderCard title="Detail Profil" />
          <div className="flex items-center justify-center mt-20">
            <div className="text-gray-500">Silakan login terlebih dahulu</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4">
        <HeaderCard title="Detail Profil" />

        <div className="mb-4">
          <Link href="/masyarakat/profil" className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* Profile Avatar */}
        <div className="mb-6 flex justify-center">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white ${
            userProfile?.userType === 'warga_luar_dpkj'
              ? 'bg-gradient-to-br from-orange-400 to-red-600'
              : 'bg-gradient-to-br from-blue-400 to-indigo-600'
          }`}>
            {userProfile?.nama || userProfile?.userName ? 
              (userProfile.nama || userProfile.userName)!.charAt(0).toUpperCase() : '?'
            }
          </div>
        </div>

        {/* Profile Details */}
        <section className="space-y-3">
          <div className="bg-white rounded-2xl p-1 shadow-lg overflow-hidden">
            <div className={`text-white p-4 rounded-xl mb-1 ${
              userProfile?.userType === 'warga_luar_dpkj'
                ? 'bg-gradient-to-r from-orange-600 to-red-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
              <h2 className="text-lg font-bold">
                {userProfile?.userType === 'warga_luar_dpkj' ? 'Informasi Dasar' : 'Informasi Personal'}
              </h2>
              <p className={`text-sm ${
                userProfile?.userType === 'warga_luar_dpkj' ? 'text-orange-100' : 'text-blue-100'
              }`}>
                {userProfile?.userType === 'warga_luar_dpkj' 
                  ? 'Data dasar warga luar DPKJ' 
                  : 'Data lengkap profil Anda'
                }
              </p>
              {userProfile?.userType === 'warga_luar_dpkj' && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Warga Luar DPKJ
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-3 space-y-3">
              {detail.map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900 mb-1">{d.label}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm text-right break-words ${
                        d.value === '-' ? 'text-gray-400 italic' : 'text-gray-700 font-medium'
                      }`}>
                        {d.value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Profile Button */}
          <Link 
            href="/masyarakat/profil/edit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-lg group mt-6"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white">Edit Profil</h3>
              <p className="text-sm text-blue-100">Perbarui informasi Anda</p>
            </div>
          </Link>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}

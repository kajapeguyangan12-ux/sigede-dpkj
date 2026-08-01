"use client";
import React, { useState } from 'react';

interface DataDesa {
  id: string;
  noKK: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  daerah: string;
  statusNikah: string;
  agama: string;
  sukuBangsa: string;
  kewarganegaraan: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  penghasilan: string;
  golonganDarah: string;
  shdk: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KKCardProps {
  noKK: string;
  members: DataDesa[];
  alamat?: string;
}

const KKCard: React.FC<KKCardProps> = ({ noKK, members, alamat }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find kepala keluarga
  const kepalaKeluarga = members.find(m => 
    m.shdk.toLowerCase().includes('kepala') || 
    m.shdk.toLowerCase().includes('kk')
  ) || members[0];

  const totalAnggota = members.length;
  const totalLakiLaki = members.filter(m => m.jenisKelamin === 'Laki-laki').length;
  const totalPerempuan = members.filter(m => m.jenisKelamin === 'Perempuan').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                No. KK
              </span>
              <span className="font-mono text-sm text-gray-900 font-medium">{noKK}</span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 text-base">
              {kepalaKeluarga?.namaLengkap || 'Nama tidak tersedia'}
            </h3>
            
            {alamat && (
              <p className="text-sm text-gray-700 mb-2 line-clamp-2 font-medium">
                📍 {alamat}
              </p>
            )}

            <div className="flex gap-4 text-sm">
              <span className="text-gray-700 font-medium">
                👥 <strong className="text-gray-900">{totalAnggota}</strong> Anggota
              </span>
              <span className="text-blue-600 font-medium">
                👨 <strong className="text-blue-800">{totalLakiLaki}</strong> L
              </span>
              <span className="text-pink-600 font-medium">
                👩 <strong className="text-pink-800">{totalPerempuan}</strong> P
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-800 hover:text-gray-900"
          >
            {isExpanded ? '🔼 Tutup' : '🔽 Detail'}
          </button>
        </div>
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 text-base">Anggota Keluarga:</h4>
          
          <div className="space-y-3">
            {members.map((member, index) => (
              <div 
                key={member.nik || index} 
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{member.namaLengkap}</span>
                    <div className="text-gray-700 mt-1 space-y-1">
                      <div>NIK: <span className="font-mono text-gray-900">{member.nik}</span></div>
                      <div className="text-gray-800">SHDK: <span className="text-gray-900">{member.shdk}</span></div>
                      <div className="text-gray-800">JK: <span className="text-gray-900">{member.jenisKelamin}</span></div>
                    </div>
                  </div>
                  
                  <div className="text-gray-700 space-y-1">
                    {member.tempatLahir && (
                      <div className="text-gray-800">TTL: <span className="text-gray-900">{member.tempatLahir}, {member.tanggalLahir}</span></div>
                    )}
                    {member.agama && <div className="text-gray-800">Agama: <span className="text-gray-900">{member.agama}</span></div>}
                    {member.pendidikanTerakhir && <div className="text-gray-800">Pendidikan: <span className="text-gray-900">{member.pendidikanTerakhir}</span></div>}
                    {member.pekerjaan && <div className="text-gray-800">Pekerjaan: <span className="text-gray-900">{member.pekerjaan}</span></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-semibold text-blue-900">{totalAnggota}</div>
                <div className="text-blue-600">Total Anggota</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-900">{totalLakiLaki}</div>
                <div className="text-green-600">Laki-laki</div>
              </div>
              <div className="text-center p-2 bg-pink-50 rounded">
                <div className="font-semibold text-pink-900">{totalPerempuan}</div>
                <div className="text-pink-600">Perempuan</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">
                  {members.filter(m => m.shdk.toLowerCase().includes('anak')).length}
                </div>
                <div className="text-gray-600">Anak</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KKCard;
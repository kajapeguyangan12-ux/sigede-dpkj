'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AdminLayout from '../components/AdminLayout';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});
import { 
  getAllWisata, 
  getAllBudaya, 
  createWisata, 
  createBudaya, 
  updateWisata, 
  updateBudaya, 
  deleteWisata, 
  deleteBudaya,
  WisataItem,
  BudayaItem
} from '../../../lib/wisataBudayaService';

// Dynamic import Leaflet components with proper types
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Map Click Handler Component
const MapClickHandler = dynamic(() => import('./components/MapClickHandler'), { ssr: false });

type TabType = 'wisata' | 'budaya';
type ModalMode = 'add' | 'edit';

const KATEGORI_WISATA = ['Alam', 'Budaya', 'Kuliner', 'Religi'] as const;
const KATEGORI_BUDAYA = ['Tari', 'Upacara', 'Kerajinan', 'Musik', 'Tradisi'] as const;

export default function WisataBudayaAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('wisata');
  const [wisataList, setWisataList] = useState<WisataItem[]>([]);
  const [budayaList, setBudayaList] = useState<BudayaItem[]>([]);
  const [loading, setLoading] = useState(false); // Only for data fetching, not navigation
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [selectedItem, setSelectedItem] = useState<WisataItem | BudayaItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: TabType} | null>(null);
  
  // Form states for Wisata
  const [wisataForm, setWisataForm] = useState<Partial<WisataItem>>({
    judul: '',
    kategori: 'Alam',
    alamat: '',
    lokasi: '',
    deskripsi: '',
    jarak: '',
    rating: 0
  });
  
  // Form states for Budaya
  const [budayaForm, setBudayaForm] = useState<Partial<BudayaItem>>({
    judul: '',
    kategori: 'Tari',
    deskripsi: '',
    sejarah: ''
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [galeriFiles, setGaleriFiles] = useState<File[]>([]);
  const [galeriPreviews, setGaleriPreviews] = useState<string[]>([]);
  const [existingGaleri, setExistingGaleri] = useState<string[]>([]);
  const [galeriToDelete, setGaleriToDelete] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Map modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-8.6492, 115.2191]); // Bali center
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [tempLocationName, setTempLocationName] = useState('');
  const [mapMode, setMapMode] = useState<'wisata' | 'budaya'>('wisata');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wisataData, budayaData] = await Promise.all([
        getAllWisata(),
        getAllBudaya()
      ]);
      setWisataList(wisataData);
      setBudayaList(budayaData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGaleriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGaleriFiles(prev => [...prev, ...files]);
      
      // Create previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGaleriPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGaleriPreview = (index: number) => {
    setGaleriFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGaleri = (url: string) => {
    setExistingGaleri(prev => prev.filter(u => u !== url));
    setGaleriToDelete(prev => [...prev, url]);
  };

  // Map handling functions
  const openMapModal = (mode: 'wisata' | 'budaya') => {
    setMapMode(mode);
    setSelectedCoordinates(null);
    setTempLocationName('');
    setShowMapModal(true);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedCoordinates([lat, lng]);
    
    // Reverse geocoding to get location name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        const locationName = data.display_name;
        setTempLocationName(locationName);
      } else {
        setTempLocationName(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      setTempLocationName(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const confirmLocationSelection = () => {
    if (selectedCoordinates && tempLocationName) {
      const coordinatesString = `${selectedCoordinates[0]},${selectedCoordinates[1]}`;
      
      if (mapMode === 'wisata') {
        setWisataForm({
          ...wisataForm,
          lokasi: tempLocationName,
          alamat: tempLocationName,
          // Store coordinates in jarak field as additional info
          jarak: coordinatesString
        });
      } else {
        setBudayaForm({
          ...budayaForm,
          lokasi: tempLocationName,
          // We could add coordinates to deskripsi or create custom field
          deskripsi: `${budayaForm.deskripsi || ''}\n[Koordinat: ${coordinatesString}]`.trim()
        });
      }
      setShowMapModal(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedItem(null);
    if (activeTab === 'wisata') {
      setWisataForm({
        judul: '',
        kategori: 'Alam',
        alamat: '', // Alamat akan diisi dari lokasi
        lokasi: '',
        deskripsi: '',
        jarak: '',
        rating: 0
      });
    } else {
      setBudayaForm({
        judul: '',
        kategori: 'Tari',
        deskripsi: '',
        sejarah: ''
      });
    }
    setPhotoFile(null);
    setPhotoPreview('');
    setGaleriFiles([]);
    setGaleriPreviews([]);
    setExistingGaleri([]);
    setGaleriToDelete([]);
    setShowModal(true);
  };

  const openEditModal = (item: WisataItem | BudayaItem) => {
    setModalMode('edit');
    setSelectedItem(item);
    
    if (activeTab === 'wisata') {
      const wisataItem = item as WisataItem;
      setWisataForm({
        judul: wisataItem.judul,
        kategori: wisataItem.kategori,
        alamat: wisataItem.alamat,
        lokasi: wisataItem.lokasi,
        deskripsi: wisataItem.deskripsi,
        jarak: wisataItem.jarak || '',
        rating: wisataItem.rating || 0
      });
      setPhotoPreview(wisataItem.fotoUrl || '');
      setExistingGaleri(wisataItem.galeri || []);
    } else {
      const budayaItem = item as BudayaItem;
      setBudayaForm({
        judul: budayaItem.judul,
        kategori: budayaItem.kategori,
        deskripsi: budayaItem.deskripsi,
        sejarah: budayaItem.sejarah || ''
      });
      setPhotoPreview(budayaItem.fotoUrl || '');
      setExistingGaleri(budayaItem.galeri || []);
    }
    
    setPhotoFile(null);
    setGaleriFiles([]);
    setGaleriPreviews([]);
    setGaleriToDelete([]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (activeTab === 'wisata') {
        // Validasi field wajib untuk wisata
        if (!wisataForm.judul || !wisataForm.kategori || !wisataForm.deskripsi || !wisataForm.lokasi) {
          alert('Mohon lengkapi semua field yang wajib diisi');
          return;
        }
        
        // Pastikan alamat terisi dari lokasi
        const wisataData = {
          ...wisataForm,
          alamat: wisataForm.alamat || wisataForm.lokasi,
        };
        
        if (modalMode === 'add') {
          await createWisata(
            wisataData as WisataItem, 
            photoFile || undefined,
            galeriFiles.length > 0 ? galeriFiles : undefined
          );
        } else if (selectedItem?.id) {
          await updateWisata(
            selectedItem.id, 
            wisataData, 
            photoFile || undefined,
            galeriFiles.length > 0 ? galeriFiles : undefined,
            galeriToDelete.length > 0 ? galeriToDelete : undefined
          );
        }
      } else {
        if (!budayaForm.judul || !budayaForm.kategori || !budayaForm.deskripsi) {
          alert('Mohon lengkapi semua field yang wajib diisi');
          return;
        }
        
        if (modalMode === 'add') {
          await createBudaya(
            budayaForm as BudayaItem, 
            photoFile || undefined,
            galeriFiles.length > 0 ? galeriFiles : undefined
          );
        } else if (selectedItem?.id) {
          await updateBudaya(
            selectedItem.id, 
            budayaForm, 
            photoFile || undefined,
            galeriFiles.length > 0 ? galeriFiles : undefined,
            galeriToDelete.length > 0 ? galeriToDelete : undefined
          );
        }
      }
      
      await fetchData();
      setShowModal(false);
      alert(modalMode === 'add' ? 'Data berhasil ditambahkan' : 'Data berhasil diperbarui');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      setSubmitting(true);
      
      if (itemToDelete.type === 'wisata') {
        await deleteWisata(itemToDelete.id);
      } else {
        await deleteBudaya(itemToDelete.id);
      }
      
      await fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
      alert('Data berhasil dihapus');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus data');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (id: string, type: TabType) => {
    setItemToDelete({ id, type });
    setShowDeleteModal(true);
  };

  const filteredWisata = wisataList.filter(item =>
    item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.alamat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBudaya = budayaList.filter(item =>
    item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentList = activeTab === 'wisata' ? filteredWisata : filteredBudaya;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="relative p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Wisata & Budaya</h1>
                  <p className="text-blue-100 text-sm mt-1">Kelola destinasi wisata dan warisan budaya desa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Modern Pills */}
          <div className="px-8 py-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('wisata')}
                  className={`group relative px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === 'wisata'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Wisata
                  </span>
                  {activeTab === 'wisata' && (
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('budaya')}
                  className={`group relative px-8 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === 'budaya'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Budaya
                  </span>
                  {activeTab === 'budaya' && (
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                  )}
                </button>
              </div>
              
              {/* Stats Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentList.length} Data
                </span>
              </div>
            </div>

            {/* Search and Add Button - Enhanced */}
            <div className="flex gap-4">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur"></div>
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul, kategori, alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="relative w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all bg-white shadow-sm"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={openAddModal}
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-semibold shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah {activeTab === 'wisata' ? 'Wisata' : 'Budaya'}</span>
                </span>
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
            {currentList.length === 0 && !loading ? (
              <div className="py-16 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Belum Ada Data {activeTab === 'wisata' ? 'Wisata' : 'Budaya'}</h3>
                <p className="text-gray-500 mb-6">Mulai tambahkan data untuk ditampilkan di sini</p>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Data Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {currentList.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl border-2 border-gray-100 hover:border-blue-200 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-6 p-6">
                      {/* Modern Photo with Overlay */}
                      <div className="relative w-40 h-40 flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-inner">
                          {item.fotoUrl ? (
                            <>
                              <img src={item.fotoUrl} alt={item.judul} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-gray-400 font-medium">No Photo</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Kategori Badge di Foto */}
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${
                            activeTab === 'wisata' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                          }`}>
                            {item.kategori}
                          </div>
                        </div>
                      </div>

                      {/* Content Section - Modern Layout */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {item.judul}
                          </h3>
                          
                          {activeTab === 'wisata' && 'alamat' in item && (
                            <div className="flex items-start gap-2 text-gray-600 mb-2">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-1 text-sm">{item.alamat}</span>
                            </div>
                          )}
                          
                          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{item.deskripsi}</p>
                        </div>

                        {/* Action Buttons - Modern Style */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEditModal(item)}
                            className="group/btn flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg hover:scale-105"
                          >
                            <svg className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => item.id && openDeleteModal(item.id, activeTab)}
                            className="group/btn flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg hover:scale-105"
                          >
                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal - 2 Column Layout */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            
            {/* Modal Header */}
            <div className="relative p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Formulir {activeTab === 'wisata' ? 'Wisata' : 'Budaya'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-all"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - 2 Columns */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6">
                
                {/* Left Column - Form */}
                <div className="space-y-4">
                  
                    {/* Kategori Select */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Pilih Kategori {activeTab === 'wisata' ? 'Wisata' : 'Budaya'}
                      </label>
                      <select
                        value={activeTab === 'wisata' ? wisataForm.kategori : budayaForm.kategori}
                        onChange={(e) => activeTab === 'wisata'
                          ? setWisataForm({...wisataForm, kategori: e.target.value as any})
                          : setBudayaForm({...budayaForm, kategori: e.target.value as any})
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        required
                      >
                        <option value="">Pilih kategori</option>
                        {(activeTab === 'wisata' ? KATEGORI_WISATA : KATEGORI_BUDAYA).map((kat) => (
                          <option key={kat} value={kat}>{kat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lokasi/Nama Tempat (Wisata) or Pilih Lokasi Budaya (Budaya) */}
                    {activeTab === 'wisata' ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Pilih Lokasi Wisata
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={wisataForm.lokasi}
                            onChange={(e) => {
                              const value = e.target.value;
                              setWisataForm({
                                ...wisataForm, 
                                lokasi: value,
                                alamat: value // Sync alamat dengan lokasi
                              });
                            }}
                            onClick={() => openMapModal('wisata')}
                            placeholder="Klik Untuk Memilih Lokasi"
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white text-gray-900 placeholder-gray-500"
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={() => openMapModal('wisata')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Pilih Lokasi Budaya
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={budayaForm.lokasi || ''}
                            onClick={() => openMapModal('budaya')}
                            placeholder="Klik Untuk Memilih Lokasi"
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white text-gray-900 placeholder-gray-500"
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={() => openMapModal('budaya')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nama Tempat */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nama Tempat
                      </label>
                      <input
                        type="text"
                        value={activeTab === 'wisata' ? wisataForm.judul : budayaForm.judul}
                        onChange={(e) => activeTab === 'wisata' 
                          ? setWisataForm({...wisataForm, judul: e.target.value})
                          : setBudayaForm({...budayaForm, judul: e.target.value})
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={activeTab === 'wisata' ? wisataForm.deskripsi : budayaForm.deskripsi}
                        onChange={(e) => activeTab === 'wisata'
                          ? setWisataForm({...wisataForm, deskripsi: e.target.value})
                          : setBudayaForm({...budayaForm, deskripsi: e.target.value})
                        }
                        rows={5}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>

                    {/* Pilih Gambar */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Pilih Gambar Utama
                      </label>
                      <div className="relative">
                        <input
                          id="photo-input"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo-input"
                          className="flex items-center justify-between w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                        >
                          <span className="text-gray-700">
                            {photoFile ? photoFile.name : 'Klik Untuk memilih Gambar'}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </label>
                      </div>
                    </div>

                    {/* Upload Galeri */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Upload Galeri (Multiple)
                      </label>
                      <div className="relative mb-3">
                        <input
                          id="galeri-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGaleriChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="galeri-input"
                          className="flex items-center justify-between w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                        >
                          <span className="text-gray-700">
                            {galeriFiles.length > 0 ? `${galeriFiles.length} gambar dipilih` : 'Klik untuk upload galeri'}
                          </span>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </label>
                      </div>
                      
                      {/* Galeri Previews */}
                      {(existingGaleri.length > 0 || galeriPreviews.length > 0) && (
                        <div className="grid grid-cols-3 gap-2">
                          {/* Existing Galeri */}
                          {existingGaleri.map((url, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img src={url} alt={`Galeri ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-300" />
                              <button
                                type="button"
                                onClick={() => removeExistingGaleri(url)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          
                          {/* New Galeri Previews */}
                          {galeriPreviews.map((preview, index) => (
                            <div key={`preview-${index}`} className="relative group">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-green-300" />
                              <button
                                type="button"
                                onClick={() => removeGaleriPreview(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <span className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 rounded">Baru</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        * Gambar akan otomatis dikonversi ke format WebP
                      </p>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      type="button"
                      className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Menyimpan...' : 'Submit'}
                    </button>
                  
                </div>

                {/* Right Column - Preview */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Preview</h3>
                  
                  {/* Photo Preview */}
                  <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center mb-4 overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm font-medium">Foto</p>
                      </div>
                    )}
                  </div>

                  {/* Galeri Preview */}
                  {(existingGaleri.length > 0 || galeriPreviews.length > 0) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Galeri</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {existingGaleri.map((url, index) => (
                          <div key={`prev-exist-${index}`} className="relative">
                            <img src={url} alt={`Galeri ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                          </div>
                        ))}
                        {galeriPreviews.map((preview, index) => (
                          <div key={`prev-new-${index}`} className="relative">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg border-2 border-green-400" />
                            <span className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">Baru</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Details */}
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-bold text-gray-700">Kategori :</span>
                      <p className="text-gray-600 mt-1">
                        {activeTab === 'wisata' ? wisataForm.kategori : budayaForm.kategori}
                      </p>
                    </div>

                    {activeTab === 'wisata' && (
                      <div>
                        <span className="font-bold text-gray-700">Lokasi Tempat Wisata :</span>
                        <p className="text-gray-600 mt-1">{wisataForm.lokasi || '-'}</p>
                      </div>
                    )}

                    <div>
                      <span className="font-bold text-gray-700">Nama Tempat :</span>
                      <p className="text-gray-600 mt-1">
                        {(activeTab === 'wisata' ? wisataForm.judul : budayaForm.judul) || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-gray-700">Deskripsi :</span>
                      <p className="text-gray-600 mt-1 leading-relaxed">
                        {(activeTab === 'wisata' ? wisataForm.deskripsi : budayaForm.deskripsi) || '-'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}      {/* Delete Confirmation Modal - Modern Design */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            
            {/* Modal Header - Red Gradient */}
            <div className="relative p-6 bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Konfirmasi Hapus</h2>
                    <p className="text-white/90 text-sm mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Wave */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-white">
                <svg className="absolute bottom-0 w-full h-4" viewBox="0 0 1200 20" preserveAspectRatio="none">
                  <path d="M0,10 Q300,0 600,10 T1200,10 L1200,20 L0,20 Z" fill="white"/>
                </svg>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-200 to-pink-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                {/* Decorative Circles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-100 rounded-full opacity-20 animate-ping"></div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Yakin ingin menghapus data ini?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Data yang sudah dihapus tidak dapat dikembalikan. Pastikan Anda benar-benar yakin sebelum melanjutkan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 hover:from-red-600 hover:via-rose-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Pilih Lokasi {mapMode === 'wisata' ? 'Wisata' : 'Budaya'}
                </h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Klik pada peta untuk memilih lokasi yang diinginkan
              </p>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              {typeof window !== 'undefined' && (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {selectedCoordinates && (
                    <Marker position={selectedCoordinates} />
                  )}
                </MapContainer>
              )}
            </div>

            {/* Selected Location Info */}
            {selectedCoordinates && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lokasi Terpilih:
                  </label>
                  <p className="text-gray-600 text-sm">{tempLocationName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Latitude:</span>
                    <span className="text-gray-600 ml-2">{selectedCoordinates[0].toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Longitude:</span>
                    <span className="text-gray-600 ml-2">{selectedCoordinates[1].toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowMapModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLocationSelection}
                disabled={!selectedCoordinates}
                className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Pilih Lokasi
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

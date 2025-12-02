'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Camera,
  X,
  Building2,
  ArrowLeft
} from 'lucide-react'
import { 
  getLembagaKemasyarakatan, 
  saveLembagaKemasyarakatan, 
  deleteLembagaKemasyarakatan,
  getLembagaCoverImage,
  saveLembagaCoverImage,
  uploadLembagaImage 
} from '../../../../lib/profilDesaService'

// Custom animations and mobile optimizations
const customStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-slide-up {
    animation: slideUp 0.5s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  .animate-card-entrance {
    animation: cardEntrance 0.6s ease-out;
  }

  /* iOS safe area support */
  .safe-area-padding {
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* Touch optimizations */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  button, a {
    user-select: none;
    -webkit-user-select: none;
  }

  input, textarea {
    user-select: text;
    -webkit-user-select: text;
  }
`

interface AnggotaLembaga {
  id?: string;
  nama: string;
  jabatan: string;
  email: string;
  noTelepon: string;
  foto?: string;
  urutanTampil: number;
}

export default function AdminLembagaPage() {
  // Using single collection for lembaga kemasyarakatan
  const tipeLembaga = 'kemasyarakatan'
  
  const [dataAnggota, setDataAnggota] = useState<AnggotaLembaga[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingAnggota, setEditingAnggota] = useState<AnggotaLembaga | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [coverImage, setCoverImage] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Form state
  const [formData, setFormData] = useState<AnggotaLembaga>({
    nama: '',
    jabatan: '',
    email: '',
    noTelepon: '',
    foto: '',
    urutanTampil: 1
  })

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const lembagaData = await getLembagaKemasyarakatan(tipeLembaga)
      const coverImageData = await getLembagaCoverImage(tipeLembaga)
      
      setDataAnggota(lembagaData as AnggotaLembaga[])
      setCoverImage(coverImageData || '')
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)

      // Generate ID if adding new
      const anggotaData = {
        ...formData,
        id: editingAnggota?.id || `anggota_${Date.now()}`
      }

      let updatedAnggota: AnggotaLembaga[]

      if (editingAnggota) {
        // Update existing
        updatedAnggota = dataAnggota.map(a => 
          a.id === editingAnggota.id ? anggotaData : a
        )
      } else {
        // Add new
        updatedAnggota = [...dataAnggota, anggotaData]
      }

      // Sort by urutanTampil
      updatedAnggota.sort((a, b) => a.urutanTampil - b.urutanTampil)

      await saveLembagaKemasyarakatan(tipeLembaga, updatedAnggota)
      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving anggota:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (anggotaId: string) => {
    if (!confirm('Hapus anggota ini?')) return

    try {
      setIsLoading(true)
      await deleteLembagaKemasyarakatan(tipeLembaga, anggotaId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting anggota:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (anggota: AnggotaLembaga) => {
    setEditingAnggota(anggota)
    setFormData(anggota)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAnggota(null)
    setFormData({
      nama: '',
      jabatan: '',
      email: '',
      noTelepon: '',
      foto: '',
      urutanTampil: dataAnggota.length + 1
    })
  }

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const timestamp = Date.now()
      const fileName = `${timestamp}_cover.webp`
      const imageUrl = await uploadLembagaImage(file, fileName)
      await saveLembagaCoverImage(tipeLembaga, imageUrl)
      
      setCoverImage(imageUrl)
    } catch (error) {
      console.error('Error uploading cover image:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const timestamp = Date.now()
      const fileName = `${timestamp}_anggota.webp`
      const imageUrl = await uploadLembagaImage(file, fileName)
      
      setFormData(prev => ({ ...prev, foto: imageUrl }))
    } catch (error) {
      console.error('Error uploading foto anggota:', error)
      alert('Gagal mengupload foto. Silakan coba lagi.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <AdminLayout>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 p-3 sm:p-4 md:p-6 safe-area-padding">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => window.location.href = '/admin/profil-desa'}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-red-700 hover:text-red-800 font-medium transition-colors group animate-fade-in"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">Kembali ke Profil Desa</span>
          </button>

          {/* Custom Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 animate-slide-up">
            <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Kelola Lembaga Kemasyarakatan
              </h1>
            </div>
            <p className="text-red-50 text-xs sm:text-sm md:text-base ml-0 sm:ml-14 md:ml-16">
              Kelola anggota lembaga kemasyarakatan desa
            </p>
          </div>

          {/* Add Button */}
          <div className="mb-4 sm:mb-6 animate-fade-in">
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl sm:rounded-2xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Tambah Anggota</span>
            </button>
          </div>

          {/* Cover Image Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-red-100 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 animate-card-entrance">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-5">
              Gambar Cover Lembaga Kemasyarakatan
            </h3>
            
            {coverImage && (
              <div className="mb-4 sm:mb-5">
                <img
                  src={coverImage}
                  alt="Cover Lembaga Kemasyarakatan"
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover rounded-xl sm:rounded-2xl shadow-lg"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl sm:rounded-2xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 cursor-pointer text-sm sm:text-base font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{coverImage ? 'Ganti Cover' : 'Upload Cover'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>
              {isLoading && (
                <span className="text-red-600 text-xs sm:text-sm font-medium animate-pulse">
                  Mengupload...
                </span>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-red-100 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 animate-card-entrance">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-4 sm:mb-5 md:mb-6">
              Daftar Anggota Lembaga Kemasyarakatan ({dataAnggota.length})
            </h3>

            {dataAnggota.length === 0 ? (
              <div className="text-center py-8 sm:py-10 md:py-12">
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <div className="text-gray-400 text-sm sm:text-base md:text-lg font-medium">
                  Belum ada anggota lembaga kemasyarakatan
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  Tambahkan anggota pertama dengan tombol di atas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {dataAnggota.map((anggota, index) => (
                  <div
                    key={anggota.id || index}
                    className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-red-100 p-4 sm:p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {/* Header with actions */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl overflow-hidden flex-shrink-0 shadow-md">
                          {anggota.foto ? (
                            <img 
                              src={anggota.foto} 
                              alt={anggota.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            anggota.nama.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                            {anggota.nama}
                          </h4>
                          <span className="inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 bg-red-100 text-red-800 rounded-lg text-xs sm:text-sm font-medium mt-1">
                            {anggota.jabatan}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(anggota)}
                          className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(anggota.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                      <p className="truncate">📧 {anggota.email}</p>
                      <p>📱 {anggota.noTelepon}</p>
                      <p className="text-red-600 font-medium">🔢 Urutan: {anggota.urutanTampil}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-red-100 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto safe-area-padding animate-slide-up">
              <div className="sticky top-0 bg-gradient-to-r from-red-500 to-rose-600 px-4 sm:px-6 py-4 sm:py-5 rounded-t-3xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {editingAnggota ? 'Edit Anggota' : 'Tambah Anggota'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors active:scale-95"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="Masukkan jabatan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="contoh@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.noTelepon}
                    onChange={(e) => setFormData(prev => ({ ...prev, noTelepon: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Foto Anggota
                  </label>
                  
                  {formData.foto && !uploadingPhoto ? (
                    <div className="mb-3 relative">
                      <img
                        src={formData.foto}
                        alt="Preview"
                        className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-xl border-2 border-red-200 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, foto: '' }))}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg active:scale-95"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => document.getElementById('anggotaFotoInput')?.click()}
                    disabled={uploadingPhoto}
                    className="w-full px-4 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{uploadingPhoto ? 'Mengupload...' : (formData.foto ? 'Ganti Foto' : 'Pilih Foto')}</span>
                  </button>
                  <input
                    id="anggotaFotoInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutanTampil || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, urutanTampil: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
                    placeholder="1"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || uploadingPhoto}
                    className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
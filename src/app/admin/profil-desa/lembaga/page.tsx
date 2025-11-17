'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Camera,
  X 
} from 'lucide-react'
import { 
  getLembagaKemasyarakatan, 
  saveLembagaKemasyarakatan, 
  deleteLembagaKemasyarakatan,
  getLembagaCoverImage,
  saveLembagaCoverImage,
  uploadLembagaImage 
} from '../../../../lib/profilDesaService'

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
      urutanTampil: 1
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Kelola Lembaga Kemasyarakatan
                </h1>
                <p className="text-gray-600 mt-2">
                  Kelola anggota lembaga kemasyarakatan desa
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Tambah Anggota
              </button>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Gambar Cover Lembaga Kemasyarakatan
            </h3>
            
            {coverImage && (
              <div className="mb-4">
                <img
                  src={coverImage}
                  alt="Cover Lembaga Kemasyarakatan"
                  className="w-full max-w-md h-48 object-cover rounded-xl shadow-lg"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
                <Camera className="h-5 w-5" />
                {coverImage ? 'Ganti Cover' : 'Upload Cover'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>
              {isLoading && <span className="text-blue-600">Uploading...</span>}
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Daftar Anggota Lembaga Kemasyarakatan ({dataAnggota.length})
            </h3>

            {dataAnggota.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">
                  Belum ada anggota lembaga kemasyarakatan
                </div>
                <p className="text-gray-500 mt-2">
                  Tambahkan anggota pertama dengan tombol di atas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataAnggota.map((anggota, index) => (
                  <div
                    key={anggota.id || index}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
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
                        <div>
                          <h4 className="font-semibold text-gray-800">{anggota.nama}</h4>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                            {anggota.jabatan}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(anggota)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(anggota.id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>📧 {anggota.email}</p>
                      <p>📱 {anggota.noTelepon}</p>
                      <p>🔢 Urutan: {anggota.urutanTampil}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingAnggota ? 'Edit Anggota' : 'Tambah Anggota'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.noTelepon}
                    onChange={(e) => setFormData(prev => ({ ...prev, noTelepon: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto Anggota
                  </label>
                  <button
                    type="button"
                    onClick={() => document.getElementById('anggotaFotoInput')?.click()}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    {formData.foto ? 'Ganti Foto' : 'Pilih Foto'}
                  </button>
                  <input
                    id="anggotaFotoInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  {uploadingPhoto && (
                    <p className="text-sm text-blue-600 mt-2">Mengupload foto...</p>
                  )}
                  {formData.foto && !uploadingPhoto && (
                    <div className="mt-3 relative">
                      <img
                        src={formData.foto}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutanTampil}
                    onChange={(e) => setFormData(prev => ({ ...prev, urutanTampil: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
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
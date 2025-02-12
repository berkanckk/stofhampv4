'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface MaterialType {
  id: string
  name: string
}

export default function CreateListingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [images, setImages] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'NEW',
    categoryId: '',
    materialId: '',
    location: ''
  })

  // Oturum kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Kategori ve malzeme tiplerini yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/listings')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setCategories(result.data.categories)
        setMaterialTypes(result.data.materialTypes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu')
      }
    }

    fetchData()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadPromises = Array.from(e.target.files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        return result.data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resim yüklenirken bir hata oluştu')
    } finally {
      setUploadingImage(false)
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      router.push('/my-listings')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Başlık ve İlerleme Çubuğu */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
              Yeni İlan Oluştur
            </h1>
            <div className="flex justify-between items-center relative mb-4">
              <div className="absolute left-0 top-1/2 h-1 bg-gray-200 w-full -z-10"></div>
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold relative z-10 transition-all duration-300 ${
                    currentStep >= step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Temel Bilgiler</span>
              <span>Detaylar</span>
              <span>Resimler</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Adım 1: Temel Bilgiler */}
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    İlan Başlığı
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Ürününüzü en iyi şekilde tanımlayan kısa bir başlık girin
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Ürününüzün özelliklerini ve durumunu detaylı bir şekilde açıklayın
                  </p>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (TL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 pl-8"
                      required
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₺</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adım 2: Detaylar */}
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Durumu
                  </label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="NEW">Yeni</option>
                    <option value="USED">Kullanılmış</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="materialId" className="block text-sm font-medium text-gray-700 mb-1">
                    Malzeme Tipi
                  </label>
                  <select
                    id="materialId"
                    value={formData.materialId}
                    onChange={(e) => setFormData(prev => ({ ...prev, materialId: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Malzeme tipi seçin</option>
                    {materialTypes.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Konum
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                    placeholder="Örn: İstanbul, Kadıköy"
                  />
                </div>
              </div>
            </div>

            {/* Adım 3: Resimler */}
            <div className={currentStep === 3 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resimler
                  </label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`İlan resmi ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            removeImage(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <span>Resim Ekle</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                        disabled={uploadingImage}
                      />
                    </label>
                    {uploadingImage && <span className="text-gray-500">Resim yükleniyor...</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigasyon Butonları */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Geri
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  İleri
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || uploadingImage}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'İlan Yayınlanıyor...' : 'İlanı Yayınla'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  description: string | null
}

interface MaterialType {
  id: string
  name: string
  description: string | null
}

interface Seller {
  id: string
  name: string
  company: string | null
  profileImage: string | null
}

interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: 'NEW' | 'USED'
  images: string[]
  location: string
  category: Category
  material: MaterialType
  seller: Seller
  createdAt: string
}

export default function ListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<{
    categories: Category[]
    materialTypes: MaterialType[]
    listings: Listing[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtre state'leri
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '')
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('materialId') || '')
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [key: string]: number }>({})

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedCategory) params.append('categoryId', selectedCategory)
      if (selectedMaterial) params.append('materialId', selectedMaterial)
      if (selectedCondition) params.append('condition', selectedCondition)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (location) params.append('location', location)
      if (sortBy) params.append('sortBy', sortBy)

      const response = await fetch(`/api/listings?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [search, selectedCategory, selectedMaterial, selectedCondition, minPrice, maxPrice, location, sortBy])

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (selectedCategory) params.append('categoryId', selectedCategory)
    if (selectedMaterial) params.append('materialId', selectedMaterial)
    if (selectedCondition) params.append('condition', selectedCondition)
    if (minPrice) params.append('minPrice', minPrice)
    if (maxPrice) params.append('maxPrice', maxPrice)
    if (location) params.append('location', location)
    if (sortBy) params.append('sortBy', sortBy)

    router.push(`/listings?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedMaterial('')
    setSelectedCondition('')
    setMinPrice('')
    setMaxPrice('')
    setLocation('')
    setSortBy('newest')
    router.push('/listings')
  }

  const nextImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) + 1) % totalImages
    }))
  }

  const previousImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) - 1 + totalImages) % totalImages
    }))
  }

  const goToImage = (listingId: string, index: number) => {
    setCurrentImageIndices((prev) => ({
      ...prev,
      [listingId]: index
    }))
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded inline-block">
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4">
        {/* Arama ve Filtreler */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-grow max-w-2xl">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="İlan başlığı veya açıklama ara..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="ml-4 px-4 py-3 text-gray-600 hover:text-gray-800 font-medium flex items-center space-x-2 border rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Filtreler</span>
              </button>
            </div>

            {/* Detaylı Filtreler */}
            <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 transition-all duration-300 ${isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              {/* Kategori */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                >
                  <option value="">Tüm Kategoriler</option>
                  {data?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Malzeme Tipi */}
              <div>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                >
                  <option value="">Tüm Malzemeler</option>
                  {data?.materialTypes.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durum */}
              <div>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="NEW">Yeni</option>
                  <option value="USED">Kullanılmış</option>
                </select>
              </div>

              {/* Fiyat Aralığı */}
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min ₺"
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max ₺"
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                />
              </div>

              {/* Konum */}
              <div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Konum"
                  className="w-full rounded-lg border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            {/* Filtre Butonları */}
            <div className={`flex justify-end space-x-3 mt-4 transition-all duration-300 ${isFilterOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-300"
              >
                Filtreleri Temizle
              </button>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors duration-300 shadow-sm hover:shadow"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>

        {/* İlanlar Başlığı ve Sıralama */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            İlanlar
            {data?.listings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({data.listings.length} ilan)
              </span>
            )}
          </h1>
          <select
            className="border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 text-sm"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              const params = new URLSearchParams(window.location.search)
              params.set('sortBy', e.target.value)
              router.push(`/listings?${params.toString()}`)
            }}
          >
            <option value="newest">En Yeni</option>
            <option value="oldest">En Eski</option>
            <option value="price_asc">Fiyat (Düşükten Yükseğe)</option>
            <option value="price_desc">Fiyat (Yüksekten Düşüğe)</option>
          </select>
        </div>

        {/* İlanlar */}
        {data?.listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-4">Bu kriterlere uygun ilan bulunamadı.</p>
              <button
                onClick={clearFilters}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Filtreleri temizle
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.listings.map((listing) => (
              <div key={listing.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* İlan Resmi */}
                <div className="relative w-full pt-[56.25%]">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="absolute inset-0">
                      <div className="relative w-full h-full">
                        <Image
                          src={listing.images[currentImageIndices[listing.id] || 0]}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded-t-xl"
                          priority
                        />
                      </div>
                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              previousImage(listing.id, listing.images.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              nextImage(listing.id, listing.images.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                            {listing.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.preventDefault();
                                  goToImage(listing.id, index);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  index === (currentImageIndices[listing.id] || 0)
                                    ? 'bg-white scale-125'
                                    : 'bg-white/60 hover:bg-white/80'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                      listing.condition === 'NEW' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                    </span>
                  </div>
                </div>

                {/* İlan Detayları */}
                <Link href={`/listings/${listing.id}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">
                        {listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {listing.category.name}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {listing.material.name}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {listing.location}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* İlan Kartı Alt Kısmı - Satıcı Bilgileri */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                      {listing.seller.profileImage ? (
                        <Image
                          src={listing.seller.profileImage}
                          alt={listing.seller.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-100">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{listing.seller.name}</p>
                      {listing.seller.company && (
                        <p className="text-xs text-gray-500">{listing.seller.company}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import ListingImage from '@/app/components/ListingImage'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  description: string | null
  _count?: {
    listings: number
  }
}

interface MaterialType {
  id: string
  name: string
  description: string | null
  _count?: {
    listings: number
  }
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
  _count: {
    favorites: number
  }
}

type FilterKey = 'category' | 'material' | 'condition' | 'minPrice' | 'maxPrice' | 'location' | 'search';

interface Filters {
  category: string | null
  material: string | null
  condition: string | null
  minPrice: string | null
  maxPrice: string | null
  location: string | null
  search: string | null
}

function ListingsContent() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Filters>({
    category: searchParams.get('category'),
    material: searchParams.get('material'),
    condition: searchParams.get('condition'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    location: searchParams.get('location'),
    search: searchParams.get('search')
  })

  const [pendingFilters, setPendingFilters] = useState<Filters>({
    category: searchParams.get('category'),
    material: searchParams.get('material'),
    condition: searchParams.get('condition'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    location: searchParams.get('location'),
    search: searchParams.get('search')
  })

  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({})
  const [pendingSortBy, setPendingSortBy] = useState(searchParams.get('sortBy') || 'newest')

  const observer = useRef<IntersectionObserver | null>(null)
  const lastListingElementRef = useCallback((node: Element | null) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        // Load more items if needed
      }
    })
    if (node) observer.current.observe(node)
  }, [loading])

  const fetchListings = async (page: number, filters = activeFilters, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      }

      // URL parametrelerini oluştur
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('sortBy', pendingSortBy);

      // Filtreleri ekle
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          // Fiyat değerlerini sayısal formatta gönder
          if (key === 'minPrice' || key === 'maxPrice') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              params.append(key, numValue.toString());
            }
          } else {
            params.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/listings?${params.toString()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      if (isLoadMore) {
        setListings(prev => [...prev, ...data.data.items]);
      } else {
        setListings(data.data.items);
        setCategories(data.data.categories);
        setMaterialTypes(data.data.materialTypes);
      }

      setError(null);
    } catch (error) {
      console.error('Fetch listings error:', error);
      setError('İlanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL'den gelen parametreleri kontrol et ve filtreleri güncelle
    const urlFilters: Filters = {
      category: searchParams.get('category'),
      material: searchParams.get('material'),
      condition: searchParams.get('condition'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      location: searchParams.get('location'),
      search: searchParams.get('search')
    }
    
    console.log('URL filtre parametreleri:', urlFilters);
    
    setActiveFilters(urlFilters)
    setPendingFilters(urlFilters)
    fetchListings(1, urlFilters)
  }, [searchParams])

  const handleFilter = (key: FilterKey, value: string | null) => {
    // Kategori, malzeme ve durum filtreleri için direkt güncelleme
    if (key === 'category' || key === 'material' || key === 'condition') {
      const newFilters = {
        ...activeFilters,
        [key]: activeFilters[key] === value ? null : value // Eğer aynı değere tıklandıysa null yap
      }
      setActiveFilters(newFilters)
      setPendingFilters(newFilters)
      fetchListings(1, newFilters)
    } else {
      // Diğer filtreler için pending state'i kullan
      setPendingFilters(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }

  const applyAllFilters = () => {
    const newFilters = {
      ...activeFilters,
      ...pendingFilters
    }
    setActiveFilters(newFilters)
    setSortBy(pendingSortBy)
    fetchListings(1, newFilters)
  }

  const handleSort = (value: string) => {
    setPendingSortBy(value)
    setSortBy(value)
    fetchListings(1, activeFilters)
  }

  const clearFilters = () => {
    const emptyFilters: Filters = {
      category: null,
      material: null,
      condition: null,
      minPrice: null,
      maxPrice: null,
      location: null,
      search: null
    }
    setActiveFilters(emptyFilters)
    setPendingFilters(emptyFilters)
    setPendingSortBy('newest')
    setSortBy('newest')
    fetchListings(1, emptyFilters)
  }

  const nextImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) + 1) % totalImages,
    }))
  }

  const previousImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [listingId]: ((prev[listingId] || 0) - 1 + totalImages) % totalImages,
    }))
  }

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filtreler */}
          <div className="w-full lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-4">
              {/* Mobil Filtre Başlığı */}
              <button
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="w-full flex items-center justify-between lg:hidden mb-2"
              >
                <span className="text-lg font-semibold text-gray-900">Filtreler</span>
                <svg 
                  className={`w-5 h-5 transition-transform ${isFiltersVisible ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Filtre İçeriği */}
              <div className={`space-y-6 ${isFiltersVisible ? 'block' : 'hidden lg:block'}`}>
                {/* Kategoriler */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Kategoriler</h3>
                  <select
                    value={activeFilters.category || ''}
                    onChange={(e) => handleFilter('category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Malzeme Tipleri */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Malzeme Tipi</h3>
                  <select
                    value={activeFilters.material || ''}
                    onChange={(e) => handleFilter('material', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    {materialTypes.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durum */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Durum</h3>
                  <select
                    value={activeFilters.condition || ''}
                    onChange={(e) => handleFilter('condition', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="NEW">Yeni</option>
                    <option value="USED">Kullanılmış</option>
                  </select>
                </div>

                {/* Fiyat Aralığı */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Fiyat Aralığı</h3>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={activeFilters.minPrice || ''}
                      onChange={(e) => handleFilter('minPrice', e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={activeFilters.maxPrice || ''}
                      onChange={(e) => handleFilter('maxPrice', e.target.value)}
                      className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Konum */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Konum</h3>
                  <input
                    type="text"
                    placeholder="Şehir ara..."
                    value={activeFilters.location || ''}
                    onChange={(e) => handleFilter('location', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Filtre Butonları */}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={applyAllFilters}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Filtreleri Uygula
                  </button>
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* İlan Listesi */}
          <div className="flex-1">
            <div className="max-w-[2000px] mx-auto px-6">
              {/* Üst Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h1 className="text-2xl font-semibold text-gray-900">İlanlar</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {activeFilters.category && categories.find(c => c.id === activeFilters.category)?.name}
                    {activeFilters.material && ` • ${materialTypes.find(m => m.id === activeFilters.material)?.name}`}
                    {activeFilters.condition && ` • ${activeFilters.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}`}
                    {` (${listings.length} sonuç)`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="newest">En Yeni</option>
                    <option value="oldest">En Eski</option>
                    <option value="priceAsc">En Düşük Fiyat</option>
                    <option value="priceDesc">En Yüksek Fiyat</option>
                  </select>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* İlan Listesi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {listings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    ref={index === listings.length - 1 ? lastListingElementRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="relative aspect-[4/3]">
                      <Link href={`/listings/${listing.id}`}>
                        <div className="relative w-full h-full overflow-hidden">
                          <ListingImage
                            src={listing.images[currentImageIndexes[listing.id] || 0]}
                            alt={listing.title}
                            priority={index < 4}
                            className="transform transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      </Link>

                      {/* Durum Etiketi */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                          listing.condition === 'NEW'
                            ? 'bg-green-100/90 text-green-800'
                            : 'bg-yellow-100/90 text-yellow-800'
                        }`}>
                          {listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                        </span>
                      </div>

                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={() => previousImage(listing.id, listing.images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => nextImage(listing.id, listing.images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-3 sm:p-4">
                      <Link href={`/listings/${listing.id}`}>
                        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="text-red-600 font-bold text-sm sm:text-base mb-2">
                        {listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                        <span>{listing.location}</span>
                        <span>{format(new Date(listing.createdAt), 'd MMM', { locale: tr })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Yükleniyor */}
              {loading && (
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}

              {/* Hata Mesajı */}
              {error && (
                <div className="text-center text-red-600 my-8 bg-white p-4 rounded-lg shadow-sm">
                  {error}
                </div>
              )}

              {/* Sonuç Bulunamadı */}
              {!loading && !error && listings.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">İlan Bulunamadı</h3>
                  <p className="text-gray-500 mb-4">Arama kriterlerinize uygun ilan bulunamadı.</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  )
} 
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
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

interface Pagination {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextCursor: string | null
}

interface ApiResponse {
  success: boolean
  data: {
    items: Listing[]
    pagination: Pagination
  }
}

interface Filters {
  category: string | null
  material: string | null
  condition: string | null
  minPrice: string | null
  maxPrice: string | null
  location: string | null
  search: string | null
}

export default function ListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
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

  // Filtre state'leri
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('materialId') || '')
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({})

  const [pendingSortBy, setPendingSortBy] = useState(searchParams.get('sortBy') || 'newest')

  const observer = useRef<IntersectionObserver | null>(null)
  const lastListingElementRef = useCallback((node: Element | null) => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage(prev => prev + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])

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

      setTotalPages(data.data.pagination.totalPages);
      setHasMore(data.data.pagination.hasNextPage);
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
      setCurrentPage(1)
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
    setCurrentPage(1)
    fetchListings(1, newFilters)
  }

  const handleSort = (value: string) => {
    setPendingSortBy(value)
    setSortBy(value)
    setCurrentPage(1)
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

  const goToImage = (listingId: string, index: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [listingId]: index
    }))
  }

  // Fiyat filtresi için özel fonksiyon
  const handlePriceFilter = (key: 'minPrice' | 'maxPrice', value: string) => {
    const newFilters = { ...activeFilters };
    const numValue = value ? parseFloat(value) : null;
    
    if (numValue !== null && !isNaN(numValue)) {
      newFilters[key] = numValue.toString();
      
      // Min fiyat, max fiyattan büyükse max fiyatı güncelle
      if (key === 'minPrice' && newFilters.maxPrice) {
        const maxPrice = parseFloat(newFilters.maxPrice);
        if (numValue > maxPrice) {
          newFilters.maxPrice = numValue.toString();
        }
      }
      // Max fiyat, min fiyattan küçükse min fiyatı güncelle
      if (key === 'maxPrice' && newFilters.minPrice) {
        const minPrice = parseFloat(newFilters.minPrice);
        if (numValue < minPrice) {
          newFilters.minPrice = numValue.toString();
        }
      }
    } else {
      newFilters[key] = null;
    }

    setActiveFilters(newFilters);
    fetchListings(1, newFilters);
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Sonuç Sayısı ve Filtreler Başlığı */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 mt-16">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {activeFilters.category ? categories.find(c => c.id === activeFilters.category)?.name : 'Tüm İlanlar'}
            </h1>
            {(activeFilters.material || activeFilters.condition) && (
              <p className="text-lg text-gray-600">
                {activeFilters.material && `${materialTypes.find(m => m.id === activeFilters.material)?.name}`}
                {activeFilters.material && activeFilters.condition && ' • '}
                {activeFilters.condition && `${activeFilters.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex">
          {/* Sol Panel - Filtreler */}
          <div className="w-64 bg-white border-r border-gray-100 p-4 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-4">
              {/* Kategoriler */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Kategoriler</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilter('category', category.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        pendingFilters.category === category.id
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                      <span className="float-right text-xs text-gray-400">
                        ({category._count?.listings || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Malzeme */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Malzeme</h3>
                <div className="space-y-1">
                  {materialTypes.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleFilter('material', material.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        pendingFilters.material === material.id
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {material.name}
                      <span className="float-right text-xs text-gray-400">
                        ({material._count?.listings || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Durum */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Durum</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleFilter('condition', 'NEW')}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                      pendingFilters.condition === 'NEW'
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Yeni
                  </button>
                  <button
                    onClick={() => handleFilter('condition', 'USED')}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                      pendingFilters.condition === 'USED'
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Kullanılmış
                  </button>
                </div>
              </div>

              {/* Fiyat Aralığı */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Fiyat Aralığı</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min Fiyat"
                    value={pendingFilters.minPrice || ''}
                    onChange={(e) => handleFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Fiyat"
                    value={pendingFilters.maxPrice || ''}
                    onChange={(e) => handleFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Konum */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Konum</h3>
                <input
                  type="text"
                  placeholder="Şehir ara..."
                  value={pendingFilters.location || ''}
                  onChange={(e) => handleFilter('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Uygula Butonu */}
              <button
                onClick={applyAllFilters}
                className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Filtreleri Uygula
              </button>

              {/* Filtreleri Temizle */}
              {Object.values(activeFilters).some(value => value !== null) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="flex-1 min-h-screen bg-gray-50">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
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
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
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

                    <div className="p-4">
                      <Link href={`/listings/${listing.id}`}>
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="text-red-600 font-bold mb-2">
                        {listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
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
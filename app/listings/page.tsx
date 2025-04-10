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
    // URL'den gelen sıralama parametresini kontrol et
    const sortParam = searchParams.get('sortBy') || 'newest';
    setSortBy(sortParam);
    setPendingSortBy(sortParam);
    fetchListings(1, urlFilters)
  }, [searchParams])

  const handleFilter = (key: FilterKey, value: string | null) => {
    // Tüm filtreler için sadece pending state'i güncelle, direkt uygulama
    setPendingFilters(prev => ({
      ...prev,
      [key]: key === 'category' || key === 'material' || key === 'condition' 
        ? (prev[key] === value ? null : value) // Eğer aynı değere tıklandıysa null yap
        : value
    }))
  }

  const applyAllFilters = () => {
    const newFilters = {
      ...pendingFilters
    }
    setActiveFilters(newFilters)
    setSortBy(pendingSortBy)
    fetchListings(1, newFilters)
  }

  const handleSort = (value: string) => {
    setPendingSortBy(value)
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-6 shadow-lg text-white">
          <h1 className="text-3xl font-bold mb-2">Tüm İlanlar</h1>
          <p className="text-green-50 max-w-2xl">
            Yüksek kaliteli sıfır ve ikinci el ürünleri keşfedin. İhtiyacınız olan her şey burada!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtreler - Yeniden Tasarlanmış */}
          <div className="w-full lg:w-72 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4">
                <button
                  onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                  className="w-full flex items-center justify-between lg:hidden"
                >
                  <span className="text-lg font-semibold text-white">Filtreler</span>
                  <svg 
                    className={`w-5 h-5 text-white transition-transform ${isFiltersVisible ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-white hidden lg:block">Filtreler</h2>
              </div>

              {/* Filtre İçeriği */}
              <div className={`p-5 space-y-6 ${isFiltersVisible ? 'block' : 'hidden lg:block'}`}>
                {/* Arama Kutusu */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Ürün Ara</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ürün adı veya açıklama..."
                      value={pendingFilters.search || ''}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Kategoriler */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Kategoriler</h3>
                  <div className="relative">
                    <select
                      value={pendingFilters.category || ''}
                      onChange={(e) => handleFilter('category', e.target.value)}
                      className="w-full p-3 pl-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">Tüm Kategoriler</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Malzeme Tipleri */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Malzeme Tipi</h3>
                  <div className="relative">
                    <select
                      value={pendingFilters.material || ''}
                      onChange={(e) => handleFilter('material', e.target.value)}
                      className="w-full p-3 pl-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">Tüm Malzemeler</option>
                      {materialTypes.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Durum */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Durum</h3>
                  <div className="relative">
                    <select
                      value={pendingFilters.condition || ''}
                      onChange={(e) => handleFilter('condition', e.target.value)}
                      className="w-full p-3 pl-3 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">Tüm Durumlar</option>
                      <option value="NEW">Sıfır</option>
                      <option value="USED">İkinci El</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Fiyat Aralığı */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Fiyat Aralığı</h3>
                  <div className="flex space-x-2">
                    <div className="relative w-1/2">
                      <input
                        type="number"
                        placeholder="Min ₺"
                        value={pendingFilters.minPrice || ''}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="relative w-1/2">
                      <input
                        type="number"
                        placeholder="Max ₺"
                        value={pendingFilters.maxPrice || ''}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Konum */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Konum</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Şehir ara..."
                      value={pendingFilters.location || ''}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filtre Butonları */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={applyAllFilters}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-600 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  >
                    Filtreleri Uygula
                  </button>
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* İlan Listesi - Yeniden Tasarlanmış */}
          <div className="flex-1">
            {/* Üst Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {listings.length} İlan Bulundu
                    </h2>
                    {activeFilters.category && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        {categories.find(c => c.id === activeFilters.category)?.name}
                      </span>
                    )}
                    {activeFilters.material && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {materialTypes.find(m => m.id === activeFilters.material)?.name}
                      </span>
                    )}
                    {activeFilters.condition && (
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                        {activeFilters.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                      </span>
                    )}
                  </div>
                  {(activeFilters.category || activeFilters.material || activeFilters.condition || activeFilters.minPrice || activeFilters.maxPrice || activeFilters.location || activeFilters.search) && (
                    <div className="text-sm text-gray-500 mt-1">
                      Aktif filtreler:
                      {activeFilters.search && ` "${activeFilters.search}"`}
                      {activeFilters.location && ` • ${activeFilters.location}`}
                      {activeFilters.minPrice && ` • Min: ${activeFilters.minPrice}₺`}
                      {activeFilters.maxPrice && ` • Max: ${activeFilters.maxPrice}₺`}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative">
                    <select
                      value={pendingSortBy}
                      onChange={(e) => handleSort(e.target.value)}
                      className="w-full sm:w-44 pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="newest">En Yeni</option>
                      <option value="oldest">En Eski</option>
                      <option value="priceAsc">En Düşük Fiyat</option>
                      <option value="priceDesc">En Yüksek Fiyat</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  {(activeFilters.category || activeFilters.material || activeFilters.condition || activeFilters.minPrice || activeFilters.maxPrice || activeFilters.location || activeFilters.search) && (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tüm Filtreleri Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* İlan Listesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  ref={index === listings.length - 1 ? lastListingElementRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3]">
                    <Link href={`/listings/${listing.id}`}>
                      <div className="relative w-full h-full overflow-hidden">
                        <ListingImage
                          src={listing.images[currentImageIndexes[listing.id] || 0]}
                          alt={listing.title}
                          priority={index < 6}
                          className="transform transition-transform duration-500 group-hover:scale-105 object-cover w-full h-full"
                        />
                        {/* Overlay for hover effect */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      </div>
                    </Link>

                    {/* Durum Etiketi */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-md ${
                        listing.condition === 'NEW'
                          ? 'bg-green-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}>
                        {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/90 text-white backdrop-blur-md">
                        {listing.category.name}
                      </span>
                    </div>

                    {/* Fiyat Etiketi */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/90 text-green-700 backdrop-blur-md">
                        {listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </span>
                    </div>

                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            previousImage(listing.id, listing.images.length);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                          <div className="px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-md">
                            {(currentImageIndexes[listing.id] || 0) + 1} / {listing.images.length}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(new Date(listing.createdAt), 'd MMM yyyy', { locale: tr })}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.location}
                      </span>
                    </div>
                    
                    <Link href={`/listings/${listing.id}`}>
                      <h3 className="font-semibold text-base text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    
                    <div className="mt-3 flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {listing.seller.profileImage ? (
                            <img src={listing.seller.profileImage} alt={listing.seller.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                              {listing.seller.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          <p className="text-xs font-medium text-gray-900">{listing.seller.name}</p>
                          {listing.seller.company && (
                            <p className="text-xs text-gray-500">{listing.seller.company}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-500 flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                          </svg>
                          {listing._count.favorites}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Yükleniyor */}
            {loading && (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* Hata Mesajı */}
            {error && (
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg my-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 text-red-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchListings(1, activeFilters)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Sonuç Bulunamadı */}
            {!loading && !error && listings.length === 0 && (
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg my-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">İlan Bulunamadı</h3>
                <p className="text-gray-600 mb-4">Arama kriterlerinize uygun ilan bulunamadı.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
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
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import SearchableDropdown from '@/app/components/SearchableDropdown'
import ListingCard from '@/app/components/ListingCard'

// İlan türü tanımlaması
interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: 'NEW' | 'USED'
  images: string[]
  location: string
  category: {
    id: string
    name: string
  }
  createdAt: string
  _count: {
    favorites: number
  }
}

// Kategori ve malzeme tipi arayüzleri
interface Category {
  id: string
  name: string
}

interface MaterialType {
  id: string
  name: string
}

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [latestListings, setLatestListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])

  // Filtreleme için arama terimleri
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [materialSearchTerm, setMaterialSearchTerm] = useState('')
  
  // Seçilen kategori ve malzeme tipi
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  
  // Filtrelenmiş kategori ve malzeme listeleri
  const filteredCategories = categorySearchTerm
    ? categories.filter(category => 
        category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : categories;
    
  const filteredMaterialTypes = materialSearchTerm
    ? materialTypes.filter(material => 
        material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()))
    : materialTypes;

  // Son eklenen ilanları yükle
  useEffect(() => {
    const fetchLatestListings = async () => {
      try {
        setLoadingListings(true)
        const response = await fetch('/api/listings?limit=8&sort=newest')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json()
        
        if (result.success) {
          // API'den gelen ilanları 8 ile sınırlandır
          setLatestListings(result.data.items.slice(0, 8))
        } else {
          console.error('Fetch latest listings error:', result.message)
          setLatestListings([]) // Boş array ile devam et, UI hatasız gösterilsin
        }
      } catch (error) {
        console.error('Fetch latest listings error:', error)
        setLatestListings([]) // Hata durumunda boş array kullan
      } finally {
        setLoadingListings(false)
      }
    }
    
    fetchLatestListings()
  }, [])

  // Kategorileri ve malzeme tiplerini yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Veritabanından kategorileri ve malzeme tiplerini al
        const response = await fetch('/api/listings?page=1&limit=1');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.data.categories || []);
          setMaterialTypes(result.data.materialTypes || []);
        } else {
          console.error('API error:', result.message);
          setCategories([]);
          setMaterialTypes([]);
        }
      } catch (error) {
        console.error('Kategori ve malzeme tipleri yüklenirken hata:', error);
        // Hatalar olsa bile boş dizilerle devam et, UI'da hatalar gösterilmesin
        setCategories([]);
        setMaterialTypes([]);
      }
    };
    
    fetchData();
  }, []);

  // Kategori değiştiğinde ilgili malzeme tiplerini getir
  useEffect(() => {
    const fetchMaterialTypes = async () => {
      try {
        const endpoint = selectedCategoryId 
          ? `/api/materials?categoryId=${selectedCategoryId}` 
          : '/api/materials';
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setMaterialTypes(result.data);
          // Eğer önceden seçili malzeme yeni kategoride yoksa, seçimi sıfırla
          if (selectedMaterialId) {
            const materialExists = result.data.some((material: MaterialType) => material.id === selectedMaterialId);
            if (!materialExists) {
              setSelectedMaterialId('');
            }
          }
        } else {
          console.error('API error:', result.message);
          setMaterialTypes([]);
        }
      } catch (error) {
        console.error('Malzeme tipleri yüklenirken hata:', error);
        // Hata durumunda boş dizi kullan
        setMaterialTypes([]);
      }
    };
    
    fetchMaterialTypes();
  }, [selectedCategoryId, selectedMaterialId]);

  // Kategoriye göre malzeme filtresi değişikliği
  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId || "");
    
    // Kategori değişirse malzeme seçimini sıfırla
    setSelectedMaterialId("");
  };

  // Gerçek zamanlı arama için state ve işleyici
  const [searchTerm, setSearchTerm] = useState("")
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sadece state'i güncelle, otomatik arama yapma
    setSearchTerm(e.target.value)
  }
  
  // Component unmount olduğunda zamanlayıcıyı temizle
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Bugün'
    } else if (diffDays === 1) {
      return 'Dün'
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} hafta önce`
    } else {
      return `${Math.floor(diffDays / 30)} ay önce`
    }
  }

  // Arama formunu işle
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (searchTerm) {
      // Ana terim
      params.append('search', searchTerm);
      
      // Alternatif terimler oluşturalım
      const altTerms = generateAlternativeTerms(searchTerm);
      if (altTerms.length > 0) {
        params.append('altTerms', altTerms.join(','));
      }
    }
    
    if (selectedCategoryId) {
      params.append('category', selectedCategoryId);
    }
    
    if (selectedMaterialId) {
      params.append('material', selectedMaterialId);
    }
    
    router.push(`/listings?${params.toString()}`);
  };

  // Alternatif arama terimleri oluştur (ek hali, kök hali vb.)
  const generateAlternativeTerms = (term: string): string[] => {
    const altTerms: string[] = [];
    const normalizedTerm = term.toLowerCase().trim();
    
    // Boş veya çok kısa terimler için alternatif önermiyoruz
    if (normalizedTerm.length < 3) return altTerms;
    
    // Türkçe ek çıkarma basit kuralları (çok basit bir yaklaşım)
    // Bıçak -> bıçağı, bıçaklar, vb.
    if (normalizedTerm.endsWith('k')) {
      altTerms.push(normalizedTerm.slice(0, -1) + 'ğ'); // bıçak -> bıça + ğ
    }
    
    // Kelime kökünü almak için son birkaç karakteri çıkaralım
    if (normalizedTerm.length > 4) {
      altTerms.push(normalizedTerm.slice(0, -1)); // Son harf çıkar 
      altTerms.push(normalizedTerm.slice(0, -2)); // Son 2 harf çıkar
    }
    
    // Eklenebilecek yaygın ekler
    if (normalizedTerm.length > 3) {
      altTerms.push(normalizedTerm + 'lar'); // Çoğul
      altTerms.push(normalizedTerm + 'ler'); // Çoğul
      
      // Harf değişimleri
      if (normalizedTerm.endsWith('k')) {
        altTerms.push(normalizedTerm.slice(0, -1) + 'ğı'); // bıçak -> bıçağı
      }
    }
    
    // Yaygın yazım hataları veya alternatif yazımlar
    // Örnek: 's' yerine 'ş' kullanılabilir
    const commonMistakes: Record<string, string> = {
      's': 'ş', 'ş': 's',
      'c': 'ç', 'ç': 'c',
      'g': 'ğ', 'ğ': 'g',
      'i': 'ı', 'ı': 'i',
      'o': 'ö', 'ö': 'o',
      'u': 'ü', 'ü': 'u'
    };
    
    // Tüm harfler için yazım hatası alternatiflerini oluştur
    for (let i = 0; i < normalizedTerm.length; i++) {
      const char = normalizedTerm[i];
      const altChar = commonMistakes[char];
      
      if (altChar) {
        const altTerm = normalizedTerm.slice(0, i) + altChar + normalizedTerm.slice(i + 1);
        altTerms.push(altTerm);
      }
    }
    
    // Tekrar eden terimleri kaldır
    return altTerms.filter((term, index) => altTerms.indexOf(term) === index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Görselli üst kısım */}
      <section className="relative overflow-hidden h-screen flex flex-col items-center justify-center">
        {/* Arkaplan Görseli ve Desenleri */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="Hero Background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            style={{ objectPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-5"></div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center h-full">
          {/* Logo ve Başlık */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-6 md:mb-12 flex flex-col items-center px-4"
          >
            
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
              <span className="font-light text-green-400">Stok</span><span className="font-bold">Fazlası</span>
            </h1>
            
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-4 md:mb-8">
              Ham Madde Pazarı
            </h2>
            
            <p className="text-base md:text-xl text-gray-200 max-w-3xl mx-auto">
              Sürdürülebilir kaynak yönetimi için stok fazlası malzemelerinizi değerlendirin veya ihtiyacınız olan malzemeleri uygun fiyata bulun.
            </p>
          </motion.div>

          {/* Minimal Arama */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-4xl mx-auto mb-10 md:mb-20 px-4"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-3 relative z-30">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Ne arıyorsunuz?"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-14 pr-5 py-4 text-lg bg-white/90 text-gray-700 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                  <SearchableDropdown 
                    options={categories}
                    value={selectedCategoryId}
                    onChange={handleCategoryChange}
                    placeholder="Kategori"
                    searchPlaceholder="Kategori ara..."
                    className="w-full md:w-44"
                  />
                  
                  <SearchableDropdown 
                    options={materialTypes}
                    value={selectedMaterialId}
                    onChange={(value) => setSelectedMaterialId(value || '')}
                    placeholder="Malzeme"
                    searchPlaceholder="Malzeme ara..."
                    className="w-full md:w-44"
                  />
                  
                  <button
                    type="submit"
                    className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center whitespace-nowrap"
                  >
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Ara
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Durum İkonları */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center gap-8 md:gap-24 relative z-20"
          >
            {/* Sıfır Ürünler */}
            <Link href="/listings?condition=NEW" className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm mb-2 md:mb-3 transition-all duration-300 hover:bg-white/20 hover:scale-105 shadow-lg">
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="text-white text-center font-medium text-sm md:text-lg">Sıfır</span>
            </Link>

            {/* İkinci El */}
            <Link href="/listings?condition=USED" className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm mb-2 md:mb-3 transition-all duration-300 hover:bg-white/20 hover:scale-105 shadow-lg">
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 10L8 6M4 10L8 14M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 14L16 18M20 14L16 10M20 14H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-white text-center font-medium text-sm md:text-lg">İkinci El</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* İstatistikler ve diğer içerikler */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          {/* İstatistik Kartları */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-5xl mx-auto mb-16"
          >
            <div className="p-4 rounded-xl text-center border border-gray-100 shadow-sm bg-white">
              <div className="text-3xl font-bold mb-1 text-green-600">3500+</div>
              <div className="text-sm text-gray-500">Aktif Kullanıcı</div>
            </div>
            <div className="p-4 rounded-xl text-center border border-gray-100 shadow-sm bg-white">
              <div className="text-3xl font-bold mb-1 text-green-600">1250+</div>
              <div className="text-sm text-gray-500">Tamamlanan İşlem</div>
            </div>
            <div className="p-4 rounded-xl text-center border border-gray-100 shadow-sm bg-white">
              <div className="text-3xl font-bold mb-1 text-green-600">250+</div>
              <div className="text-sm text-gray-500">Ton CO₂ Tasarruf</div>
            </div>
            <div className="p-4 rounded-xl text-center border border-gray-100 shadow-sm bg-white">
              <div className="text-3xl font-bold mb-1 text-green-600">85%</div>
              <div className="text-sm text-gray-500">Müşteri Memnuniyeti</div>
            </div>
          </motion.div>

          {/* Son Eklenen İlanlar */}
          <div className="w-full mb-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex justify-between items-center mb-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 relative">
                <span className="relative z-10">Son Eklenen İlanlar</span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-green-500/30 rounded-full"></span>
              </h3>
              <Link 
                href="/listings?sort=newest" 
                className="text-green-600 font-medium hover:text-green-700 transition-colors flex items-center"
              >
                <span>Tümünü Gör</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            </motion.div>
          
          {loadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-40 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                      <div className="h-6 bg-gray-200 rounded-lg w-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded-full w-1/2 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
            ) : latestListings.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {latestListings.map((listing) => (
                <motion.div 
                  key={listing.id}
                    whileHover={{ 
                      y: -5,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col"
                  >
                    <Link href={`/listings/${listing.id}`} className="block relative h-40 overflow-hidden">
                        {listing.images && listing.images.length > 0 ? (
                          <Image 
                            src={listing.images[0]} 
                            alt={listing.title} 
                          fill
                          className="object-cover"
                          />
                        ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                        {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                      </div>
                    </Link>
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="text-xs text-gray-500 mb-1">{listing.category.name}</div>
                      <Link href={`/listings/${listing.id}`} className="block">
                        <h3 className="text-base font-semibold text-gray-800 hover:text-green-600 transition-colors line-clamp-2 mb-2">{listing.title}</h3>
                      </Link>
                      <div className="text-green-600 font-bold mb-1">{listing.price.toLocaleString('tr-TR')} ₺</div>
                      <div className="text-xs text-gray-500 mt-auto flex justify-between items-center">
                        <span>{formatDate(listing.createdAt)}</span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                          </svg>
                          {listing._count.favorites}
                        </span>
                      </div>
                    </div>
                </motion.div>
              ))}
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Henüz İlan Bulunamadı</h3>
                <p className="text-gray-500 mb-6">Platformda henüz ilan yok. İlk ilanı oluşturarak başlayabilirsiniz.</p>
              <Link 
                href="/listings/create" 
                  className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg text-base font-medium shadow-sm hover:shadow-md transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk İlanı Oluştur
              </Link>
            </div>
          )}
        </div>

          {/* Hemen Başlayın Bölümü */}
          <div className="w-full max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-md text-center">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Hemen Başlayın
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Stok fazlası ham maddelerinizi değerlendirmek veya ihtiyacınız olan malzemeleri uygun fiyata bulmak için hemen üye olun.
            </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                {session ? (
                <Link
                    href="/listings/create" 
                    className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    İlan Ver
                </Link>
              ) : (
                <Link
                    href="/register" 
                    className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Ücretsiz Üye Ol
                </Link>
              )}
                
              <Link
                href="/listings"
                  className="inline-flex items-center bg-white hover:bg-gray-50 text-green-600 hover:text-green-700 border border-gray-200 px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                İlanları Görüntüle
              </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
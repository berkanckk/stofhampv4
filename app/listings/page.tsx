'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import ListingImage from '@/app/components/ListingImage'
import { motion } from 'framer-motion'
import SearchableDropdown from '@/app/components/SearchableDropdown'

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
  slug: string
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
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [hasMore, setHasMore] = useState(false)
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 9 // Backend ile aynı olmalı

  // Filtreleme için arama terimleri
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [materialSearchTerm, setMaterialSearchTerm] = useState('')
  
  // Filtrelenmiş kategori ve malzeme listeleri
  const filteredCategories = categorySearchTerm
    ? categories.filter(category => 
        category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    : categories;
    
  // Önce kategoriye göre malzemeleri filtrele, sonra arama terimine göre filtrele
  const filteredMaterialTypes = (() => {
    // Filtreler uygulandıktan sonra activeFilters.category, uygulanmadan önce pendingFilters.category'yi göster
    // Bu şekilde malzemeler her iki durumda da doğru filtrelenecek
    const currentCategory = activeFilters.category || pendingFilters.category;
    
    console.log("🟢 MALZEME RENDER:", materialTypes.length ? "Malzemeler var" : "Malzemeler yok", 
                "Kategori:", currentCategory || "Seçili değil");
    
    if (materialTypes.length > 0) {
      console.log("🟢 Görüntülenen malzeme örnekleri:", 
                  materialTypes.slice(0, 3).map(m => m.name).join(', '));
    }
    
    // Arama terimine göre mevcut malzeme listesini filtrele
    return materialSearchTerm
      ? materialTypes.filter(material => 
          material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()))
      : materialTypes;
  })();

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

  // Mobil cihaz kontrolü
  const [onMobile, setOnMobile] = useState(false)

  useEffect(() => {
    // Ekran boyutuna göre mobil kontrolü
    const checkMobile = () => {
      setOnMobile(window.innerWidth < 768)
    }
    
    // İlk yüklemede kontrol et
    checkMobile()
    
    // Ekran boyutu değiştiğinde kontrol et
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      console.log("Kategoriler getiriliyor");
      
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log("Kategoriler geldi:", result.data.length);
        setCategories(result.data);
      } else {
        console.error('Kategoriler yüklenirken API hatası:', result.message);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    }
  };

  // Sayfa yüklendiğinde kategorileri getir
  useEffect(() => {
    fetchCategories();
  }, []);

  const generateAlternativeTerms = (term: string) => {
    const alternatives = [term];
    const lowerTerm = term.toLowerCase().trim();
    
    // Çok kısa terimler için alternatif üretme
    if (lowerTerm.length < 3) return alternatives;
    
    // Kelime yumuşamaları (k->ğ, p->b, t->d, ç->c vb.)
    if (lowerTerm.endsWith('k')) {
      // bıçak -> bıçağ 
      alternatives.push(lowerTerm.slice(0, -1) + 'ğ');
      
      // bıçak -> bıçağı, bıçağa, bıçağın
      alternatives.push(lowerTerm.slice(0, -1) + 'ğı');
      alternatives.push(lowerTerm.slice(0, -1) + 'ğa');
      alternatives.push(lowerTerm.slice(0, -1) + 'ğın');
    }
    
    if (lowerTerm.endsWith('p')) {
      alternatives.push(lowerTerm.slice(0, -1) + 'b');
    }
    
    if (lowerTerm.endsWith('t')) {
      alternatives.push(lowerTerm.slice(0, -1) + 'd');
    }
    
    if (lowerTerm.endsWith('ç')) {
      alternatives.push(lowerTerm.slice(0, -1) + 'c');
    }
    
    // Yaygın Türkçe ekler
    const suffixes = ['lar', 'ler', 'i', 'ı', 'u', 'ü', 'da', 'de', 'ta', 'te'];
    
    // Orijinal kelimeye ve yumuşamış haline tüm ekleri ekle
    alternatives.forEach(base => {
      suffixes.forEach(suffix => {
        alternatives.push(base + suffix);
      });
    });
    
    // Tekrarları kaldır (linter hatasını düzeltmek için Array.from kullanımı)
    return Array.from(new Set(alternatives));
  };

  const fetchListings = async (page: number, filters: Filters = activeFilters, isLoadMore: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Sayfa ${page} için ilanlar getiriliyor...`)

      // URL parametreleri oluştur
      const params = new URLSearchParams()
      params.set('page', page.toString())
      
      // Filtreleri ekle
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString())
        }
      })
      
      // Arama terimine alternatifler ekle
      if (filters.search) {
        const alternatives = generateAlternativeTerms(filters.search);
        if (alternatives.length > 1) {
          params.set('altTerms', alternatives.slice(1).join(',')); // İlk terim zaten orijinal
          console.log("Alternatif arama terimleri:", alternatives.slice(1));
        }
      }
      
      // Sıralama parametresini ekle - pendingSortBy yerine sortBy kullan
      // çünkü applyAllFilters fonksiyonunda bu değerler zaten senkronize edildi
      if (sortBy !== 'newest') {
        params.set('sortBy', sortBy)
      }
      
      console.log('İlanlar için API çağrısı:', `/api/listings?${params.toString()}`)
      console.log('Sıralama değeri:', sortBy)
      
      const response = await fetch(`/api/listings?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        if (isLoadMore) {
          setListings(prev => [...prev, ...data.data.items])
        } else {
          setListings(data.data.items)
          // Kategorileri güncelle
          if (data.data.categories && data.data.categories.length > 0) {
            console.log("Kategoriler API'den geldi:", data.data.categories.length);
            setCategories(data.data.categories);
          }
          // Malzeme tiplerini güncelle
          if (data.data.materialTypes && data.data.materialTypes.length > 0) {
            console.log("Malzeme tipleri API'den geldi:", data.data.materialTypes.length);
            setMaterialTypes(data.data.materialTypes);
          }
        }
        
        // API'den dönen pagination bilgilerini kullan
        setCurrentPage(data.data.pagination.currentPage)
        setTotalPages(data.data.pagination.totalPages)
        setTotalItems(data.data.pagination.totalItems)
        setHasMore(data.data.pagination.hasNextPage)
        
        setLoading(false)
        return data // Promise döndürüyoruz, böylece .then() kullanabiliriz
      } else {
        throw new Error(data.message || 'İlanlar yüklenirken bir hata oluştu.')
      }
    } catch (err) {
      console.error('İlanlar yüklenirken hata:', err)
      setError('İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
      setListings([])
      setLoading(false)
      throw err // Hata olduğunda da Promise reddediliyor, böylece catch kullanabiliriz
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    console.log(`Sayfa değiştiriliyor: ${currentPage} -> ${newPage} (Toplam: ${totalPages})`);
    
    // URL'i güncelle
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('page');
    } else {
      params.set('page', newPage.toString());
    }
    
    // Diğer parametreleri koru
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
    
    setCurrentPage(newPage);
    fetchListings(newPage);
    
    // Sayfa değiştiğinde sayfanın üstüne scroll yapalım
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Kategoriye göre malzemeleri filtreleme fonksiyonu
  const loadMaterialsForCategory = async (categoryId: string | null) => {
    try {
      console.log("📦 Kategori değişimi için malzemeleri yükleniyor:", categoryId || "Tüm kategoriler");
      
      const endpoint = categoryId 
        ? `/api/materials?categoryId=${categoryId}` 
        : '/api/materials';
      
      console.log("📦 Malzeme API endpoint:", endpoint);
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`📦 Kategori için malzemeler yüklendi (${result.data.length} adet)`);
        if (result.data.length > 0) {
          console.log("📦 İlk birkaç malzeme:", result.data.slice(0, 3).map((m: any) => m.name).join(', '));
        } else {
          console.log("📦 Bu kategoride hiç malzeme yok!");
        }
        
        // Malzeme tiplerini güncelle
        setMaterialTypes(result.data);
        
        // Malzeme aramasını sıfırla
        setMaterialSearchTerm('');
        
        // Eğer mevcut seçili malzeme bu kategoriye ait değilse sıfırla
        if (pendingFilters.material) {
          const materialExists = result.data.some((m: MaterialType) => m.id === pendingFilters.material);
          if (!materialExists) {
            console.log("📦 Seçili malzeme tipi bu kategoride yok, sıfırlanıyor");
            setPendingFilters(prev => ({...prev, material: null}));
          }
        }
        
        // En son işlem olarak force render için bir dummy state güncelle
        setLoading(false); // Loading state'ini kapatarak force render
        
        return result.data; // Promise olarak malzemeleri döndür
      } else {
        console.error('📦 Malzeme yüklenirken API hatası:', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('📦 Malzeme yükleme hatası:', error);
      throw error; // Hatayı yeniden fırlat
    }
  };

  // URL parametrelerine göre sayfa yüklendiğinde
  useEffect(() => {
    // URL'den sayfa numarasını al
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam) : 1;
    
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
    
    console.log('🔍 URL filtre parametreleri:', urlFilters);
    console.log('🔍 Başlangıç sayfası:', initialPage);
    
    // Aktif ve bekleyen filtreleri güncelle
    setActiveFilters(urlFilters);
    setPendingFilters(urlFilters);
    
    // URL'den gelen sıralama parametresini kontrol et
    const sortParam = searchParams.get('sortBy') || 'newest';
    setSortBy(sortParam);
    setPendingSortBy(sortParam);
    
    setCurrentPage(initialPage);
    
    // ÖNEMLİ: Önce kategori seçili ise, ilgili malzeme tiplerini getir
    // Bu işlem tamamlandıktan sonra ilanları getir
    if (urlFilters.category) {
      console.log('🔍 URL değişimi: Kategori seçili, malzemeleri yüklüyorum');
      loadMaterialsForCategory(urlFilters.category)
        .then(() => {
          console.log('🔍 URL değişimi: Malzemeler yüklendi, ilanları getiriyorum');
          fetchListings(initialPage, urlFilters);
        })
        .catch(error => {
          console.error('🔍 URL değişimi: Malzeme yükleme hatası:', error);
          fetchListings(initialPage, urlFilters);
        });
    } else {
      console.log('🔍 URL değişimi: Kategori seçili değil, tüm malzemeleri yüklüyorum');
      loadMaterialsForCategory(null)
        .then(() => {
          console.log('🔍 URL değişimi: Tüm malzemeler yüklendi, ilanları getiriyorum');
          fetchListings(initialPage, urlFilters);
        })
        .catch(error => {
          console.error('🔍 URL değişimi: Malzeme yükleme hatası:', error);
          fetchListings(initialPage, urlFilters);
        });
    }
  }, [searchParams]);

  // loadMaterialsForCategory fonksiyonunu force update ile güncelleyelim
  const [forceUpdate, setForceUpdate] = useState(0);

  // Kategori değiştiğinde malzemeleri güncelle - çok önemli!
  useEffect(() => {
    // Bekleyen kategori değiştiğinde malzemeleri güncelle
    if (pendingFilters.category) {
      console.log("🌟 Bekleyen kategori değişti, malzemeleri yüklüyorum:", pendingFilters.category);
      loadMaterialsForCategory(pendingFilters.category)
        .then(() => {
          console.log("🌟 Bekleyen kategori için malzemeler yüklendi");
        })
        .catch(error => {
          console.error("🌟 Bekleyen kategori için malzeme yükleme hatası:", error);
        });
    } else {
      console.log("🌟 Bekleyen kategori temizlendi, tüm malzemeleri yüklüyorum");
      loadMaterialsForCategory(null);
    }
  }, [pendingFilters.category, forceUpdate]);

  const handleFilter = (key: FilterKey, value: string | null) => {
    console.log('Filter değişti:', key, value);
    
    // Tüm filtreler için pending state'i güncelle
    if (key === 'category') {
      // Kategori değişiminde özel işlem
      if (value === pendingFilters.category) {
        // Aynı kategoriye tıklandıysa, temizle
        console.log("⭐ Kategori temizleniyor (aynı kategoriye tıklandı)");
        setPendingFilters(prev => ({...prev, category: null, material: null}));
        
        // Hemen tüm malzemeleri yükle
        loadMaterialsForCategory(null);
      } else {
        // Farklı kategoriye tıklandıysa, güncelle
        console.log("⭐ Kategori değişiyor:", value);
        setPendingFilters(prev => ({...prev, category: value, material: null}));
        
        // Hemen yeni kategoriye ait malzemeleri yükle
        if (value) {
          console.log("⭐ Yeni kategori seçildi, malzemeler yükleniyor:", value);
          loadMaterialsForCategory(value)
            .then(() => {
              console.log("⭐ Kategori değişikliği sonrası malzemeler yüklendi");
            })
            .catch(error => {
              console.error("⭐ Kategori değişikliğinde malzeme yükleme hatası:", error);
            });
        } else {
          loadMaterialsForCategory(null);
        }
      }
    } else {
      // Diğer filtreler için normal işlem
      setPendingFilters(prev => {
        // Eğer aynı değere tıklandıysa, o değeri kaldır
        if (prev[key] === value) {
          return {...prev, [key]: null};
        }
        
        // Değer değiştiyse, güncelle
        return {...prev, [key]: value};
      });
    }
  }

  // Filtreleri uygula ve URL güncelle
  const applyAllFilters = () => {
    try {
      console.log("Filtreler uygulanıyor", pendingFilters);
      
      // Aktif filtreleri güncelle
      setActiveFilters(pendingFilters);
      
      // Sıralama değerini güncelle
      setSortBy(pendingSortBy);
      
      // Eski seçimleri temizle
      if (pendingFilters.category !== activeFilters.category) {
        console.log("Kategori değişti, malzeme seçimini sıfırlıyorum");
        setPendingFilters(prev => ({...prev, material: null}));
      }
      
      // Yeni filtreler oluştur
      const newFilters = { ...pendingFilters };
      if (pendingFilters.category !== activeFilters.category) {
        newFilters.material = null;
      }
      
      // URL'yi güncelle - sortBy parametresini doğrudan gönderiyoruz
      updateUrl(newFilters);
      
      // Sayfa 1'e dön
      setCurrentPage(1);
      
      // İlanları getir (alternatif terimlerle ve doğru sıralama ile)
      fetchListings(1, newFilters);
      
      // Kategori seçiliyse onunla ilgili malzeme tiplerini getir
      if (pendingFilters.category) {
        console.log("Kategori ID'ye göre malzemeleri getir:", pendingFilters.category);
        loadMaterialsForCategory(pendingFilters.category)
          .then(() => {
            console.log("Kategori için malzemeler başarıyla yüklendi");
          })
          .catch((error) => {
            console.error("Malzeme tipleri getirilirken hata:", error);
          });
      } else {
        // Kategori seçili değilse tüm malzemeleri getir
        console.log("Tüm malzemeleri getir");
        loadMaterialsForCategory(null)
          .then(() => {
            console.log("Tüm malzemeler başarıyla yüklendi");
          })
          .catch((error) => {
            console.error("Tüm malzemeler getirilirken hata:", error);
          });
      }
      
      console.log("Filtreler başarıyla uygulandı!");
      
    } catch (error) {
      console.error("Filtreler uygulanırken bir hata oluştu:", error);
    }
  };

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
    
    // URL'i temizle
    router.push(window.location.pathname)
    
    // İlk sayfadan başla
    setCurrentPage(1)
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

  // Sayfalama bileşeni
  const Pagination = () => {
    if (totalPages <= 1) return null; // Tek sayfa varsa sayfalama gösterme
    
    // Gösterilecek sayfa numaralarını hesapla
    const pageNumbers = [];
    const maxPageButtons = 5; // Gösterilecek maksimum sayfa butonu sayısı
    
    // Sayfa butonlarını oluştur
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Eğer sondan başlıyorsak ayarla
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Son sayfa gösterimini hesapla
    const lastItemOnPage = Math.min(currentPage * itemsPerPage, totalItems);
    const firstItemOnPage = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    
    return (
      <div className="mt-10 flex flex-col items-center space-y-4">
        <div className="text-sm text-gray-500">
          {totalItems > 0 ? (
            `Toplam ${totalItems} ilan içerisinden ${firstItemOnPage} - ${lastItemOnPage} arası gösteriliyor`
          ) : (
            `Hiç ilan bulunamadı`
          )}
        </div>
        
        <nav className="flex items-center space-x-1">
          {/* İlk Sayfa */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="İlk Sayfa"
            title="İlk Sayfa"
          >
            <span className="sr-only">İlk Sayfa</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Önceki Sayfa */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Önceki Sayfa"
            title="Önceki Sayfa"
          >
            <span className="sr-only">Önceki</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Sayfa Numaraları */}
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-4 py-2 rounded-md ${
                currentPage === number
                  ? 'bg-green-600 text-white font-medium shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-current={currentPage === number ? 'page' : undefined}
              aria-label={`Sayfa ${number}`}
            >
              {number}
            </button>
          ))}
          
          {/* Sonraki Sayfa */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Sonraki Sayfa"
            title="Sonraki Sayfa"
          >
            <span className="sr-only">Sonraki</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Son Sayfa */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-md ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Son Sayfa"
            title="Son Sayfa"
          >
            <span className="sr-only">Son Sayfa</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      </div>
    );
  };

  // URL'yi filtre parametreleriyle güncelle
  const updateUrl = (filters: {
    category?: string | null;
    material?: string | null;
    condition?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    search?: string | null;
    location?: string | null;
  }) => {
    const params = new URLSearchParams();
    
    // Parametreleri ekle
    if (filters.category) params.append('category', filters.category);
    if (filters.material) params.append('material', filters.material);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    
    // Sıralama parametresi - pendingSortBy değerini kullan çünkü bu değer kullanıcının güncel olarak seçtiği değer
    if (pendingSortBy !== 'newest') params.append('sortBy', pendingSortBy);
    
    // URL'yi güncelle
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    console.log("URL güncellendi:", newUrl);
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

                {/* Kategori */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Kategori</h3>
                  <SearchableDropdown 
                    options={filteredCategories}
                    value={pendingFilters.category}
                    onChange={(value) => handleFilter('category', value)}
                    placeholder="Tüm Kategoriler"
                    searchPlaceholder="Kategori ara..."
                    onOpen={() => {
                      console.log("📂 Kategori dropdown'u açıldı");
                      // Force update yaparak kategori değişiminden bağımsız olarak malzeme yüklemesini tetikle
                      setForceUpdate(prev => prev + 1);
                    }}
                  />
                </div>

                {/* Malzeme Tipleri */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Malzeme Tipi</h3>
                  {/* ÖNEMLİ: Aktif filtrelendikten sonra malzemeyi güncellemeye çalıştığımızda doğru seçenekleri göstermiyor olabilir */}
                  {/* Arayüz render edildiğinde aktif kategori için malzeme tiplerini göstermesini zorlayacağız */}
                  <button
                    onClick={() => {
                      // Görüntülenen malzemeleri yeniden yükle
                      console.log("🔄 Malzeme tiplerini yenileme tıklandı");
                      const categoryId = activeFilters.category || pendingFilters.category;
                      if (categoryId) {
                        console.log("🔄 Kategori ID:", categoryId);
                        loadMaterialsForCategory(categoryId);
                      }
                    }}
                    className="absolute right-6 top-[100px] z-10 text-green-600 hover:text-green-700 transition-colors"
                    title="Malzeme listesini güncelle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <SearchableDropdown 
                    options={filteredMaterialTypes}
                    value={pendingFilters.material}
                    onChange={(value) => handleFilter('material', value)}
                    placeholder="Tüm Malzemeler"
                    searchPlaceholder="Malzeme ara..."
                    onOpen={() => {
                      console.log("📂 Malzeme dropdown'u açıldı");
                      // Dropdown açıldığında kategoriye göre malzemeleri yenile
                      // pendingFilters'da seçili kategori her zaman doğrudur, activeFilters değiştirilmiş olabilir
                      const categoryId = pendingFilters.category;
                      if (categoryId) {
                        console.log("📂 Dropdown açıldığında malzemeler yenileniyor. Kategori:", categoryId);
                        loadMaterialsForCategory(categoryId);
                      } else {
                        // Kategori seçili değilse tüm malzemeleri getir
                        loadMaterialsForCategory(null);
                      }
                    }}
                  />
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

                {/* Filtre Altı Butonlar */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    onClick={applyAllFilters}
                    className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all flex justify-center items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Filtreleri Uygula
                  </button>
                  
                  {(pendingFilters.category || pendingFilters.material || pendingFilters.condition || pendingFilters.minPrice || pendingFilters.maxPrice || pendingFilters.location || pendingFilters.search) && (
                    <button
                      onClick={clearFilters}
                      className="w-full sm:w-auto text-red-600 font-medium py-2 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex justify-center items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* İlan Listesi - Yeniden Tasarlanmış */}
          <div className="flex-1">
            {/* Üst Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  <span className="text-green-600 font-bold">{totalItems}</span> İlan Bulundu
                </h1>
                <div className="flex flex-wrap items-center gap-2">
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
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
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
                  
                  {pendingSortBy !== sortBy && (
                    <button
                      onClick={applyAllFilters}
                      className="inline-flex items-center justify-center p-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      title="Sıralamayı Uygula"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
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

            {/* İlan Listesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

            {/* Sayfalama */}
            {!loading && listings.length > 0 && <Pagination />}

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
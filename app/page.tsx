'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

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

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)

  // İlanları yükle
  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        setLoadingListings(true)
        // Öne çıkan ilanlar için sorgu parametreleri
        const params = new URLSearchParams()
        params.append('page', '1')
        params.append('sortBy', 'newest')
        params.append('limit', '3') // Sadece 3 ilan göster
        
        const response = await fetch(`/api/listings?${params.toString()}`)
        const data = await response.json()
        
        if (data.success) {
          setFeaturedListings(data.data.items)
        }
      } catch (error) {
        console.error('Öne çıkan ilanlar yüklenirken hata:', error)
      } finally {
        setLoadingListings(false)
      }
    }
    
    fetchFeaturedListings()
  }, [])

  const handleSearch = (value: string) => {
    if (value) {
      router.push(`/listings?search=${encodeURIComponent(value)}`)
    }
  }

  // Başlık için animasyon varyantları
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3
      }
    }
  }

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

  const firstLineVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const secondLineVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/hero-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Hafif koyu overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="mb-8 text-white drop-shadow-2xl"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.span 
                className="block text-3xl sm:text-4xl md:text-5xl font-light mb-2"
                variants={firstLineVariants}
              >
                Stok Fazlası
              </motion.span>
              <motion.span 
                className="block text-4xl sm:text-5xl md:text-7xl font-extrabold mb-8"
                variants={secondLineVariants}
              >
                Ham Madde Pazarı
              </motion.span>
            </motion.h1>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8 text-white">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Link 
                  href="#" 
                  className="mx-6 text-xl font-medium relative group"
                >
                  <span className="group-hover:text-green-400 transition-colors duration-300">Hepsi</span>
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <Link 
                  href="/listings/create" 
                  className="mx-6 text-xl font-medium relative group"
                >
                  <span className="group-hover:text-green-400 transition-colors duration-300">İkinci El</span>
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <Link 
                  href="#" 
                  className="mx-6 text-xl font-medium relative group"
                >
                  <span className="group-hover:text-green-400 transition-colors duration-300">Sıfır</span>
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              </motion.div>
            </div>

            {/* Search Form */}
            <motion.div 
              className="max-w-5xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="flex flex-wrap md:flex-nowrap bg-white p-2 rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-full md:w-1/3 p-2">
                  <div className="relative">
                    <select className="w-full py-3 px-4 bg-white border-0 text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md transition-all duration-300 hover:bg-green-50">
                      <option value="">Ürün Kategorisi</option>
                      <option value="metal">Metal</option>
                      <option value="ahsap">Ahşap</option>
                      <option value="plastik">Plastik</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 5L6 9L10 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/3 p-2">
                  <div className="relative">
                    <select className="w-full py-3 px-4 bg-white border-0 text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md transition-all duration-300 hover:bg-green-50">
                      <option value="">Malzeme Tipi</option>
                      <option value="celik">Çelik</option>
                      <option value="aluminyum">Alüminyum</option>
                      <option value="cam">Cam</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 5L6 9L10 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/3 p-2">
                  <div className="relative">
                    <select className="w-full py-3 px-4 bg-white border-0 text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md transition-all duration-300 hover:bg-green-50">
                      <option value="">Fiyat</option>
                      <option value="0-1000">0 - 1000 TL</option>
                      <option value="1000-5000">1000 - 5000 TL</option>
                      <option value="5000+">5000+ TL</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 5L6 9L10 5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto p-2">
                  <motion.button 
                    className="w-full h-full bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-md transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Icon Features */}
            <motion.div
              className="flex justify-center gap-20 text-white mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              <Link href="#" className="text-center group">
                <motion.div 
                  className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 group-hover:bg-white/40 transition-all duration-300 transform group-hover:scale-110"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-11 h-11 group-hover:text-green-400 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </motion.div>
                <motion.p 
                  className="text-lg font-medium group-hover:text-green-400 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  Sıfır
                </motion.p>
              </Link>
              
              <Link href="#" className="text-center group">
                <motion.div 
                  className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 group-hover:bg-white/40 transition-all duration-300 transform group-hover:scale-110"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-10 h-10 group-hover:text-green-400 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </motion.div>
                <motion.p 
                  className="text-lg font-medium group-hover:text-green-400 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  İkinci El
                </motion.p>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Neden Stofhamp?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Sürdürülebilir Çözüm</h3>
              <p className="text-gray-600 leading-relaxed">
                Projelerde ihtiyaç fazlası kalan hammadde ve malzemelerinizi zarar etmeden değerlendirin. İhtiyaç sahipleriyle buluşarak stok fazlası ürünlerinizi kolayca satın.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Sanayi Odaklı Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Uygulama yazılımımız, sanayi firmalarının özel ihtiyaçlarına göre tasarlandı. Hem alıcı hem de satıcılar için güvenilir ve kolay bir kullanıcı deneyimi sunuyoruz.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Kaynak Verimliliği</h3>
              <p className="text-gray-600 leading-relaxed">
                Stok Fazlası Ham Madde Pazarı ile elinizdeki fazlalıkları değerlendirirken başka firmaların ihtiyaçlarını karşılayın. Çevreye katkı sağlayarak ekonomik döngüye katılın!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Öne Çıkan İlanlar
              </h2>
              <div className="w-20 h-1.5 bg-green-500 rounded-full"></div>
            </div>
            <Link 
              href="/listings" 
              className="mt-4 sm:mt-0 text-green-600 hover:text-green-700 font-medium flex items-center transition-colors group"
            >
              <span className="mr-2 group-hover:underline">Tümünü Gör</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          {loadingListings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-4 h-96">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredListings.map((listing) => (
                <motion.div 
                  key={listing.id}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform"
                >
                  <Link href={`/listings/${listing.id}`} className="block h-full relative">
                    <div className="relative h-56 overflow-hidden">
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full z-10 shadow-sm">
                        {listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                      </div>
                      <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md z-10 hover:bg-red-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        {listing.images && listing.images.length > 0 ? (
                          <Image 
                            src={listing.images[0]} 
                            alt={listing.title} 
                            width={500} 
                            height={300} 
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                          {listing.category?.name || 'Diğer'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(listing.createdAt)}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900 line-clamp-1 hover:text-green-700 transition-colors">{listing.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                        {listing.description}
                      </p>
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xl font-bold text-green-700">{listing.price.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {listing.location}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Henüz İlan Bulunamadı</h3>
              <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">Platformda henüz ilan yok. İlk ilanı oluşturarak başlayabilirsiniz.</p>
              <Link 
                href="/listings/create" 
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors text-base font-medium shadow-sm hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk İlanı Oluştur
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
              Hemen Başlayın
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Stok fazlası ham maddelerinizi değerlendirmek veya ihtiyacınız olan malzemeleri uygun fiyata bulmak için hemen üye olun.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!session ? (
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-base sm:text-lg text-center"
                >
                  Ücretsiz Üye Ol
                </Link>
              ) : (
                <Link
                  href="/listings/create"
                  className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-base sm:text-lg text-center"
                >
                  İlan Ver
                </Link>
              )}
              <Link
                href="/listings"
                className="w-full sm:w-auto bg-white text-green-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors border-2 border-green-600 text-base sm:text-lg text-center"
              >
                İlanları Görüntüle
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
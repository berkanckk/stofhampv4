'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { use } from 'react'

interface Seller {
  id: string
  name: string
  company: string | null
  email: string
  phone: string | null
  profileImage: string | null
}

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

interface ListingData {
  title: string
  id: string
  createdAt: Date
  updatedAt: Date
  description: string
  price: number
  condition: 'NEW' | 'USED'
  expiresAt: Date | null
  categoryId: string
  materialId: string
  images: string[]
  location: string
  sellerId: string
  seller: {
    id: string
    name: string
    email: string
    company: string | null
    profileImage: string | null
    phone: string | null
  }
  category: {
    id: string
    name: string
    description: string | null
  }
  material: {
    id: string
    name: string
    description: string | null
  }
  _count?: {
    favorites: number
  }
}

interface PageProps {
  params: { id: string }
}

export default function ListingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Resim navigasyon fonksiyonları
  const nextImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
    }
  }

  const previousImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
    }
  }

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${params.id}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setListing(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İlan yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchListing()
    }
  }, [params.id])

  useEffect(() => {
    if (session?.user?.id && listing?.id) {
      // İlanın favori durumunu kontrol et
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/listings/${listing.id}/favorite`)
          const data = await response.json()
          setIsFavorite(data.success)
        } catch (error) {
          console.error('Check favorite error:', error)
        }
      }

      checkFavorite()
    }
  }, [session?.user?.id, listing?.id])

  const handleFavorite = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/listings/${listing?.id}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setIsFavorite(!isFavorite)
      }
    } catch (error) {
      console.error('Favorite error:', error)
    }
  }

  // İlan durumu için renk ve metin belirleme fonksiyonu
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'bg-green-100 text-green-800', text: 'Aktif' }
      case 'SOLD':
        return { color: 'bg-blue-100 text-blue-800', text: 'Satıldı' }
      case 'RESERVED':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Rezerve' }
      case 'EXPIRED':
        return { color: 'bg-red-100 text-red-800', text: 'Süresi Doldu' }
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Pasif' }
    }
  }

  // Kalan süreyi hesaplama fonksiyonu
  const getRemainingTime = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? `${diffDays} gün` : 'Süresi doldu'
  }

  // Paylaşım fonksiyonlarını ekleyelim
  const handleShare = async (platform: string) => {
    const currentUrl = window.location.href
    const title = listing?.title || 'İlan Detayı'
    const description = listing?.description || ''
    const price = listing?.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    const shareText = `${title} - ${price}\n\n${description}`

    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${currentUrl}`)}`)
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`)
        break
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`)
        break
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${currentUrl}`)}`
        break
      case 'copy':
        try {
          await navigator.clipboard.writeText(currentUrl)
          // Burada bir toast notification gösterilebilir
          alert('Bağlantı kopyalandı!')
        } catch (err) {
          console.error('Bağlantı kopyalanırken hata oluştu:', err)
        }
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-600">İlan bulunamadı</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Gezinti ve Başlık */}
        <div className="mb-6">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Anasayfa
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link href="/listings" className="ml-1 text-sm font-medium text-gray-700 hover:text-green-600 md:ml-2">
                    İlanlar
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 line-clamp-1">{listing.title}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Ana İçerik */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sol Taraf - Resim Galerisi ve Açıklama */}
          <div className="lg:col-span-3 space-y-6">
            {/* Resim Galerisi */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-100">
                {listing.images && listing.images.length > 0 ? (
                  <Image
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    fill
                    className="object-contain transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Durum Etiketi */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full backdrop-blur-md ${
                    listing.condition === 'NEW'
                      ? 'bg-green-500/90 text-white'
                      : 'bg-amber-500/90 text-white'
                  }`}>
                    {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                  </span>
                </div>

                {/* Resim Navigasyon Okları */}
                {listing.images && listing.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 text-gray-800 shadow-md hover:bg-white/95 transition-all duration-300 transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 text-gray-800 shadow-md hover:bg-white/95 transition-all duration-300 transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Resim Sayacı */}
                {listing.images && listing.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white rounded-full text-sm backdrop-blur-md">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                )}

                {/* Paylaşım Butonları */}
                <div className="absolute right-4 top-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                    title="WhatsApp'ta Paylaş"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.967 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                    title="Telegram'da Paylaş"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                    title="Facebook'ta Paylaş"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-purple-600 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                    title="Bağlantıyı Kopyala"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Küçük Resimler Galerisi */}
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
                        currentImageIndex === index ? 'border-green-500' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${listing.title} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Açıklama ve Detaylar */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ürün Açıklaması
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>
            </div>

            {/* Özellikler */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Ürün Özellikleri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Kategori</p>
                      <p className="font-medium text-gray-900">{listing.category.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Durum</p>
                      <p className="font-medium text-gray-900">
                        {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Konum</p>
                      <p className="font-medium text-gray-900">{listing.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Malzeme</p>
                      <p className="font-medium text-gray-900">{listing.material.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Fiyat, Satıcı Bilgileri ve İletişim */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fiyat ve İşlemler */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 line-clamp-2">{listing.title}</h1>
                <button
                  onClick={handleFavorite}
                  className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                    isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white'
                  }`}
                  title={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" stroke={isFavorite ? 'none' : 'currentColor'} strokeWidth={isFavorite ? 0 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {listing.price.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  })}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>İlan Tarihi: {format(new Date(listing.createdAt), 'd MMMM yyyy', { locale: tr })}</span>
                </div>
              </div>

              {/* İletişim Butonu */}
              {session?.user?.id !== listing.sellerId && (
                <button
                  onClick={async () => {
                    if (!session) {
                      router.push('/login')
                      return
                    }
                    try {
                      const response = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          sellerId: listing.sellerId,
                          listingId: listing.id,
                        }),
                      })
                      const data = await response.json()
                      if (data.success) {
                        router.push(`/messages/${data.data.id}`)
                      } else {
                        throw new Error(data.message)
                      }
                    } catch (error) {
                      console.error('Start conversation error:', error)
                      alert('Sohbet başlatılırken bir hata oluştu')
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl py-4 font-medium hover:from-green-700 hover:to-green-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Satıcı ile İletişime Geç</span>
                </button>
              )}
            </div>

            {/* Satıcı Profili */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Satıcı Bilgileri
              </h2>
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {listing.seller.profileImage ? (
                    <Image
                      src={listing.seller.profileImage}
                      alt={listing.seller.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-xl font-semibold">
                      {listing.seller.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{listing.seller.name}</h3>
                  {listing.seller.company && (
                    <p className="text-sm text-gray-600">{listing.seller.company}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {listing.seller.phone && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-gray-600">{listing.seller.phone}</p>
                  </div>
                )}
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">{listing.seller.email}</p>
                </div>
              </div>
            </div>
            
            {/* Benzer İlanlar veya İpuçları */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Güvenli Alışveriş İpuçları
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Satıcı ile yüz yüze görüşmeyi tercih edin
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ürünü görmeden para göndermeyin
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Herhangi bir şüphe durumunda işlemi gerçekleştirmeyin
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
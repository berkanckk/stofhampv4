'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

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
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [listing, setListing] = useState<ListingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

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
        const resolvedParams = await params
        const response = await fetch(`/api/listings/${resolvedParams.id}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setListing(result.data)
      } catch (error) {
        setError('İlan yüklenirken bir hata oluştu')
        console.error('Fetch listing error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [params])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Ana İçerik */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="lg:flex">
            {/* Sol Panel - Resim Galerisi */}
            <div className="lg:w-2/3 relative">
              <div className="relative aspect-[4/3] bg-gray-100">
                {listing.images && listing.images.length > 0 ? (
                  <Image
                    src={listing.images[currentImageIndex]}
                    alt={listing.title}
                    fill
                    className="object-cover transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Resim Navigasyon Okları */}
                {listing.images && listing.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-all duration-300 transform hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-all duration-300 transform hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Resim Sayacı */}
                {listing.images && listing.images.length > 0 && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 text-white rounded-full text-sm backdrop-blur-sm">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                )}

                {/* Paylaşım Butonları */}
                <div className="absolute left-4 top-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg group"
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
                    onClick={() => handleShare('twitter')}
                    className="p-2.5 bg-white/90 rounded-full hover:bg-blue-400 hover:text-white transition-all duration-300 transform hover:scale-110 shadow-lg"
                    title="Twitter'da Paylaş"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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

              {/* Küçük Resimler */}
              {listing.images && listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                        currentImageIndex === index ? 'ring-2 ring-green-500' : ''
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

            {/* Sağ Panel - İlan Detayları */}
            <div className="lg:w-1/3 p-6 lg:p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                <button
                  onClick={handleFavorite}
                  className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                    isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                  title={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6 flex-grow">
                {/* Fiyat ve Tarih */}
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {listing.price.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    })}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {format(new Date(listing.createdAt), 'd MMMM yyyy', { locale: tr })}
                  </div>
                </div>

                {/* Özellikler Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Durum</span>
                      <p className="font-medium text-gray-900">
                        {listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Kategori</span>
                      <p className="font-medium text-gray-900">{listing.category.name}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Malzeme</span>
                      <p className="font-medium text-gray-900">{listing.material.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Konum</span>
                      <p className="font-medium text-gray-900">{listing.location}</p>
                    </div>
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Açıklama</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                </div>

                {/* Satıcı Bilgileri */}
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Satıcı Bilgileri</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12">
                      {listing.seller.profileImage ? (
                        <Image
                          src={listing.seller.profileImage}
                          alt={listing.seller.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{listing.seller.name}</h3>
                      {listing.seller.company && (
                        <p className="text-sm text-gray-500">{listing.seller.company}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* İletişim Butonu */}
              {session?.user?.id !== listing.sellerId && (
                <div className="mt-6">
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
                    className="w-full bg-green-600 text-white rounded-xl py-4 font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Satıcı ile İletişime Geç</span>
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
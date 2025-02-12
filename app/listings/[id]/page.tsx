'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

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

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [sendingMessage, setSendingMessage] = useState(false)

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
        setError(err instanceof Error ? err.message : 'İlan detayları alınırken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [params.id])

  const nextImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
    }
  }

  const previousImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
    }
  }

  const goToImage = (index: number) => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex(index)
    }
  }

  const handleMessageSeller = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user?.id === listing?.seller.id) {
      alert('Kendi ilanınıza mesaj gönderemezsiniz')
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: listing?.seller.id,
          listingId: listing?.id,
          message: `Merhaba, ${listing?.title} başlıklı ilanınız hakkında bilgi almak istiyorum.`,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      router.push(`/messages/${result.data.id}`)
    } catch (error) {
      console.error('Send message error:', error)
      alert('Mesaj gönderilirken bir hata oluştu')
    } finally {
      setSendingMessage(false)
    }
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

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded inline-block">
              {error || 'İlan bulunamadı'}
            </div>
            <div className="mt-4">
              <Link
                href="/listings"
                className="text-green-600 hover:text-green-700"
              >
                İlanlar sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex mb-8 text-sm">
            <Link href="/listings" className="text-gray-500 hover:text-gray-700">
              İlanlar
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{listing.title}</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Sol Taraf - Resim Galerisi */}
              <div className="space-y-4">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ paddingTop: '75%' }}>
                  {listing.images.length > 0 ? (
                    <div className="absolute inset-0">
                      <div 
                        className="flex transition-transform duration-500 h-full"
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                      >
                        {listing.images.map((image, index) => (
                          <div key={index} className="w-full h-full flex-shrink-0 relative">
                            <Image
                              src={image}
                              alt={`${listing.title} - Resim ${index + 1}`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={index === 0}
                            />
                          </div>
                        ))}
                      </div>
                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={previousImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all z-10"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-all z-10"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                {listing.images.length > 1 && (
                  <div className="flex justify-center space-x-2">
                    {listing.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-green-600 scale-110' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sağ Taraf - İlan Detayları */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
                  <div className="flex items-center space-x-4 text-lg">
                    <span className="font-semibold text-2xl text-green-600">
                      {listing.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      listing.condition === 'NEW' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">İlan Detayları</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Kategori</p>
                      <p className="font-medium text-gray-900">{listing.category.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Malzeme Tipi</p>
                      <p className="font-medium text-gray-900">{listing.material.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Konum</p>
                      <p className="font-medium text-gray-900">{listing.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">İlan Tarihi</p>
                      <p className="font-medium text-gray-900">
                        {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Satıcı Bilgileri</h2>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {listing.seller.profileImage ? (
                        <Image
                          src={listing.seller.profileImage}
                          alt={listing.seller.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-xl">
                            {listing.seller.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{listing.seller.name}</p>
                      {listing.seller.company && (
                        <p className="text-sm text-gray-500">{listing.seller.company}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleMessageSeller}
                    disabled={sendingMessage || session?.user?.id === listing.seller.id}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Mesaj Gönderiliyor...' : 'Satıcıya Mesaj Gönder'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Geri Dön Butonu */}
          <div className="mt-8">
            <Link
              href="/listings"
              className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              İlanlar sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
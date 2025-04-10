'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

interface MaterialType {
  id: string
  name: string
}

interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: 'NEW' | 'USED'
  expiresAt: string | null
  images: string[]
  location: string
  category: Category
  material: MaterialType
  createdAt: string
  _count: {
    favorites: number
  }
}

export default function MyListingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings/my')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setListings(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İlanlarınız alınırken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchListings()
    }
  }, [session])

  // Oturum kontrolü
  if (status === 'loading' || loading) {
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

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
      return
    }

    setDeleteLoading(listingId)
    setError(null)

    try {
      const response = await fetch(`/api/listings/my?id=${listingId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      setListings(prev => prev.filter(listing => listing.id !== listingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İlan silinirken bir hata oluştu')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        // İlan listesini güncelle
        setListings(listings.map(listing =>
          listing.id === listingId
            ? { ...listing, status: newStatus as any }
            : listing
        ))
      }
    } catch (error) {
      console.error('Update status error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Üst Başlık Alanı */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">İlanlarım</h1>
                <p className="text-gray-500 mt-1 text-sm">Yayınladığınız tüm ilanları buradan yönetebilirsiniz</p>
              </div>
              <Link
                href="/listings/create"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Yeni İlan Ekle
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {listings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz İlanınız Bulunmuyor</h3>
              <p className="text-gray-500 text-sm mb-4">İlk ilanınızı oluşturarak alıcılarla buluşun</p>
              <Link
                href="/listings/create"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                İlk İlanınızı Oluşturun
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* İlan Resmi */}
                  <Link href={`/listings/${listing.id}`} className="block relative">
                    <div className="relative w-full pt-[75%] bg-gray-100 group">
                      {listing.images.length > 0 ? (
                        <div className="absolute inset-0">
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                            className="object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {listing.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
                              +{listing.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* İlan Bilgileri */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/listings/${listing.id}`}>
                        <h3 className="text-base font-semibold text-gray-900 hover:text-green-600 transition-colors duration-300 line-clamp-1">
                          {listing.title}
                        </h3>
                      </Link>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        listing.condition === 'NEW' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {listing.category.name}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {listing.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </span>
                      <div className="flex space-x-1">
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deleteLoading === listing.id}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-300"
                          title="Sil"
                        >
                          {deleteLoading === listing.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
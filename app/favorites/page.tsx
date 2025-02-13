'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: 'NEW' | 'USED'
  images: string[]
  location: string
  category: {
    name: string
  }
  material: {
    name: string
  }
  createdAt: string
}

interface Favorite {
  id: string
  listing: Listing
  createdAt: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch('/api/favorites')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setFavorites(result.data)
        const initialImageIndexes: { [key: string]: number } = {}
        result.data.forEach((favorite: Favorite) => {
          initialImageIndexes[favorite.listing.id] = 0
        })
        setCurrentImageIndexes(initialImageIndexes)
      } catch (error) {
        setError('Favoriler yüklenirken bir hata oluştu')
        console.error('Fetch favorites error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchFavorites()
    }
  }, [session])

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}/favorite`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setFavorites(favorites.filter(fav => fav.listing.id !== listingId))
      }
    } catch (error) {
      console.error('Remove favorite error:', error)
    }
  }

  const nextImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [listingId]: (prev[listingId] + 1) % totalImages
    }))
  }

  const previousImage = (listingId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [listingId]: (prev[listingId] - 1 + totalImages) % totalImages
    }))
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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Favorilerim</h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Henüz favori ilanınız bulunmuyor.</p>
            <Link
              href="/listings"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              İlanları Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[4/3]">
                  <Link href={`/listings/${favorite.listing.id}`}>
                    <Image
                      src={favorite.listing.images[currentImageIndexes[favorite.listing.id]]}
                      alt={favorite.listing.title}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {favorite.listing.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          previousImage(favorite.listing.id, favorite.listing.images.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          nextImage(favorite.listing.id, favorite.listing.images.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleRemoveFavorite(favorite.listing.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>

                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                      favorite.listing.condition === 'NEW' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {favorite.listing.condition === 'NEW' ? 'Yeni' : 'Kullanılmış'}
                    </span>
                  </div>
                </div>

                <Link href={`/listings/${favorite.listing.id}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-600">
                        {favorite.listing.price.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(favorite.listing.createdAt), 'd MMMM yyyy', {
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {favorite.listing.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {favorite.listing.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {favorite.listing.category.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {favorite.listing.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {favorite.listing.material.name}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
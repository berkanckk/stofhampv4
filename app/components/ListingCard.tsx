'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState } from 'react'

// İlan türü için arayüz tanımı
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

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
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

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (listing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform group"
    >
      <Link href={`/listings/${listing.id}`} className="block h-full relative">
        <div className="relative h-56 overflow-hidden">
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${listing.condition === 'NEW' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {listing.condition === 'NEW' ? 'Sıfır' : 'İkinci El'}
            </span>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm hover:bg-red-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 group-hover:opacity-70 transition-opacity"></div>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            {listing.images && listing.images.length > 0 ? (
              <Image 
                src={listing.images[currentImageIndex]} 
                alt={listing.title} 
                width={500} 
                height={300} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {listing.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className="px-2 py-1 rounded-full bg-black/40 text-white text-xs">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="inline-flex items-center text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full shadow-sm">
              {listing.category?.name || 'Diğer'}
            </span>
            <span className="text-xs text-gray-500 font-medium">{formatDate(listing.createdAt)}</span>
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors">{listing.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
            {listing.description}
          </p>
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xl font-bold text-green-700">{listing.price.toLocaleString('tr-TR')} ₺</span>
            <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full flex items-center shadow-sm">
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
  )
} 
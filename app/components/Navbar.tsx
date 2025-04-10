'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [unreadCount, setUnreadCount] = useState(0)

  // Scroll durumunu takip et
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mobil menüyü kapatmak için
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Okunmamış mesaj sayısını getir ve düzenli olarak güncelle
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch('/api/messages/unread-count', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const data = await response.json()
        
        if (data.success) {
          setUnreadCount(data.count)
        }
      } catch (error) {
        console.error('Unread messages count error:', error)
      }
    }
    
    // İlk yüklemede çalıştır
    fetchUnreadCount()
    
    // Her 15 saniyede bir güncelle
    const intervalId = setInterval(fetchUnreadCount, 15000)
    
    return () => clearInterval(intervalId)
  }, [session?.user?.id])

  return (
    <nav 
      className={`${isHomePage ? (scrolled ? 'fixed bg-black/80 shadow-lg' : 'absolute bg-transparent') : 'fixed bg-white border-b'} 
                top-0 left-0 right-0 z-50 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-0"
            >
              <div className="relative h-16 w-44 -mr-10">
                <Image 
                  src="/stof.png" 
                  alt="Stofhamp Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
              <span className={`text-xl font-bold ${isHomePage ? 'text-white' : 'text-gray-800'} hidden sm:block`}>
                Stofhamp
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link 
              href="/listings"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors`}
            >
              İlanlar
            </Link>
            <Link 
              href="/about"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors`}
            >
              Hakkımızda
            </Link>
            <Link 
              href="/contact"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors`}
            >
              İletişim
            </Link>
            <Link
              href="/messages"
              className={`text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors ${pathname.startsWith('/messages') ? 'text-green-600 bg-green-100' : isHomePage ? 'text-white' : 'text-gray-700'}`}
            >
              <div className="relative flex items-center">
                <span>Mesajlar</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-6 flex h-5 w-5">
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  </span>
                )}
              </div>
            </Link>

            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/listings/create"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  İlan Ver
                </Link>
                <div className="relative group">
                  <button
                    className={`flex items-center ${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 transition-colors`}
                  >
                    <span className="text-sm font-medium mr-2">Hesabım</span>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profilim
                    </Link>
                    <Link
                      href="/my-listings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      İlanlarım
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Favorilerim
                    </Link>
                    <Link
                      href="/messages"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="relative flex items-center">
                        <span>Mesajlarım</span>
                        {unreadCount > 0 && (
                          <span className="ml-2 inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors`}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${isHomePage ? 'text-white hover:text-gray-300 hover:bg-gray-800/30' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="sr-only">Menüyü aç</span>
              {isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} ${isHomePage ? 'bg-black/80 backdrop-blur-sm' : 'bg-white border-b'}`}>
        <div className={`px-2 pt-2 pb-3 space-y-1 ${isHomePage ? '' : 'bg-white'}`}>
          <Link
            href="/listings"
            className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
          >
            İlanlar
          </Link>
          <Link
            href="/about"
            className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
          >
            Hakkımızda
          </Link>
          <Link
            href="/contact"
            className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
          >
            İletişim
          </Link>

          {session ? (
            <>
              <Link
                href="/listings/create"
                className="block px-3 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                İlan Ver
              </Link>
              <Link
                href="/profile"
                className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
              >
                Profilim
              </Link>
              <Link
                href="/my-listings"
                className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
              >
                İlanlarım
              </Link>
              <Link
                href="/favorites"
                className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
              >
                Favorilerim
              </Link>
              <Link
                href="/messages"
                className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
              >
                <div className="relative flex items-center">
                  <span>Mesajlarım</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={() => signOut()}
                className={`block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 ${isHomePage ? 'hover:bg-white/10' : 'hover:bg-gray-50'} rounded-md`}
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`block px-3 py-2 text-base font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'} rounded-md`}
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 
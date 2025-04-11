'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

// Kullanıcı tipi tanımlaması
interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  company: string | null;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Kullanıcı profil bilgilerini getir
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/profile');
        const result = await response.json();
        
        if (result.success) {
          setUserProfile(result.data);
        }
      } catch (error) {
        console.error('Profil bilgileri alınamadı:', error);
      }
    };
    
    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Sayfa değiştiğinde mobil menüyü kapat
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
          {/* Mobil: Sol Kenar Menü Düğmesi */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-full ${isHomePage ? 'text-white hover:text-gray-300 hover:bg-gray-800/30' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'} relative`}
              aria-label="Ana menüyü aç"
            >
              {session ? (
                <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-green-500 bg-green-100 flex items-center justify-center">
                  {userProfile?.profileImage ? (
                    <Image 
                      src={userProfile.profileImage} 
                      alt={userProfile.name || "Kullanıcı"} 
                      width={32} 
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-green-600 font-semibold text-sm">
                      {userProfile?.name ? userProfile.name[0].toUpperCase() : "S"}
                    </span>
                  )}
                </div>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Logo - Mobilde ortada */}
          <div className="flex-1 flex items-center justify-center md:justify-start">
            <div className="mx-auto md:mx-0">
              <Link 
                href="/" 
                className="flex items-center"
              >
                <div className="relative h-12 w-12 md:h-16 md:w-44">
                  <Image 
                    src="/stof.png" 
                    alt="Stofhamp Logo" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
                <span className={`text-xl font-bold ${isHomePage ? 'text-white' : 'text-gray-800'} hidden md:block`}>
                  Stofhamp
                </span>
              </Link>
            </div>
          </div>

          {/* Mobil: Hızlı Erişim Sekmeleri */}
          <div className="flex items-center space-x-1 md:hidden">
            {session ? (
              <>
                <Link 
                  href="/messages" 
                  className={`p-2 rounded-full ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} relative`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </Link>
                <Link 
                  href="/favorites" 
                  className={`p-2 rounded-full ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`p-2 rounded-md text-sm font-medium ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Giriş
                </Link>
                <Link 
                  href="/register" 
                  className="p-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                >
                  Kayıt
                </Link>
              </>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-10">
            <Link 
              href="/listings"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-4 py-2.5 text-base font-medium transition-colors`}
            >
              İlanlar
            </Link>
            <Link 
              href="/about"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-4 py-2.5 text-base font-medium transition-colors`}
            >
              Hakkımızda
            </Link>
            <Link 
              href="/contact"
              className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-4 py-2.5 text-base font-medium transition-colors`}
            >
              İletişim
            </Link>
            <Link
              href="/messages"
              className={`text-base font-medium px-5 py-2.5 rounded-lg hover:bg-green-100 hover:text-green-800 transition-colors ${pathname.startsWith('/messages') ? 'text-green-600 bg-green-100' : isHomePage ? 'text-white' : 'text-gray-700'}`}
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
              <div className="flex items-center space-x-5">
                <Link
                  href="/listings/create"
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-green-700 transition-colors"
                >
                  İlan Ver
                </Link>
                <div className="relative group">
                  <button
                    className={`flex items-center ${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 transition-colors`}
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-green-500 bg-green-100 flex items-center justify-center mr-2">
                      {userProfile?.profileImage ? (
                        <Image 
                          src={userProfile.profileImage} 
                          alt={userProfile.name || "Kullanıcı"} 
                          width={36} 
                          height={36}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-green-600 font-semibold text-base">
                          {userProfile?.name ? userProfile.name[0].toUpperCase() : "S"}
                        </span>
                      )}
                    </div>
                    <span className="text-base font-medium mr-2">Hesabım</span>
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 w-52 mt-2 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-green-100 flex items-center justify-center">
                          {userProfile?.profileImage ? (
                            <Image 
                              src={userProfile.profileImage} 
                              alt={userProfile.name || "Kullanıcı"} 
                              width={28} 
                              height={28}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-green-600 font-semibold text-sm">
                              {userProfile?.name ? userProfile.name[0].toUpperCase() : "S"}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[140px]">
                          {userProfile?.name || session.user?.name || 'Kullanıcı'}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profilim
                    </Link>
                    <Link
                      href="/my-listings"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      İlanlarım
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Favorilerim
                    </Link>
                    <Link
                      href="/messages"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
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
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-5">
                <Link
                  href="/login"
                  className={`${isHomePage ? 'text-white' : 'text-gray-600'} hover:text-green-600 px-4 py-2.5 text-base font-medium transition-colors`}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-base font-medium hover:bg-green-700 transition-colors"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobil Yan Menü */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Karartma Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Kenar Menü */}
            <motion.div
              ref={menuRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 ${isHomePage ? 'bg-black/90 backdrop-blur-lg text-white' : 'bg-white text-gray-800'} shadow-xl overflow-y-auto`}
            >
              {session ? (
                <div className={`p-5 border-b ${isHomePage ? 'border-gray-700/50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-green-500 bg-green-100 flex items-center justify-center">
                        {userProfile?.profileImage ? (
                          <Image 
                            src={userProfile.profileImage} 
                            alt={userProfile.name || "Kullanıcı"} 
                            width={48} 
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-bold text-xl">
                            {userProfile?.name ? userProfile.name[0].toUpperCase() : "S"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium truncate max-w-[140px]">{userProfile?.name || session.user?.name || 'Kullanıcı'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">{userProfile?.email || session.user?.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className={`p-2 rounded-md ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center mr-2">
                      <span className="text-white text-lg font-bold">S</span>
                    </div>
                    <span>Merhaba, misafir</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-md ${isHomePage ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Menü Öğeleri */}
              <div className="p-5 space-y-2">
                <Link
                  href="/listings"
                  className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>İlanlar</span>
                  </div>
                </Link>
                
                <Link
                  href="/about"
                  className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Hakkımızda</span>
                  </div>
                </Link>
                
                <Link
                  href="/contact"
                  className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>İletişim</span>
                  </div>
                </Link>
                
                <Link
                  href="/messages"
                  className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <span>Mesajlar</span>
                  </div>
                </Link>
                
                {session && (
                  <>
                    <Link
                      href="/my-listings"
                      className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>İlanlarım</span>
                      </div>
                    </Link>
                    
                    <Link
                      href="/favorites"
                      className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Favorilerim</span>
                      </div>
                    </Link>
                    
                    <Link
                      href="/profile"
                      className="block px-3 py-2.5 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profilim</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Kullanıcı Hesabı Bölümü */}
              <div className={`border-t ${isHomePage ? 'border-gray-700/50' : 'border-gray-200'} mt-2 pt-4 px-5 pb-8`}>
                {session ? (
                  <>
                    <Link
                      href="/listings/create"
                      className="block w-full px-4 py-3 bg-green-600 text-center text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      İlan Ver
                    </Link>
                    
                    <button
                      onClick={() => signOut()}
                      className="w-full mt-3 text-left px-3 py-2.5 rounded-lg font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Çıkış Yap</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="block px-4 py-2.5 border border-green-600 text-center font-medium rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                    >
                      Giriş Yap
                    </Link>
                    
                    <Link
                      href="/register"
                      className="block px-4 py-2.5 bg-green-600 text-center text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
} 
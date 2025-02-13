'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import UserMenu from '@/app/components/UserMenu'
import { useUnreadCount } from '@/app/hooks/useUnreadCount'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { unreadCount } = useUnreadCount()
  const { data: session } = useSession()
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) {
    return (
      <header className="fixed top-0 w-full z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Stofhamp
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/listings" className="text-gray-600 hover:text-gray-900">
                İlanlar
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                Hakkımızda
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                İletişim
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Giriş Yap
              </Link>
              <Link href="/register" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const headerStyle = isHomePage
    ? `fixed w-full z-40 transition-all duration-500 animate-navSlideDown ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`
    : 'fixed w-full top-0 z-40 bg-white shadow-lg animate-navSlideDown'

  const linkStyle = isHomePage && !isScrolled
    ? 'text-white hover:text-gray-200 text-base font-medium transition-all duration-300 hover:scale-105 animate-navLinkFade'
    : 'text-gray-600 hover:text-gray-900 text-base font-medium transition-all duration-300 hover:scale-105 animate-navLinkFade'

  const logoStyle = isHomePage && !isScrolled
    ? 'text-2xl font-bold text-white hover:text-gray-200 transition-all duration-300 hover:scale-105 animate-navLinkFade'
    : 'text-2xl font-bold text-gray-900 hover:text-gray-700 transition-all duration-300 hover:scale-105 animate-navLinkFade'

  return (
    <header className={headerStyle}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className={`${logoStyle} group`}>
            <span className="relative">
              Stofhamp
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
            </span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/listings" className={`${linkStyle} group`}>
              <span className="relative">
                İlanlar
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </span>
            </Link>
            <Link href="/about" className={`${linkStyle} group`}>
              <span className="relative">
                Hakkımızda
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </span>
            </Link>
            <Link href="/contact" className={`${linkStyle} group`}>
              <span className="relative">
                İletişim
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {session ? (
              <UserMenu session={session} linkStyle={linkStyle} unreadCount={unreadCount} />
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`${linkStyle} px-4 py-2 rounded-lg hover:bg-gray-100/10 group`}
                >
                  <span className="relative">
                    Giriş Yap
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                  </span>
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-navButtonPulse"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 
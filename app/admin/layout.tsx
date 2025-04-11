'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface MenuItem {
  id: string
  name: string
  path: string
  icon: React.ReactNode
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string>('dashboard')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Sayfa genişliğini dinle
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    
    window.addEventListener('resize', checkScreenSize)
    checkScreenSize()
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // Aktif menüyü belirle
  useEffect(() => {
    if (pathname) {
      const paths = pathname.split('/')
      if (paths.length > 2) {
        setActiveMenu(paths[2])
      } else {
        setActiveMenu('dashboard')
      }
    }
  }, [pathname])
  
  // Yükleme durumunu kontrol et
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  // Oturum veya admin yetkisi yoksa ana sayfaya yönlendir
  if (status === 'unauthenticated' || session?.user?.userType !== 'ADMIN') {
    router.push('/')
    return null
  }

  const menuItems: MenuItem[] = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      path: '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'categories', 
      name: 'Kategoriler', 
      path: '/admin/categories',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      id: 'materials', 
      name: 'Malzemeler', 
      path: '/admin/materials',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      id: 'listings', 
      name: 'İlanlar', 
      path: '/admin/listings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'users', 
      name: 'Kullanıcılar', 
      path: '/admin/users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobil Sidebar Arkası */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 transition-opacity bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-all duration-300 transform bg-white shadow-lg lg:shadow-none lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed && !isMobile ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className={`flex items-center justify-between h-16 px-6 ${collapsed && !isMobile ? 'lg:justify-center' : ''}`}>
          <div className="flex items-center">
            <div className="shrink-0">
              <img 
                src="/favicon.ico" 
                alt="Logo"
                className="w-8 h-8"
              />
            </div>
            {(!collapsed || isMobile) && (
              <span className="ml-3 text-xl font-medium text-gray-800">Admin</span>
            )}
          </div>
          {!isMobile && (
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              {collapsed ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="mt-5 px-3 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 transition-colors rounded-lg group ${
                  activeMenu === item.id ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`text-${activeMenu === item.id ? 'green' : 'gray'}-600`}>
                  {item.icon}
                </div>
                {(!collapsed || isMobile) && (
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                )}
                {collapsed && !isMobile && (
                  <span className="absolute left-16 transform -translate-x-1 ml-3 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.name}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className={`p-4 border-t bg-gray-50 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          <Link 
            href="/" 
            className={`flex items-center text-sm text-gray-600 hover:text-green-600 ${collapsed && !isMobile ? '' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {(!collapsed || isMobile) && (
              <span className="ml-2">Siteye Dön</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 h-16">
            {/* Mobil görünümde menü düğmesi */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Sayfa başlığı */}
            <div className="text-xl font-semibold text-gray-800">
              {menuItems.find(item => item.id === activeMenu)?.name || 'Admin Paneli'}
            </div>

            {/* Kullanıcı bilgisi */}
            <div className="flex items-center">
              <div className="relative">
                <div className="flex items-center text-gray-600">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">
                    {session?.user?.image ? (
                      <Image 
                        src={session.user.image} 
                        alt={session.user.name || "Admin"} 
                        width={32} 
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <span>{session?.user?.name?.[0] || 'A'}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {session?.user?.name || 'Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>

        <footer className="bg-white border-t py-3 px-6">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Stofhamp Admin Panel - Tüm hakları saklıdır.
          </div>
        </footer>
      </div>
    </div>
  )
} 
'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/hero-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Hafif koyu overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-16 text-white drop-shadow-2xl">
              <span className="block text-5xl md:text-6xl lg:text-7xl font-light mb-2">Stok Fazlası</span>
              <span className="block text-6xl md:text-7xl lg:text-8xl font-extrabold">Ham Madde Pazarı</span>
            </h1>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
              <div className="relative w-full max-w-xl flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="İlan ara..."
                    id="searchInput"
                    className="w-full px-6 py-4 text-lg bg-white/90 backdrop-blur-sm rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                        if (searchInput.value) {
                          window.location.href = `/listings?search=${encodeURIComponent(searchInput.value)}`;
                        }
                      }
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                    if (searchInput.value) {
                      window.location.href = `/listings?search=${encodeURIComponent(searchInput.value)}`;
                    }
                  }}
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600/90 to-green-500/90 rounded-full hover:from-green-500/90 hover:to-green-400/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Ara
                </button>
              </div>
              <Link
                href={session ? "/listings/create" : "/register"}
                className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-green-600/90 to-green-500/90 rounded-full overflow-hidden hover:scale-105 hover:shadow-2xl hover:from-green-500/90 hover:to-green-400/90"
              >
                <span className="absolute inset-0 w-full h-full bg-white/30 group-hover:scale-x-100 scale-x-0 origin-left transition-transform duration-500"></span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-600/20 to-green-400/20 group-hover:opacity-0 transition-opacity duration-500"></span>
                <span className="relative flex items-center gap-2">
                  <span>{session ? "İlan Ver" : "Hemen Başla"}</span>
                  <svg 
                    className="w-5 h-5 transform transition-all duration-300 ease-out group-hover:translate-x-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            Neden Stofhamp?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Sürdürülebilir Çözüm</h3>
              <p className="text-gray-600 leading-relaxed">
                Projelerde ihtiyaç fazlası kalan hammadde ve malzemelerinizi zarar etmeden değerlendirin. İhtiyaç sahipleriyle buluşarak stok fazlası ürünlerinizi kolayca satın.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Sanayi Odaklı Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                Uygulama yazılımımız, sanayi firmalarının özel ihtiyaçlarına göre tasarlandı. Hem alıcı hem de satıcılar için güvenilir ve kolay bir kullanıcı deneyimi sunuyoruz.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Kaynak Verimliliği</h3>
              <p className="text-gray-600 leading-relaxed">
                Stok Fazlası Ham Madde Pazarı ile elinizdeki fazlalıkları değerlendirirken başka firmaların ihtiyaçlarını karşılayın. Çevreye katkı sağlayarak ekonomik döngüye katılın!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">
              Hemen Başlayın
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Stok fazlası ham maddelerinizi değerlendirmek veya ihtiyacınız olan malzemeleri uygun fiyata bulmak için hemen üye olun.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!session ? (
                <a
                  href="/register"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
                >
                  Ücretsiz Üye Ol
                </a>
              ) : (
                <a
                  href="/listings/create"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
                >
                  İlan Ver
                </a>
              )}
              <a
                href="/listings"
                className="bg-white text-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors border-2 border-green-600 text-lg"
              >
                İlanları Görüntüle
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleSearch = (value: string) => {
    if (value) {
      router.push(`/listings?search=${encodeURIComponent(value)}`)
    }
  }

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
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-8 text-white drop-shadow-2xl">
              <span className="block text-3xl sm:text-4xl md:text-5xl font-light mb-2">Ergin Dayıya</span>
              <span className="block text-4xl sm:text-5xl md:text-7xl font-extrabold mb-8">Selam</span>
            </h1>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="İlan ara..."
                  id="searchInput"
                  className="w-full pl-5 pr-32 py-4 text-base bg-white/95 backdrop-blur-sm rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                      handleSearch(searchInput.value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                    handleSearch(searchInput.value);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 text-sm font-medium"
                >
                  Ara
                </button>
              </div>
            </div>

            <Link
              href="/listings"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="mr-2">İlanlar</span>
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
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
            </Link>
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
                <Link
                  href="/register"
                  className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-base sm:text-lg text-center"
                >
                  Ücretsiz Üye Ol
                </Link>
              ) : (
                <Link
                  href="/listings/create"
                  className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-base sm:text-lg text-center"
                >
                  İlan Ver
                </Link>
              )}
              <Link
                href="/listings"
                className="w-full sm:w-auto bg-white text-green-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors border-2 border-green-600 text-base sm:text-lg text-center"
              >
                İlanları Görüntüle
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
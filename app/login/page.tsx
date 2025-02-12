'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      setError('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1000px] w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Sol Panel - Giriş Formu */}
          <div className="w-full md:w-1/2 p-8 md:p-12 transform transition-all duration-500">
            <div className={`${!isSignUp ? 'block' : 'hidden'}`}>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Tekrar Hoş Geldiniz!</h2>
                <p className="text-gray-600">Hesabınıza giriş yaparak devam edin</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fadeIn">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="peer w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-transparent focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      placeholder="Email"
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-green-500"
                    >
                      Email
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="peer w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-transparent focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      placeholder="Şifre"
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-green-500"
                    >
                      Şifre
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-gray-600 hover:text-gray-800 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2" />
                    Beni hatırla
                  </label>
                  <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                    Şifremi unuttum
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    'Giriş Yap'
                  )}
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">veya şununla devam et</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.35 5.35-2.79 2.79c-.32-.71-.78-1.37-1.34-1.93s-1.22-1.02-1.93-1.34l2.79-2.79c1.31.71 2.4 1.8 3.11 3.11zm-9.7 1.93-2.79-2.79c.71-1.31 1.8-2.4 3.11-3.11l2.79 2.79c-.71.32-1.37.78-1.93 1.34s-1.02 1.22-1.34 1.93zm-.71 7.4c-.71-1.31-1.11-2.8-1.11-4.38s.4-3.07 1.11-4.38l2.79 2.79c-.32.71-.5 1.49-.5 2.29s.18 1.58.5 2.29l-2.79 2.79zm5.35 3.11-2.79-2.79c.71-.32 1.37-.78 1.93-1.34s1.02-1.22 1.34-1.93l2.79 2.79c-1.31.71-2.4 1.8-3.11 3.11zm4.35-3.11c-.71 1.31-1.8 2.4-3.11 3.11l-2.79-2.79c.32-.71.78-1.37 1.34-1.93s1.22-1.02 1.93-1.34l2.79 2.79c.71 1.31 1.11 2.8 1.11 4.38z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sağ Panel - Bilgi ve Animasyon */}
          <div className="w-full md:w-1/2 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            {/* Arka plan görseli ve overlay */}
            <div className="absolute inset-0">
              <Image
                src="/login-bg.jpg"
                alt="Login Background"
                fill
                className="object-cover object-center"
                priority
              />
            </div>

            {/* Animasyonlu arka plan deseni */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
              </div>
            </div>

            <div className="relative text-center space-y-8 z-10">
              <div className="mb-10">
                <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-[0_4px_3px_rgba(0,0,0,0.4)]">Stok Fazlası Ham Madde Pazarı</h2>
                <p className="text-lg text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">
                  Sürdürülebilir üretim için akıllı çözümler
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white drop-shadow-md">Maliyet Avantajı</h3>
                    <p className="text-sm text-white drop-shadow">Stok fazlası ham maddeleri değerinde alın veya satın</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white drop-shadow-md">Sürdürülebilirlik</h3>
                    <p className="text-sm text-white drop-shadow">Çevreye duyarlı üretim ve kaynak verimliliği</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7m-6 4v2m4-2v2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white drop-shadow-md">Güvenli Platform</h3>
                    <p className="text-sm text-white drop-shadow">Güvenilir alıcı ve satıcılarla güvenli ticaret</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-4 text-white drop-shadow-md">Henüz hesabınız yok mu?</p>
                <Link
                  href="/register"
                  className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transform transition-all hover:scale-105"
                >
                  Hemen Ücretsiz Üye Olun
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
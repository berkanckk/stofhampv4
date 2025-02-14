'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        phone: formData.get('phone') as string || undefined,
        company: formData.get('company') as string || undefined,
        userType: formData.get('userType') as 'PERSONAL' | 'BUSINESS',
      }

      // Kayıt işlemi
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const registerResult = await registerRes.json()

      if (!registerRes.ok) {
        throw new Error(registerResult.message || 'Kayıt sırasında bir hata oluştu')
      }

      // Otomatik giriş yapma
      const signInRes = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInRes?.error) {
        throw new Error('Otomatik giriş yapılamadı')
      }

      // Ana sayfaya yönlendirme
      router.push('/')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kayıt sırasında beklenmeyen bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserType(e.target.value as 'PERSONAL' | 'BUSINESS')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1000px] w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* Sol Panel - Bilgi ve Animasyon */}
          <div className="w-full md:w-1/2 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            {/* Arka plan görseli */}
            <div className="absolute inset-0">
              <Image
                src="/login-bg.jpg"
                alt="Register Background"
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
            </div>
          </div>

          {/* Sağ Panel - Kayıt Formu */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoş Geldiniz!</h2>
              <p className="text-gray-600">Hemen ücretsiz hesap oluşturun</p>
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
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-transparent focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    placeholder="Ad Soyad"
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-green-500"
                  >
                    Ad Soyad
                  </label>
                </div>

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

                <div className="relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="peer w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-transparent focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                    placeholder="Telefon"
                  />
                  <label
                    htmlFor="phone"
                    className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-green-500"
                  >
                    Telefon (İsteğe bağlı)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hesap Türü
                  </label>
                  <select
                    id="userType"
                    name="userType"
                    required
                    value={userType}
                    onChange={handleUserTypeChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  >
                    <option value="PERSONAL">Bireysel</option>
                    <option value="BUSINESS">Kurumsal</option>
                  </select>
                </div>

                {userType === 'BUSINESS' && (
                  <div className="relative">
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      className="peer w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-transparent focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      placeholder="Firma Adı"
                    />
                    <label
                      htmlFor="company"
                      className="absolute left-4 -top-2.5 bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-green-500"
                    >
                      Firma Adı
                    </label>
                  </div>
                )}
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
                    Kaydediliyor...
                  </div>
                ) : (
                  'Kayıt Ol'
                )}
              </button>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Zaten hesabınız var mı?{' '}
                  <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                    Giriş yapın
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 
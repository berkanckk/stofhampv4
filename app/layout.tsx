import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from './components/Header'
import Footer from './components/Footer'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stofhamp - İkinci El Eşya Alım Satım',
  description: 'İkinci el eşyalarınızı güvenle alın ve satın',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
} 
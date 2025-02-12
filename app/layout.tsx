import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Stofhamp - Stok Fazlası Ham Madde Pazarı',
  description: 'Üretici firmalar için sürdürülebilir stok fazlası çözümleri',
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
          <div className="flex flex-col min-h-screen relative">
            <Header />
            <main className="flex-1 relative z-0 bg-gray-50">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
} 
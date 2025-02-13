'use client'

import { SessionProvider } from 'next-auth/react'
import Header from './Header'
import Footer from './Footer'
import { Toaster } from 'react-hot-toast'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <Toaster />
    </SessionProvider>
  )
} 
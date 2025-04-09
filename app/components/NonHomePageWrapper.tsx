'use client'

import { usePathname } from 'next/navigation'

export default function NonHomePageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <main className={isHomePage ? '' : 'pt-16'}>
      {children}
    </main>
  )
} 
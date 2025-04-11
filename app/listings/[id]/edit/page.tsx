import { Suspense } from 'react'
import type { Viewport } from 'next'
import EditListingForm from './EditListingForm'
import prisma from '@/app/lib/prismadb'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

// Sayfayı dinamik olarak işaretliyoruz
export const dynamic = 'force-dynamic'
// Önbelleğe almayı devre dışı bırakıyoruz
export const revalidate = 0

async function getInitialData() {
  try {
    const [categories, materialTypes] = await Promise.all([
      prisma.category.findMany(),
      prisma.materialType.findMany(),
    ])
    return { categories, materialTypes }
  } catch (error) {
    console.error('Veri alınırken hata oluştu:', error)
    return { categories: [], materialTypes: [] }
  }
}

interface PageProps {
  params: {
    id: string
  }
}

// generateStaticParams fonksiyonunu kaldırıyoruz çünkü artık dinamik sayfa

// ✅ Burada artık `params.id` hatası almayacağız
export default async function EditListingPage({ params }: PageProps) {
  const listingId = params.id

  // Sonra diğer verileri alalım
  const initialData = await getInitialData()

  if (!listingId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <Suspense fallback={
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        }>
          <EditListingForm id={listingId} initialData={initialData} />
        </Suspense>
      </div>
    </div>
  )
}

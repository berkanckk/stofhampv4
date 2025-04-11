import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { globalCache } from '@/app/lib/cache'

interface Category {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    listings: number
  }
}

const CACHE_KEY = 'categories'

export async function GET() {
  try {
    // Veritabanı bağlantısını kontrol et
    try {
      await prisma.$connect()
    } catch (error) {
      console.error('Veritabanı bağlantı hatası:', error)
      return NextResponse.json({
        success: false,
        message: 'Veritabanına bağlanılamıyor, lütfen daha sonra tekrar deneyin.',
        error: (error as Error).message,
        data: [] // Boş dizi döndür
      }, { status: 503 }) // 503 Service Unavailable
    }
    
    // Cache'den kategorileri al
    let categories = globalCache.get<Category[]>(CACHE_KEY)

    // Cache'de yoksa veritabanından al
    if (!categories) {
      try {
        categories = await prisma.category.findMany({
          orderBy: {
            name: 'asc'
          },
          include: {
            _count: {
              select: {
                listings: true
              }
            }
          }
        })

        // Cache'e kaydet
        globalCache.set(CACHE_KEY, categories)
      } catch (error) {
        console.error('Kategoriler getirilirken veritabanı hatası:', error)
        // Hata durumunda boş dizi döndür
        categories = []
      }
    }

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json({
      success: false, 
      message: 'Kategoriler alınırken bir hata oluştu',
      error: (error as Error).message,
      data: [] // Boş dizi ile yanıt ver
    }, { status: 500 })
  } finally {
    // Bağlantıyı kapatalım
    await prisma.$disconnect()
  }
} 
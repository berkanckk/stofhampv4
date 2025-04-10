import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { globalCache } from '@/app/lib/cache'

const CACHE_KEY = 'materials'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    
    // Cache anahtarına parametreleri ekle
    const cacheKey = categoryId ? `${CACHE_KEY}_${categoryId}` : CACHE_KEY

    // Cache'den materyalleri al
    let materials = globalCache.get<any[]>(cacheKey)

    // Cache'de yoksa veritabanından al
    if (!materials) {
      // Eğer kategori ID'si belirtilmişse, o kategoriye ait malzemeleri getir
      if (categoryId) {
        materials = await prisma.materialType.findMany({
          where: {
            categoryId
          },
          orderBy: {
            name: 'asc'
          }
        })
      } else {
        // Tüm malzemeleri getir
        materials = await prisma.materialType.findMany({
          orderBy: {
            name: 'asc'
          }
        })
      }

      // Cache'e kaydet
      globalCache.set(cacheKey, materials)
    }

    return NextResponse.json({
      success: true,
      data: materials
    })
  } catch (error) {
    console.error('Get materials error:', error)
    return NextResponse.json(
      { success: false, message: 'Malzeme tipleri alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { globalCache } from '@/app/lib/cache'

const CACHE_KEY = 'materials'

export async function GET() {
  try {
    // Cache'den materyalleri al
    let materials = globalCache.get<any[]>(CACHE_KEY)

    // Cache'de yoksa veritabanından al
    if (!materials) {
      materials = await prisma.materialType.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      // Cache'e kaydet
      globalCache.set(CACHE_KEY, materials)
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
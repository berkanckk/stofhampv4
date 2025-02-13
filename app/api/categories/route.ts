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
    // Cache'den kategorileri al
    let categories = globalCache.get<Category[]>(CACHE_KEY)

    // Cache'de yoksa veritabanından al
    if (!categories) {
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
    }

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { success: false, message: 'Kategoriler alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
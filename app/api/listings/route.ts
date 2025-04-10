import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { Prisma } from '@prisma/client'
import { globalCache } from '@/app/lib/cache'
import { generateSlug } from '@/app/lib/utils'

const ITEMS_PER_PAGE = 9
const CACHE_TTL = 60 * 1000 // 1 dakika
const CACHE_KEYS = {
  CATEGORIES: 'categories',
  MATERIALS: 'materials',
  LISTINGS: 'listings',
}

// Cache key oluşturma fonksiyonu
function generateListingsCacheKey(params: URLSearchParams): string {
  const page = params.get('page') || '1'
  const sortBy = params.get('sortBy') || 'newest'
  const category = params.get('category') || ''
  const material = params.get('material') || ''
  const condition = params.get('condition') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const search = params.get('search') || ''
  const location = params.get('location') || ''

  return `${CACHE_KEYS.LISTINGS}_${page}_${sortBy}_${category}_${material}_${condition}_${minPrice}_${maxPrice}_${search}_${location}`
}

export async function GET(request: Request) {
  try {
    await prisma.$connect()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const cursor = searchParams.get('cursor')
    const sortBy = searchParams.get('sortBy') || 'newest'
    
    const filters = {
      category: searchParams.get('category'),
      material: searchParams.get('material'),
      condition: searchParams.get('condition'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      search: searchParams.get('search'),
      location: searchParams.get('location')
    }

    console.log('Search parameters:', { page, sortBy, ...filters })

    // Cache'den kategorileri ve materyalleri al
    let categories = globalCache.get(CACHE_KEYS.CATEGORIES)
    let materialTypes = globalCache.get(CACHE_KEYS.MATERIALS)

    // Cache'de yoksa veritabanından al ve cache'e kaydet
    if (!categories || !materialTypes) {
      [categories, materialTypes] = await Promise.all([
        prisma.category.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { listings: true }
            }
          }
        }),
        prisma.materialType.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { listings: true }
            }
          }
        })
      ])

      globalCache.set(CACHE_KEYS.CATEGORIES, categories)
      globalCache.set(CACHE_KEYS.MATERIALS, materialTypes)
    }

    // Composite cache key oluştur
    const compositeKey = {
      page,
      sortBy,
      filters
    }
    
    // Cache'den ilanları kontrol et
    let cachedData = globalCache.getComposite(CACHE_KEYS.LISTINGS, compositeKey)
    
    if (cachedData) {
      console.log('Listings fetched from cache')
      return NextResponse.json({
        success: true,
        data: {
          ...cachedData,
          categories,
          materialTypes
        }
      })
    }

    // Sıralama parametrelerini ayarla
    const orderBy: Prisma.ListingOrderByWithRelationInput = {}

    if (sortBy === 'oldest') {
      orderBy.createdAt = 'asc'
    } else if (sortBy === 'priceDesc') {
      orderBy.price = 'desc' // En yüksek fiyattan en düşüğe
    } else if (sortBy === 'priceAsc') {
      orderBy.price = 'asc' // En düşük fiyattan en yükseğe
    } else {
      // default: newest
      orderBy.createdAt = 'desc'
    }

    // Filtreleme koşullarını oluştur
    const where: Prisma.ListingWhereInput = {}

    if (filters.category) {
      console.log('Filtreleniyor - Kategori:', filters.category);
      where.categoryId = filters.category;
    }
    
    if (filters.material) {
      console.log('Filtreleniyor - Malzeme:', filters.material);
      where.materialId = filters.material;
    }
    
    if (filters.condition) {
      console.log('Filtreleniyor - Durumu:', filters.condition);
      where.condition = filters.condition as 'NEW' | 'USED';
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice && { gte: parseFloat(filters.minPrice) }),
        ...(filters.maxPrice && { lte: parseFloat(filters.maxPrice) })
      }
      console.log('Filtreleniyor - Fiyat:', where.price);
    }

    if (filters.search) {
      const searchTerms = filters.search.trim().split(/\s+/); // Arama terimini boşluklardan ayır
      
      // Her kelime için ayrı bir arama koşulu oluştur
      const searchConditions = searchTerms.map(term => {
        return {
          OR: [
            { title: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: term, mode: 'insensitive' as Prisma.QueryMode } }
          ]
        } as Prisma.ListingWhereInput;
      });
      
      // Tüm koşulları birleştir (AND ile)
      if (searchConditions.length > 0) {
        where.AND = searchConditions;
      }
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' }
    }

    console.log('Query conditions:', { where, orderBy })

    // İlanları ve toplam sayıyı paralel olarak al
    const [items, totalItems] = await Promise.all([
      prisma.listing.findMany({
        where,
        take: ITEMS_PER_PAGE,
        skip: (page - 1) * ITEMS_PER_PAGE,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              company: true,
              profileImage: true
            }
          },
          category: true,
          material: true,
          _count: {
            select: { favorites: true }
          }
        }
      }),
      prisma.listing.count({ where })
    ])

    console.log(`Found ${items.length} items out of ${totalItems} total`)

    // Pagination bilgilerini hesapla
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    const hasNextPage = items.length === ITEMS_PER_PAGE
    const nextCursor = hasNextPage ? items[items.length - 1].id : null

    const responseData = {
      items,
      pagination: {
        totalItems,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage: page > 1,
        nextCursor
      }
    }

    console.log(`Sayfalama bilgileri: Sayfa ${page}/${totalPages}, Toplam öğe: ${totalItems}, Sayfa başına: ${ITEMS_PER_PAGE}`)

    // Composite cache'e kaydet
    globalCache.setComposite(CACHE_KEYS.LISTINGS, compositeKey, responseData)

    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
        categories,
        materialTypes
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, {
      status: error instanceof Prisma.PrismaClientKnownRequestError ? 400 : 500
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }, { status: 401 })
    }

    const body = await request.json()
    
    // İlan son kullanma tarihini ayarla (30 gün)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Slug oluştur
    let slug = generateSlug(body.title)
    let slugExists = true
    let slugCounter = 1

    // Eğer slug zaten varsa sonuna sayı ekle
    while (slugExists) {
      const existingListing = await prisma.listing.findUnique({
        where: { slug: slugCounter > 1 ? `${slug}-${slugCounter}` : slug }
      })

      if (!existingListing) {
        slugExists = false
        if (slugCounter > 1) {
          slug = `${slug}-${slugCounter}`
        }
      } else {
        slugCounter++
      }
    }

    // Yeni ilanı oluştur
    const listing = await prisma.listing.create({
      data: {
        ...body,
        slug,
        sellerId: session.user.id,
        expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      data: listing
    })

  } catch (error) {
    console.error('Create listing error:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'İlan oluşturulurken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, {
      status: error instanceof Prisma.PrismaClientKnownRequestError ? 400 : 500
    })
  } finally {
    await prisma.$disconnect()
  }
}

// İlan oluşturulduğunda veya güncellendiğinde tüm cache'i temizle
export function invalidateListingsCache() {
  const keys = globalCache.keys()
  keys.forEach(key => {
    if (key.startsWith(CACHE_KEYS.LISTINGS)) {
      globalCache.invalidate(key)
    }
  })
} 
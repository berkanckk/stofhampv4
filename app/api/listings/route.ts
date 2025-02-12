import { PrismaClient, Prisma, Condition } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filtreleme parametrelerini al
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const materialId = searchParams.get('materialId')
    const condition = searchParams.get('condition') as Condition | undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Filtreleme koşullarını oluştur
    const where: Prisma.ListingWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(materialId && { materialId }),
      ...(condition && { condition }),
      ...(location && { 
        location: { 
          contains: location, 
          mode: 'insensitive' as Prisma.QueryMode 
        } 
      }),
      ...(minPrice || maxPrice ? {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      } : {}),
    }

    // Kategorileri ve malzeme tiplerini al
    const [categories, materialTypes, listings] = await Promise.all([
      prisma.category.findMany(),
      prisma.materialType.findMany(),
      prisma.listing.findMany({
        where,
        include: {
          category: true,
          material: true,
          seller: {
            select: {
              id: true,
              name: true,
              company: true,
              profileImage: true,
            },
          },
        },
        orderBy: sortBy === 'price_asc' 
          ? { price: 'asc' }
          : sortBy === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: sortBy === 'newest' ? 'desc' : 'asc' },
      }),
    ])

    return new Response(JSON.stringify({
      success: true,
      data: {
        categories,
        materialTypes,
        listings,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Listings error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'İlanlar yüklenirken bir hata oluştu',
      data: {
        categories: [],
        materialTypes: [],
        listings: [],
      },
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } finally {
    await prisma.$disconnect()
  }
} 
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/options'
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { globalCache } from '@/app/lib/cache'

export const dynamic = 'force-dynamic'

const CACHE_KEYS = {
  LISTING_DETAIL: 'listing_detail',
  LISTING_WITH_RELATIONS: 'listing_with_relations'
}

const CACHE_TTL = {
  DETAIL: 2 * 60 * 1000, // 2 dakika
  RELATIONS: 5 * 60 * 1000 // 5 dakika
}

// İlan detaylarını getir
async function getListingDetails(id: string) {
  const cacheKey = `${CACHE_KEYS.LISTING_DETAIL}_${id}`
  let listing = globalCache.get(cacheKey)

  if (!listing) {
    listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            profileImage: true,
            phone: true
          }
        },
        category: true,
        material: true,
        _count: {
          select: { favorites: true }
        }
      }
    })

    if (listing) {
      globalCache.set(cacheKey, listing, CACHE_TTL.DETAIL)
    }
  }

  return listing
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const id = params.id

    // İlan detaylarını getir
    const listing = await getListingDetails(id)

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: listing
    })

  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { success: false, message: 'İlan alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params
    
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        condition: body.condition,
        images: body.images,
        location: body.location,
        categoryId: body.categoryId,
        materialId: body.materialId,
      },
      include: {
        category: true,
        material: true,
      },
    })

    // Cache'i temizle
    invalidateListingCache(id)

    return NextResponse.json({
      success: true,
      data: updatedListing
    })

  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({
      success: false,
      message: 'İlan güncellenirken bir hata oluştu'
    }, { status: 500 })
  }
}

// Cache'i temizleme fonksiyonu
export function invalidateListingCache(id: string) {
  globalCache.invalidate(`${CACHE_KEYS.LISTING_DETAIL}_${id}`)
  globalCache.invalidate(`${CACHE_KEYS.LISTING_WITH_RELATIONS}_${id}`)
} 
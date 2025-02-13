import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { globalCache } from '@/app/lib/cache'
import { invalidateListingCache } from '../route'

const CACHE_KEYS = {
  FAVORITES: 'favorites',
  BATCH_FAVORITES: 'batch_favorites'
}

const BATCH_SIZE = 10

interface Favorite {
  listingId: string
}

async function batchGetFavorites(listingIds: string[], userId: string): Promise<Favorite[]> {
  const batchKey = {
    userId,
    items: listingIds
  }

  let favorites = globalCache.getBatch<Favorite[]>(CACHE_KEYS.BATCH_FAVORITES, batchKey)

  if (!favorites) {
    favorites = await prisma.favorite.findMany({
      where: {
        listingId: { in: listingIds },
        userId
      },
      select: {
        listingId: true
      }
    })

    globalCache.setBatch(CACHE_KEYS.BATCH_FAVORITES, batchKey, favorites)
  }

  return favorites
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const params = await context.params
    const id = params.id

    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false })
    }

    // Batch işlemi için favori kontrolü
    const favorites = await batchGetFavorites([id], session.user.id)
    const isFavorite = favorites.some(favorite => favorite.listingId === id)

    return NextResponse.json({ isFavorite })
  } catch (error) {
    console.error('Check favorite error:', error)
    return NextResponse.json(
      { success: false, message: 'Favori durumu kontrol edilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const params = await context.params
    const id = params.id

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        listingId: id,
        userId: session.user.id
      }
    })

    if (favorite) {
      // Favoriyi kaldır
      await prisma.favorite.delete({
        where: { id: favorite.id }
      })
    } else {
      // Favoriye ekle
      await prisma.favorite.create({
        data: {
          listingId: id,
          userId: session.user.id
        }
      })
    }

    // Cache'i temizle
    invalidateListingCache(id)
    globalCache.invalidateByPrefix(CACHE_KEYS.BATCH_FAVORITES)

    return NextResponse.json({
      success: true,
      isFavorite: !favorite,
      message: !favorite ? 'İlan favorilere eklendi' : 'İlan favorilerden kaldırıldı'
    })
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { success: false, message: 'Favori işlemi yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const params = await context.params

    if (!session?.user?.id) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }), { status: 401 })
    }

    const listingId = params.id

    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'İlan favorilerden kaldırıldı',
    }), { status: 200 })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'İlan favorilerden kaldırılırken bir hata oluştu'
    }), { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 
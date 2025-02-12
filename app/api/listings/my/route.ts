import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const listings = await prisma.listing.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        category: true,
        material: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Response.json({
      success: true,
      data: listings,
    })
  } catch (error) {
    console.error('Get my listings error:', error)
    return Response.json(
      {
        success: false,
        message: 'İlanlarınız alınırken bir hata oluştu',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// İlan silme endpoint'i
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('id')

    if (!listingId) {
      return Response.json(
        { success: false, message: 'İlan ID\'si gerekli' },
        { status: 400 }
      )
    }

    // İlanın kullanıcıya ait olduğunu kontrol et
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return Response.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return Response.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    // İlanı sil
    await prisma.listing.delete({
      where: { id: listingId },
    })

    return Response.json({
      success: true,
      message: 'İlan başarıyla silindi',
    })
  } catch (error) {
    console.error('Delete listing error:', error)
    return Response.json(
      {
        success: false,
        message: 'İlan silinirken bir hata oluştu',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
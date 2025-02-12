import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/options'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        material: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            profileImage: true,
          },
        },
      },
    })

    if (!listing) {
      return new Response(
        JSON.stringify({ success: false, message: 'İlan bulunamadı' }),
        { status: 404 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: listing }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Get listing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'İlan alınırken bir hata oluştu',
      }),
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
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
      return new Response(
        JSON.stringify({ success: false, message: 'Oturum açmanız gerekiyor' }),
        { status: 401 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return new Response(
        JSON.stringify({ success: false, message: 'İlan bulunamadı' }),
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Bu işlem için yetkiniz yok' }),
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

    return new Response(
      JSON.stringify({ success: true, data: updatedListing }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Update listing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'İlan güncellenirken bir hata oluştu',
      }),
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
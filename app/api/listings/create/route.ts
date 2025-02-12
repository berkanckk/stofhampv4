import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return Response.json(
        { success: false, message: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, description, price, condition, categoryId, materialId, location, images } = body

    // Validasyon
    if (!title || !description || !price || !condition || !categoryId || !materialId || !location) {
      return Response.json(
        { success: false, message: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      )
    }

    // İlanı oluştur
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        condition,
        categoryId,
        materialId,
        location,
        images: images || [],
        sellerId: user.id,
      },
      include: {
        category: true,
        material: true,
        seller: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    })

    return Response.json({
      success: true,
      message: 'İlan başarıyla oluşturuldu',
      data: listing,
    })
  } catch (error) {
    console.error('Create listing error:', error)
    return Response.json(
      {
        success: false,
        message: 'İlan oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
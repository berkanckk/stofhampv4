import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        listing: {
          include: {
            category: true,
            material: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return Response.json({
      success: true,
      data: favorites,
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    return Response.json(
      { success: false, message: 'Favoriler alınırken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
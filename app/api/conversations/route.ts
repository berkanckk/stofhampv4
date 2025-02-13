import { getServerSession } from 'next-auth'
import prisma from '@/app/lib/prismadb'
import { authOptions } from '@/app/lib/auth'

// Sohbet listesini getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: session.user.id,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return Response.json({ success: true, data: conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return Response.json(
      { success: false, message: 'Sohbetler alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni sohbet başlat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sellerId, listingId } = body

    // Satıcı kontrolü
    if (session.user.id === sellerId) {
      return Response.json(
        { success: false, message: 'Kendi ilanınıza mesaj gönderemezsiniz' },
        { status: 400 }
      )
    }

    // Mevcut sohbeti kontrol et
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { users: { some: { id: session.user.id } } },
          { users: { some: { id: sellerId } } },
          { listingId }
        ]
      }
    })

    // Sohbet yoksa yeni oluştur
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          users: {
            connect: [
              { id: session.user.id },
              { id: sellerId }
            ]
          },
          listing: {
            connect: { id: listingId }
          }
        }
      })
    }

    return Response.json({ 
      success: true, 
      data: conversation 
    })
  } catch (error) {
    console.error('Create conversation error:', error)
    return Response.json(
      { success: false, message: 'Sohbet oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
} 
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

// Profil bilgilerini getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        userType: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      data: user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Profil bilgileri alınırken bir hata oluştu'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Profil bilgilerini güncelle
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { name, email, phone, company, profileImage } = body

    if (!name || !email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Ad ve email zorunludur'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        profileImage: profileImage || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        userType: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      data: updatedUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Profil güncellenirken bir hata oluştu'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    await prisma.$disconnect()
  }
} 
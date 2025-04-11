import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Tüm kullanıcıları getir (admin için)
export async function GET() {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions)
    if (!session || session.user?.userType !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Kullanıcıları getir (hassas bilgileri hariç)
    const users = await prisma.user.findMany({
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
        password: false // şifreyi dahil etme
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kullanıcılar getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Yeni kullanıcı oluşturma
export async function POST(request: Request) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions)
    if (!session || session.user?.userType !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { name, email, password, phone, company, userType } = body

    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Ad, email ve şifre zorunludur'
      }, { status: 400 })
    }

    // Email kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Bu email adresi zaten kullanılıyor'
      }, { status: 400 })
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10)

    // Yeni kullanıcı oluştur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        company: company || null,
        userType: userType || 'PERSONAL',
      },
    })

    // Şifreyi yanıttan çıkar
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: userWithoutPassword
    }, { status: 201 })
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import prisma from '@/app/lib/prismadb' // Global prisma client kullan
import bcrypt from 'bcryptjs'

// Kullanıcı getirme
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.userType !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const id = params.id

    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Kullanıcı getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Kullanıcı güncelleme
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.userType !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const id = params.id
    const body = await request.json()
    const { name, email, password, phone, company, userType, profileImage } = body

    if (!name || !email) {
      return NextResponse.json({
        success: false,
        message: 'Ad ve email zorunludur'
      }, { status: 400 })
    }

    // Kullanıcı var mı kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    // Email değişmişse, başka bir kullanıcıda bu email var mı kontrol et
    if (email !== existingUser.email) {
      const duplicateEmail = await prisma.user.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      })

      if (duplicateEmail) {
        return NextResponse.json({
          success: false,
          message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor'
        }, { status: 400 })
      }
    }

    // Güncelleme verisini hazırla
    const updateData: any = {
      name,
      email,
      phone: phone || null,
      company: company || null,
      userType: userType || existingUser.userType,
    }

    // Profil resmi değiştiyse ekle
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage
    }

    // Şifre değiştiyse hashle
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      user: updatedUser
    })
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Kullanıcı silme
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum kontrolü
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.userType !== 'ADMIN') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Bu işlem için yetkiniz bulunmamaktadır'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const id = params.id

    // Kullanıcı var mı kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    // Admin kullanıcısı silmeye çalışıyorsa engelle
    if (existingUser.userType === 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Admin kullanıcıları silinemez'
      }, { status: 400 })
    }

    // İlişkili verileri temizle veya ilişkilendir
    // Bu işlem, ilişkili verilerinize göre değişebilir
    // Örnek: Kullanıcının ilanlarını, mesajlarını silmek veya 
    // bu kayıtları silinmiş bir kullanıcıyla ilişkilendirmek gerekebilir

    // Kullanıcıyı sil
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi'
    })
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
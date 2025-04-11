import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import prisma from '@/app/lib/prismadb' // Global prisma client kullan

// Yeni bir PrismaClient örneği oluşturmuyoruz
// const prisma = new PrismaClient()

// Kategori getirme
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

    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json({
        success: false,
        message: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Kategori getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kategori getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Kategori güncelleme
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Kategori adı zorunludur'
      }, { status: 400 })
    }

    // Kategori var mı kontrolü
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        message: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      category: updatedCategory
    })
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kategori güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Kategori silme
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

    // Kategori var mı kontrolü
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        listings: true,
        materialTypes: true
      }
    })

    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        message: 'Kategori bulunamadı'
      }, { status: 404 })
    }

    // Kategori bağlı ilanlar veya malzemeler varsa silme işlemini engelle
    if (existingCategory.listings.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Bu kategoriye bağlı ilanlar bulunmaktadır. Önce ilanları silmelisiniz.'
      }, { status: 400 })
    }

    if (existingCategory.materialTypes.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Bu kategoriye bağlı malzeme türleri bulunmaktadır. Önce malzeme türlerini silmelisiniz.'
      }, { status: 400 })
    }

    // Kategori silme işlemi
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    })
  } catch (error) {
    console.error('Kategori silme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kategori silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import prisma from '@/app/lib/prismadb' // Global prisma client kullan

// Yeni bir PrismaClient örneği oluşturmuyoruz
// const prisma = new PrismaClient()

// Malzeme getirme
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

    const material = await prisma.materialType.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!material) {
      return NextResponse.json({
        success: false,
        message: 'Malzeme bulunamadı'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        categoryName: material.category?.name || null
      }
    })
  } catch (error) {
    console.error('Malzeme getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Malzeme getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Malzeme güncelleme
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
    const { name, description, categoryId } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Malzeme adı zorunludur'
      }, { status: 400 })
    }

    // Malzeme var mı kontrolü
    const existingMaterial = await prisma.materialType.findUnique({
      where: { id }
    })

    if (!existingMaterial) {
      return NextResponse.json({
        success: false,
        message: 'Malzeme bulunamadı'
      }, { status: 404 })
    }

    // Aynı isimde başka bir malzeme var mı?
    const duplicateMaterial = await prisma.materialType.findFirst({
      where: { 
        name,
        id: { not: id }
      }
    })

    if (duplicateMaterial) {
      return NextResponse.json({
        success: false,
        message: 'Bu isimde başka bir malzeme zaten mevcut'
      }, { status: 400 })
    }

    // Eğer kategori ID belirtildiyse, kategoriyi kontrol et
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return NextResponse.json({
          success: false,
          message: 'Belirtilen kategori bulunamadı'
        }, { status: 400 })
      }
    }

    const updatedMaterial = await prisma.materialType.update({
      where: { id },
      data: {
        name,
        description,
        categoryId: categoryId || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Malzeme başarıyla güncellendi',
      material: updatedMaterial
    })
  } catch (error) {
    console.error('Malzeme güncelleme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Malzeme güncellenirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Malzeme silme
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

    // Malzeme var mı kontrolü
    const existingMaterial = await prisma.materialType.findUnique({
      where: { id },
      include: {
        listings: true
      }
    })

    if (!existingMaterial) {
      return NextResponse.json({
        success: false,
        message: 'Malzeme bulunamadı'
      }, { status: 404 })
    }

    // Malzemeye bağlı ilanlar varsa silme işlemini engelle
    if (existingMaterial.listings.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Bu malzemeye bağlı ilanlar bulunmaktadır. Önce ilanları silmelisiniz.'
      }, { status: 400 })
    }

    // Malzeme silme işlemi
    await prisma.materialType.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Malzeme başarıyla silindi'
    })
  } catch (error) {
    console.error('Malzeme silme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Malzeme silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
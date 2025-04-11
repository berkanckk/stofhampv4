import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const prisma = new PrismaClient()

// Tüm malzemeleri getir (admin için detaylı)
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

    // Malzemeleri getir (kategori bilgisiyle)
    const materials = await prisma.materialType.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Verileri düzenle
    const formattedMaterials = materials.map(material => ({
      id: material.id,
      name: material.name,
      description: material.description,
      categoryId: material.categoryId,
      categoryName: material.category?.name || null,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: formattedMaterials
    })
  } catch (error) {
    console.error('Malzemeleri getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Malzemeler getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Yeni malzeme oluşturma
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
    const { name, description, categoryId } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Malzeme adı zorunludur'
      }, { status: 400 })
    }

    // İsimde malzeme var mı kontrol et
    const existingMaterial = await prisma.materialType.findFirst({
      where: { name }
    })

    if (existingMaterial) {
      return NextResponse.json({
        success: false,
        message: 'Bu isimde bir malzeme zaten mevcut'
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

    // Yeni malzeme oluştur
    const newMaterial = await prisma.materialType.create({
      data: {
        name,
        description,
        categoryId: categoryId || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Malzeme başarıyla oluşturuldu',
      material: newMaterial
    }, { status: 201 })
  } catch (error) {
    console.error('Malzeme oluşturma hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Malzeme oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
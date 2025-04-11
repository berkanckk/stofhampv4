import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const prisma = new PrismaClient()

// İlan detayını getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        material: {
          select: {
            id: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: 'İlan bulunamadı'
      }, { status: 404 })
    }

    // İlan verilerini düzenle
    const formattedListing = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      condition: listing.condition,
      images: listing.images,
      location: listing.location,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      expiresAt: listing.expiresAt,
      categoryId: listing.categoryId,
      categoryName: listing.category?.name || null,
      materialId: listing.materialId,
      materialName: listing.material?.name || null,
      seller: {
        id: listing.seller.id,
        name: listing.seller.name,
        email: listing.seller.email,
        phone: listing.seller.phone
      }
    }

    return NextResponse.json({
      success: true,
      listing: formattedListing
    })
  } catch (error) {
    console.error('İlan getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'İlan getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// İlan silme
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // İlan var mı kontrol et
    const listing = await prisma.listing.findUnique({
      where: { id: params.id }
    })

    if (!listing) {
      return NextResponse.json({
        success: false,
        message: 'İlan bulunamadı'
      }, { status: 404 })
    }

    // İlanı sil
    // İlerleyen aşamada soft delete eklenmesi düşünülebilir
    await prisma.listing.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'İlan başarıyla silindi'
    })
  } catch (error) {
    console.error('İlan silme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'İlan silinirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
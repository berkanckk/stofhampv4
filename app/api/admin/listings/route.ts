import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
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

    // İsteğe bağlı filtreler için URL parametrelerini al
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId')
    const materialId = url.searchParams.get('materialId')
    const sellerId = url.searchParams.get('sellerId')
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 100

    // Filtre koşullarını oluştur
    const whereCondition: any = {}
    
    if (categoryId) {
      whereCondition.categoryId = categoryId
    }
    
    if (materialId) {
      whereCondition.materialId = materialId
    }
    
    if (sellerId) {
      whereCondition.sellerId = sellerId
    }

    // İlanları kategori, malzeme ve satıcı bilgileriyle birlikte getir
    const listings = await prisma.listing.findMany({
      where: whereCondition,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
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
            email: true
          }
        }
      }
    })

    // İlanları istemciye uygun formata dönüştür
    const formattedListings = listings.map(listing => ({
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
      categoryName: listing.category.name,
      materialId: listing.materialId,
      materialName: listing.material.name,
      sellerId: listing.sellerId,
      sellerName: listing.seller.name,
      sellerEmail: listing.seller.email
    }))

    return NextResponse.json({
      success: true,
      data: formattedListings
    })
  } catch (error) {
    console.error('Admin ilanları getirme hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'İlanlar getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
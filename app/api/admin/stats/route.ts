import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import prisma from '@/app/lib/prismadb' // Global prisma client kullan

// Yeni bir PrismaClient örneği oluşturmuyoruz, global olanı kullanıyoruz
// const prisma = new PrismaClient() - BU SATIRI KALDIRDIK

export async function GET() {
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

    // Tüm istatistikleri paralel olarak çekiyoruz
    const [
      totalUsers,
      totalListings,
      totalCategories,
      totalMaterials,
      usersByType,
      recentListings,
      listingsByCategory,
      listingsMonthly
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.category.count(),
      prisma.materialType.count(),
      prisma.user.groupBy({
        by: ['userType'],
        _count: {
          id: true
        }
      }),
      prisma.listing.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          seller: {
            select: {
              name: true
            }
          },
          category: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              listings: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      getListingsMonthly()
    ])

    // Son 12 ayın ilan sayılarını hazırla
    const formattedListingsMonthly = listingsMonthly.map(item => ({
      month: item.month,
      year: item.year,
      count: item.count
    }))

    // Kategori bazında ilan sayılarını hazırla
    const formattedListingsByCategory = listingsByCategory.map(category => ({
      id: category.id,
      name: category.name,
      count: category._count.listings
    }))

    // Kullanıcı tipine göre sayıları hazırla
    const userTypeCounts = {
      ADMIN: 0,
      PERSONAL: 0,
      BUSINESS: 0
    }
    
    usersByType.forEach(item => {
      if (item.userType in userTypeCounts) {
        userTypeCounts[item.userType as keyof typeof userTypeCounts] = item._count.id
      }
    })

    // Son ilanları düzenle
    const formattedRecentListings = recentListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      sellerName: listing.seller.name,
      categoryName: listing.category.name,
      createdAt: listing.createdAt
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalListings,
        totalCategories,
        totalMaterials,
        userTypeCounts,
        recentListings: formattedRecentListings,
        listingsByCategory: formattedListingsByCategory,
        listingsMonthly: formattedListingsMonthly
      }
    })
  } catch (error) {
    console.error('İstatistik alma hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'İstatistikler alınırken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

// Son 12 ayın ilan istatistiklerini getir
async function getListingsMonthly() {
  const now = new Date()
  const monthlyStats = []
  
  try {
    // Daha verimli bir sorgu ile son 12 ayın verilerini almak
    const lastYear = new Date(now)
    lastYear.setMonth(now.getMonth() - 11)
    lastYear.setDate(1)
    lastYear.setHours(0, 0, 0, 0)
    
    // Tüm son 12 aydaki ilanları tek sorguda getir
    const listings = await prisma.listing.findMany({
      where: {
        createdAt: {
          gte: lastYear
        }
      },
      select: {
        createdAt: true
      }
    })
    
    // İlanları aylara göre gruplandır
    const groupedByMonth: Record<string, number> = {}
    for (let i = 0; i < 12; i++) {
      const targetMonth = new Date(now)
      targetMonth.setMonth(now.getMonth() - i)
      
      const year = targetMonth.getFullYear()
      const month = targetMonth.getMonth() + 1
      
      const key = `${year}-${month}`
      groupedByMonth[key] = 0
    }
    
    // Her ilanı ilgili aya ekle
    listings.forEach(listing => {
      const date = new Date(listing.createdAt)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month}`
      
      if (key in groupedByMonth) {
        groupedByMonth[key]++
      }
    })
    
    // Sonuçları diziye dönüştür
    for (const key in groupedByMonth) {
      const [year, month] = key.split('-')
      monthlyStats.push({
        year: parseInt(year),
        month: parseInt(month),
        count: groupedByMonth[key]
      })
    }
    
    // En eski aydan en yeni aya doğru sırala
    return monthlyStats.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  } catch (error) {
    console.error('Aylık istatistik hatası:', error)
    return [] // Hata durumunda boş dizi dön
  }
} 
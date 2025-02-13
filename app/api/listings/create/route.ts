import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/options'
import { invalidateListingsCache } from '../route'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }, { status: 401 })
    }

    const body = await request.json()
    
    // İlan son kullanma tarihini ayarla (30 gün)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Yeni ilanı oluştur
    const listing = await prisma.listing.create({
      data: {
        ...body,
        sellerId: session.user.id,
        expiresAt
      }
    })

    // İlan listesi cache'ini temizle
    invalidateListingsCache()

    return NextResponse.json({
      success: true,
      data: listing
    })

  } catch (error) {
    console.error('Create listing error:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'İlan oluşturulurken bir hata oluştu'
    }, { status: 500 })
  }
} 
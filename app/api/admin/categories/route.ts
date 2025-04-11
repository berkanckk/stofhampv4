import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

const prisma = new PrismaClient()

// Yeni kategori oluşturma
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Kategori adı zorunludur'
      }, { status: 400 })
    }

    // İsimde kategori var mı kontrol et
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    })

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut'
      }, { status: 400 })
    }

    // Yeni kategori oluştur
    const newCategory = await prisma.category.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      category: newCategory
    }, { status: 201 })
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error)
    return NextResponse.json({
      success: false,
      message: 'Kategori oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
} 
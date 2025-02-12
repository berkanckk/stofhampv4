import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Veritabanı bağlantısını test et
    await prisma.$connect()
    console.log('Veritabanı bağlantısı başarılı')

    // Test verisi oluştur
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'test123',
        userType: 'PERSONAL'
      }
    })

    console.log('Test kullanıcısı oluşturuldu:', testUser)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Veritabanı bağlantısı ve test başarılı',
        testUser
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Test sırasında hata:', error instanceof Error ? error.message : 'Bilinmeyen hata')
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Test sırasında hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
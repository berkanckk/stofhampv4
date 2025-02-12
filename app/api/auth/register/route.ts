import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    console.log('Register API çağrıldı')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, email, password, phone, company, userType } = body

    if (!name || !email || !password) {
      console.log('Validasyon hatası:', { name, email, password: !!password })
      return new Response(
        JSON.stringify({ message: 'Ad, email ve şifre zorunludur' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Kullanıcı kontrolü yapılıyor:', email)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('Email zaten kullanımda:', email)
      return new Response(
        JSON.stringify({ message: 'Bu email adresi zaten kullanılıyor' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Şifre hashleniyor')
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('Kullanıcı oluşturuluyor')
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        company: company || null,
        userType: userType || 'PERSONAL',
      },
    })

    console.log('Kullanıcı başarıyla oluşturuldu:', user.id)
    const { password: _, ...userWithoutPassword } = user

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Kayıt başarılı', 
        user: userWithoutPassword 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Kayıt hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata')

    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Kayıt sırasında bir hata oluştu',
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
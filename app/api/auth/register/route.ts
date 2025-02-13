import prisma from '@/app/lib/prismadb'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, company, userType } = body

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ message: 'Ad, email ve şifre zorunludur' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Bu email adresi zaten kullanılıyor' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Kayıt işlemi sırasında bir hata oluştu' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 
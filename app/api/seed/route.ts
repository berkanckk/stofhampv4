import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Metal', description: 'Metal ve metal alaşımları' },
  { name: 'Plastik', description: 'Her türlü plastik malzeme' },
  { name: 'Ahşap', description: 'Ahşap ve ahşap türevleri' },
  { name: 'Tekstil', description: 'Kumaş ve tekstil ürünleri' },
  { name: 'Kağıt', description: 'Kağıt ve karton ürünler' },
]

const materialTypes = [
  { name: 'Çelik', description: 'Çelik ve çelik alaşımları' },
  { name: 'Alüminyum', description: 'Alüminyum ve alaşımları' },
  { name: 'PVC', description: 'Polivinil klorür malzemeler' },
  { name: 'PP', description: 'Polipropilen malzemeler' },
  { name: 'MDF', description: 'Orta yoğunluklu lif levha' },
  { name: 'Sunta', description: 'Yonga levha' },
  { name: 'Pamuk', description: 'Pamuklu kumaşlar' },
  { name: 'Polyester', description: 'Polyester kumaşlar' },
]

export async function GET() {
  try {
    // Önce veritabanı bağlantısını kontrol et
    await prisma.$connect()

    // Kategorileri ekle
    const addedCategories = await Promise.all(
      categories.map(category =>
        prisma.category.upsert({
          where: { name: category.name },
          update: {},
          create: category,
        })
      )
    )

    // Malzeme tiplerini ekle
    const addedMaterials = await Promise.all(
      materialTypes.map(material =>
        prisma.materialType.upsert({
          where: { name: material.name },
          update: {},
          create: material,
        })
      )
    )

    return Response.json({
      success: true,
      message: 'Örnek veriler başarıyla eklendi',
      data: {
        categories: addedCategories.length,
        materialTypes: addedMaterials.length,
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'Örnek veriler eklenirken bir hata oluştu'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
} 
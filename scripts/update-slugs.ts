import prisma from '../app/lib/prismadb'
import { generateSlug } from '../app/lib/utils'

async function updateSlugs() {
  try {
    console.log('Slug güncelleme işlemi başlatılıyor...')

    // Tüm ilanları al
    const listings = await prisma.listing.findMany()
    console.log(`${listings.length} ilan bulundu.`)

    // Her ilan için slug oluştur ve güncelle
    for (const listing of listings) {
      let slug = generateSlug(listing.title)
      let slugExists = true
      let slugCounter = 1

      // Eğer slug zaten varsa sonuna sayı ekle
      while (slugExists) {
        const existingListing = await prisma.listing.findFirst({
          where: { 
            slug: slugCounter > 1 ? `${slug}-${slugCounter}` : slug,
            id: { not: listing.id } // Kendi ID'si hariç kontrol et
          }
        })

        if (!existingListing) {
          slugExists = false
          if (slugCounter > 1) {
            slug = `${slug}-${slugCounter}`
          }
        } else {
          slugCounter++
        }
      }

      // İlanı güncelle
      await prisma.listing.update({
        where: { id: listing.id },
        data: { slug }
      })

      console.log(`İlan güncellendi: "${listing.title}" -> "${slug}"`)
    }

    console.log('Tüm ilanların slug\'ları başarıyla güncellendi!')
  } catch (error) {
    console.error('Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Scripti çalıştır
updateSlugs() 
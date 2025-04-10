// İzolasyon kategorisi ve malzemelerini düzeltme script'i
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('İzolasyon kategorisi ve malzemeleri düzeltiliyor...');

  // İzolasyon kategorisini kontrol et ve ekle
  let izolasyonCategory = await prisma.category.findFirst({
    where: { name: 'İzolasyon' }
  });

  if (!izolasyonCategory) {
    izolasyonCategory = await prisma.category.create({
      data: {
        name: 'İzolasyon',
        description: 'İzolasyon malzemeleri'
      }
    });
    console.log('İzolasyon kategorisi eklendi');
  } else {
    console.log('İzolasyon kategorisi zaten mevcut');
  }

  // İzolasyon malzemelerini ekle
  const izolasyonMaterials = [
    'Taş Yünü',
    'XPS',
    'EPS',
    'Reflektif İzolasyon',
    'Elastomerik Kauçuk',
    'Camyünü',
    'Poliüretan Köpük',
    'Polietilen Köpük',
    'Seramik Yünü',
    'Membran'
  ];

  for (const materialName of izolasyonMaterials) {
    // Malzemenin mevcut olup olmadığını kontrol et
    const existingMaterial = await prisma.materialType.findFirst({
      where: { name: materialName }
    });

    if (!existingMaterial) {
      await prisma.materialType.create({
        data: {
          name: materialName,
          categoryId: izolasyonCategory.id
        }
      });
      console.log(`Yeni izolasyon malzemesi eklendi: ${materialName}`);
    } else {
      await prisma.materialType.update({
        where: { id: existingMaterial.id },
        data: { categoryId: izolasyonCategory.id }
      });
      console.log(`İzolasyon malzemesi güncellendi: ${materialName}`);
    }
  }

  console.log('İzolasyon kategorisi ve malzemeleri başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
// Bu script kategorileri eklemek için kullanılır
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Eklenecek kategoriler
  const categories = [
    { name: 'Ahşap', description: 'Ahşap ve ahşap türevi ürünler' },
    { name: 'Metal', description: 'Metal ve metal alaşımları' },
    { name: 'Plastik', description: 'Plastik ve polimer malzemeler' },
    { name: 'Cam', description: 'Cam ve cam türevi ürünler' },
    { name: 'Taş', description: 'Doğal ve yapay taş ürünleri' },
    { name: 'Kumaş', description: 'Kumaş, deri ve tekstil ürünleri' },
    { name: 'Elektronik', description: 'Elektronik parçalar ve komponentler' },
    { name: 'Kağıt', description: 'Kağıt ve kağıt türevi ürünler' },
    { name: 'Seramik', description: 'Seramik ve porselen ürünler' },
    { name: 'Diğer', description: 'Diğer kategorilere uymayan malzemeler' }
  ];

  // Her bir kategoriyi ekle veya güncelle
  for (const category of categories) {
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: category
      });
      console.log(`Yeni kategori eklendi: ${category.name}`);
    } else {
      await prisma.category.update({
        where: { id: existingCategory.id },
        data: category
      });
      console.log(`Kategori güncellendi: ${category.name}`);
    }
  }

  console.log('Kategoriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
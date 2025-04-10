// Bu script malzeme tipleri ve kategorileri arasındaki ilişkiyi güncellemek için kullanılır
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Kategorileri al
  const categories = await prisma.category.findMany();
  
  if (categories.length === 0) {
    console.log('Önce kategorileri eklemelisiniz');
    return;
  }

  // Kategori ID'lerini daha kolay erişim için bir haritaya ekleyelim
  const categoryMap = categories.reduce((map, category) => {
    map[category.name.toLowerCase()] = category.id;
    return map;
  }, {});

  // İlişkilendirilecek malzeme tipleri ve kategorileri
  const materialCategoryMappings = [
    // Ahşap kategorisi
    { materialName: 'Meşe', categoryName: 'ahşap' },
    { materialName: 'Çam', categoryName: 'ahşap' },
    { materialName: 'Ceviz', categoryName: 'ahşap' },
    { materialName: 'Kayın', categoryName: 'ahşap' },
    { materialName: 'Ladin', categoryName: 'ahşap' },
    { materialName: 'MDF', categoryName: 'ahşap' },
    { materialName: 'Kontrplak', categoryName: 'ahşap' },
    { materialName: 'Sunta', categoryName: 'ahşap' },
    
    // Metal kategorisi
    { materialName: 'Demir', categoryName: 'metal' },
    { materialName: 'Alüminyum', categoryName: 'metal' },
    { materialName: 'Çelik', categoryName: 'metal' },
    { materialName: 'Bakır', categoryName: 'metal' },
    { materialName: 'Pirinç', categoryName: 'metal' },
    { materialName: 'Paslanmaz Çelik', categoryName: 'metal' },
    
    // Plastik kategorisi
    { materialName: 'PVC', categoryName: 'plastik' },
    { materialName: 'Polietilen', categoryName: 'plastik' },
    { materialName: 'Polikarbonat', categoryName: 'plastik' },
    { materialName: 'ABS', categoryName: 'plastik' },
    
    // Cam kategorisi
    { materialName: 'Düz Cam', categoryName: 'cam' },
    { materialName: 'Temperli Cam', categoryName: 'cam' },
    { materialName: 'Ayna', categoryName: 'cam' },
    { materialName: 'Lamine Cam', categoryName: 'cam' },
    
    // Taş kategorisi
    { materialName: 'Mermer', categoryName: 'taş' },
    { materialName: 'Granit', categoryName: 'taş' },
    { materialName: 'Traverten', categoryName: 'taş' },
    { materialName: 'Doğal Taş', categoryName: 'taş' },
    
    // Kumaş kategorisi
    { materialName: 'Pamuk', categoryName: 'kumaş' },
    { materialName: 'Keten', categoryName: 'kumaş' },
    { materialName: 'Kadife', categoryName: 'kumaş' },
    { materialName: 'Yün', categoryName: 'kumaş' },
    { materialName: 'Polyester', categoryName: 'kumaş' },
    { materialName: 'Deri', categoryName: 'kumaş' },
    { materialName: 'Suni Deri', categoryName: 'kumaş' },
  ];

  // Her bir malzeme tipini veritabanında ara ve kategori ID'sini güncelle
  for (const mapping of materialCategoryMappings) {
    const material = await prisma.materialType.findFirst({
      where: { name: mapping.materialName }
    });

    if (!material) {
      // Eğer malzeme veritabanında yoksa, ekle
      await prisma.materialType.create({
        data: {
          name: mapping.materialName,
          categoryId: categoryMap[mapping.categoryName.toLowerCase()]
        }
      });
      console.log(`Yeni malzeme eklendi: ${mapping.materialName}`);
    } else {
      // Eğer malzeme zaten varsa, kategori bilgisini güncelle
      await prisma.materialType.update({
        where: { id: material.id },
        data: { categoryId: categoryMap[mapping.categoryName.toLowerCase()] }
      });
      console.log(`Malzeme güncellendi: ${mapping.materialName}`);
    }
  }

  console.log('Malzeme tipleri başarıyla güncellendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
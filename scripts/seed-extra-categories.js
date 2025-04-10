// Bu script daha fazla kategori ve malzeme tipi eklemek için kullanılır
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Yeni kategoriler ve malzeme tipleri ekleniyor...');

  // Yeni kategoriler
  const newCategories = [
    { name: 'Kompozit', description: 'Kompozit malzemeler ve karışımlar' },
    { name: 'Seramik', description: 'Seramik ve porselen ürünler' },
    { name: 'Beton', description: 'Beton ve çimento bazlı ürünler' },
    { name: 'Cam Elyaf', description: 'Cam elyaf malzemeler' },
    { name: 'Kauçuk', description: 'Kauçuk ve lastik malzemeler' },
    { name: 'İzolasyon', description: 'İzolasyon malzemeleri' },
    { name: 'Elektronik', description: 'Elektronik komponentler' },
    { name: 'Alçı', description: 'Alçı ve alçıpan malzemeler' },
    { name: 'Mermer', description: 'Mermer ve doğal taş ürünleri' },
    { name: 'Boya', description: 'Boya, vernik ve kaplama malzemeleri' }
  ];

  // Yeni kategorileri ekle
  const categoryMap = {};
  for (const category of newCategories) {
    // Eğer kategori zaten varsa güncelle, yoksa ekle
    const existingCategory = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existingCategory) {
      const newCategory = await prisma.category.create({
        data: category
      });
      console.log(`Yeni kategori eklendi: ${category.name}`);
      categoryMap[category.name.toLowerCase()] = newCategory.id;
    } else {
      console.log(`Kategori zaten mevcut: ${category.name}`);
      categoryMap[category.name.toLowerCase()] = existingCategory.id;
    }
  }

  // Mevcut kategorileri de haritaya ekle
  const existingCategories = await prisma.category.findMany();
  for (const category of existingCategories) {
    if (!categoryMap[category.name.toLowerCase()]) {
      categoryMap[category.name.toLowerCase()] = category.id;
    }
  }

  // Yeni malzeme tipleri
  const newMaterialMappings = [
    // Kompozit kategorisi
    { materialName: 'Karbon Fiber', categoryName: 'kompozit' },
    { materialName: 'Cam Fiber Takviyeli Plastik', categoryName: 'kompozit' },
    { materialName: 'Kevlar', categoryName: 'kompozit' },
    { materialName: 'Aramid Elyaf', categoryName: 'kompozit' },
    { materialName: 'Metal Matrisli Kompozit', categoryName: 'kompozit' },
    
    // Seramik kategorisi
    { materialName: 'Porselen', categoryName: 'seramik' },
    { materialName: 'Stoneware', categoryName: 'seramik' },
    { materialName: 'Fayans', categoryName: 'seramik' },
    { materialName: 'Karo', categoryName: 'seramik' },
    { materialName: 'Vitrifiye', categoryName: 'seramik' },
    
    // Beton kategorisi
    { materialName: 'Normal Beton', categoryName: 'beton' },
    { materialName: 'Hafif Beton', categoryName: 'beton' },
    { materialName: 'Fiber Beton', categoryName: 'beton' },
    { materialName: 'Yüksek Dayanımlı Beton', categoryName: 'beton' },
    { materialName: 'Dekoratif Beton', categoryName: 'beton' },
    
    // Cam Elyaf kategorisi
    { materialName: 'E-Glass', categoryName: 'cam elyaf' },
    { materialName: 'S-Glass', categoryName: 'cam elyaf' },
    { materialName: 'Cam Yünü', categoryName: 'cam elyaf' },
    { materialName: 'Dokuma Cam Elyaf', categoryName: 'cam elyaf' },
    { materialName: 'Keçe Cam Elyaf', categoryName: 'cam elyaf' },
    
    // Kauçuk kategorisi
    { materialName: 'Doğal Kauçuk', categoryName: 'kauçuk' },
    { materialName: 'SBR Kauçuk', categoryName: 'kauçuk' },
    { materialName: 'EPDM Kauçuk', categoryName: 'kauçuk' },
    { materialName: 'Silikon Kauçuk', categoryName: 'kauçuk' },
    { materialName: 'Neopren', categoryName: 'kauçuk' },
    
    // İzolasyon kategorisi
    { materialName: 'Taş Yünü', categoryName: 'izolasyon' },
    { materialName: 'XPS', categoryName: 'izolasyon' },
    { materialName: 'EPS', categoryName: 'izolasyon' },
    { materialName: 'Reflektif İzolasyon', categoryName: 'izolasyon' },
    { materialName: 'Elastomerik Kauçuk', categoryName: 'izolasyon' },
    
    // Elektronik kategorisi
    { materialName: 'PCB', categoryName: 'elektronik' },
    { materialName: 'Sensör', categoryName: 'elektronik' },
    { materialName: 'LED', categoryName: 'elektronik' },
    { materialName: 'Kablo', categoryName: 'elektronik' },
    { materialName: 'Mikroişlemci', categoryName: 'elektronik' },
    
    // Alçı kategorisi
    { materialName: 'Sıva Alçısı', categoryName: 'alçı' },
    { materialName: 'Alçıpan', categoryName: 'alçı' },
    { materialName: 'Kartonpiyer', categoryName: 'alçı' },
    { materialName: 'Saten Alçı', categoryName: 'alçı' },
    { materialName: 'Dekoratif Alçı', categoryName: 'alçı' },
    
    // Mermer kategorisi
    { materialName: 'Beyaz Mermer', categoryName: 'mermer' },
    { materialName: 'Siyah Mermer', categoryName: 'mermer' },
    { materialName: 'Traverten', categoryName: 'mermer' },
    { materialName: 'Oniks', categoryName: 'mermer' },
    { materialName: 'Kuvars', categoryName: 'mermer' },
    
    // Boya kategorisi
    { materialName: 'Akrilik Boya', categoryName: 'boya' },
    { materialName: 'Silikon Boya', categoryName: 'boya' },
    { materialName: 'Epoksi Boya', categoryName: 'boya' },
    { materialName: 'Selülozik Boya', categoryName: 'boya' },
    { materialName: 'Antipas', categoryName: 'boya' },
    
    // Ahşap kategorisine ekstra malzemeler
    { materialName: 'Masif Ahşap', categoryName: 'ahşap' },
    { materialName: 'OSB', categoryName: 'ahşap' },
    { materialName: 'Wenge', categoryName: 'ahşap' },
    { materialName: 'Iroko', categoryName: 'ahşap' },
    { materialName: 'Bambu', categoryName: 'ahşap' },
    
    // Metal kategorisine ekstra malzemeler
    { materialName: 'Paslanmaz Çelik 304', categoryName: 'metal' },
    { materialName: 'Paslanmaz Çelik 316', categoryName: 'metal' },
    { materialName: 'Galvanizli Sac', categoryName: 'metal' },
    { materialName: 'Dökme Demir', categoryName: 'metal' },
    { materialName: 'Titanyum', categoryName: 'metal' },
    
    // Cam kategorisine ekstra malzemeler
    { materialName: 'Isıcam', categoryName: 'cam' },
    { materialName: 'Bombeli Cam', categoryName: 'cam' },
    { materialName: 'Reflekte Cam', categoryName: 'cam' },
    { materialName: 'Float Cam', categoryName: 'cam' },
    { materialName: 'Buzlu Cam', categoryName: 'cam' },
    
    // Plastik kategorisine ekstra malzemeler
    { materialName: 'PMMA (Akrilik)', categoryName: 'plastik' },
    { materialName: 'Poliamid (Naylon)', categoryName: 'plastik' },
    { materialName: 'PTFE (Teflon)', categoryName: 'plastik' },
    { materialName: 'TPU', categoryName: 'plastik' },
    { materialName: 'PS (Polistiren)', categoryName: 'plastik' }
  ];

  // Yeni malzeme tiplerini ekle
  for (const mapping of newMaterialMappings) {
    const categoryId = categoryMap[mapping.categoryName.toLowerCase()];
    
    if (!categoryId) {
      console.log(`Uyarı: '${mapping.categoryName}' kategorisi bulunamadı. '${mapping.materialName}' malzemesi eklenemedi.`);
      continue;
    }
    
    // Eğer malzeme zaten varsa güncelle, yoksa ekle
    const existingMaterial = await prisma.materialType.findFirst({
      where: { name: mapping.materialName }
    });

    if (!existingMaterial) {
      await prisma.materialType.create({
        data: {
          name: mapping.materialName,
          categoryId: categoryId
        }
      });
      console.log(`Yeni malzeme eklendi: ${mapping.materialName} (${mapping.categoryName})`);
    } else {
      await prisma.materialType.update({
        where: { id: existingMaterial.id },
        data: { categoryId: categoryId }
      });
      console.log(`Malzeme güncellendi: ${mapping.materialName} (${mapping.categoryName})`);
    }
  }

  console.log('Yeni kategoriler ve malzeme tipleri başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
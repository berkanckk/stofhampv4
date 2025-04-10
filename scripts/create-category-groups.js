// Bu script kategorileri ana gruplara ayırmak için kullanılır
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Kategori grupları oluşturuluyor...');

  // Önce category_group tablosunu oluşturmak gerekiyor
  // Bu işlem prisma/schema.prisma dosyasında yapılmalı ve migrate edilmeli
  
  // Ana kategori grupları
  const categoryGroups = [
    { name: 'Yapı Malzemeleri', description: 'İnşaat ve yapı için temel malzemeler', order: 1 },
    { name: 'Metal ve Alaşımlar', description: 'Metal türleri ve alaşımlar', order: 2 },
    { name: 'Ahşap ve Orman Ürünleri', description: 'Ahşap ve ahşap bazlı ürünler', order: 3 },
    { name: 'Cam ve Seramik', description: 'Cam ve seramik ürünleri', order: 4 },
    { name: 'Yalıtım ve İzolasyon', description: 'Yalıtım ve izolasyon malzemeleri', order: 5 }, 
    { name: 'Plastik ve Polimer', description: 'Plastik ve polimer bazlı malzemeler', order: 6 },
    { name: 'Tekstil ve Kumaş', description: 'Tekstil ve kumaş ürünleri', order: 7 },
    { name: 'Elektronik ve Elektrik', description: 'Elektronik ve elektrik malzemeleri', order: 8 },
    { name: 'Diğer Malzemeler', description: 'Diğer tüm malzeme türleri', order: 9 }
  ];

  // Kategorileri gruplara eşleştirme
  const categoryGroupMappings = {
    'Ahşap': 'Ahşap ve Orman Ürünleri',
    'Metal': 'Metal ve Alaşımlar',
    'Cam': 'Cam ve Seramik',
    'Plastik': 'Plastik ve Polimer',
    'Kağıt': 'Diğer Malzemeler',
    'Kumaş': 'Tekstil ve Kumaş',
    'Tekstil': 'Tekstil ve Kumaş',
    'Kompozit': 'Diğer Malzemeler',
    'Seramik': 'Cam ve Seramik',
    'Beton': 'Yapı Malzemeleri',
    'Cam Elyaf': 'Yapı Malzemeleri',
    'Kauçuk': 'Plastik ve Polimer',
    'İzolasyon': 'Yalıtım ve İzolasyon',
    'Elektronik': 'Elektronik ve Elektrik',
    'Alçı': 'Yapı Malzemeleri',
    'Mermer': 'Yapı Malzemeleri',
    'Boya': 'Yapı Malzemeleri',
    'Taş': 'Yapı Malzemeleri'
  };

  console.log('Bu script kategori grupları yaratmak için bir örnek olarak hazırlanmıştır.');
  console.log('Prisma şemanızda CategoryGroup model\'i oluşturmanız gerekiyor:');
  console.log(`
model CategoryGroup {
  id           String     @id @default(uuid())
  name         String     @unique
  description  String?
  order        Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  categories   Category[]
}

model Category {
  id             String         @id @default(uuid())
  name           String         @unique
  description    String?
  groupId        String?
  group          CategoryGroup? @relation(fields: [groupId], references: [id])
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  listings       Listing[]
  materialTypes  MaterialType[]
}
  `);

  console.log('\nŞema güncellendikten sonra bu scripti güncelleyerek çalıştırabilirsiniz.');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Bağlantı havuzunu optimize etmek için yapılandırma
const client = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Eşzamanlı bağlantı sayısını sınırlandırma
  __internal: {
    engine: {
      connectionLimit: 5 // Eşzamanlı bağlantı sayısını sınırla
    }
  }
})

// Geliştirme ortamında global nesneye atama (Hot Reloading için)
// Üretim ortamında her istek için yeni Prisma Client örneği oluşturmayı önler
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = client
}

export default client 
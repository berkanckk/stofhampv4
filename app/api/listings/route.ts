import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { Prisma } from '@prisma/client'
import { globalCache } from '@/app/lib/cache'
import { generateSlug } from '@/app/lib/utils'

const ITEMS_PER_PAGE = 9
const CACHE_TTL = 60 * 1000 // 1 dakika
const CACHE_KEYS = {
  CATEGORIES: 'categories',
  MATERIALS: 'materials',
  LISTINGS: 'listings',
}

// Cache key oluşturma fonksiyonu
function generateListingsCacheKey(params: URLSearchParams): string {
  const page = params.get('page') || '1'
  const sortBy = params.get('sortBy') || 'newest'
  const category = params.get('category') || ''
  const material = params.get('material') || ''
  const condition = params.get('condition') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const search = params.get('search') || ''
  const location = params.get('location') || ''

  return `${CACHE_KEYS.LISTINGS}_${page}_${sortBy}_${category}_${material}_${condition}_${minPrice}_${maxPrice}_${search}_${location}`
}

export async function GET(request: Request) {
  try {
    await prisma.$connect()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const cursor = searchParams.get('cursor')
    const sortBy = searchParams.get('sortBy') || 'newest'
    
    const filters = {
      category: searchParams.get('category'),
      material: searchParams.get('material'),
      condition: searchParams.get('condition'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      search: searchParams.get('search'),
      location: searchParams.get('location'),
      altTerms: searchParams.get('altTerms')
    }

    console.log('Search parameters:', { page, sortBy, ...filters })

    // Cache'den kategorileri ve materyalleri al
    let categories = globalCache.get(CACHE_KEYS.CATEGORIES)
    let materialTypes = globalCache.get(CACHE_KEYS.MATERIALS)

    // Cache'de yoksa veritabanından al ve cache'e kaydet
    if (!categories || !materialTypes) {
      [categories, materialTypes] = await Promise.all([
        prisma.category.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { listings: true }
            }
          }
        }),
        prisma.materialType.findMany({
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { listings: true }
            }
          }
        })
      ])

      globalCache.set(CACHE_KEYS.CATEGORIES, categories)
      globalCache.set(CACHE_KEYS.MATERIALS, materialTypes)
    }

    // Composite cache key oluştur
    const compositeKey = {
      page,
      sortBy,
      filters
    }
    
    // Cache'den ilanları kontrol et
    let cachedData = globalCache.getComposite(CACHE_KEYS.LISTINGS, compositeKey)
    
    if (cachedData) {
      console.log('Listings fetched from cache')
      return NextResponse.json({
        success: true,
        data: {
          ...cachedData,
          categories,
          materialTypes
        }
      })
    }

    // Sıralama parametrelerini ayarla
    const orderBy: Prisma.ListingOrderByWithRelationInput = {}

    if (sortBy === 'oldest') {
      orderBy.createdAt = 'asc'
    } else if (sortBy === 'priceDesc') {
      orderBy.price = 'desc' // En yüksek fiyattan en düşüğe
    } else if (sortBy === 'priceAsc') {
      orderBy.price = 'asc' // En düşük fiyattan en yükseğe
    } else {
      // default: newest
      orderBy.createdAt = 'desc'
    }

    // Filtreleme koşullarını oluştur
    const where: Prisma.ListingWhereInput = {}

    if (filters.category) {
      console.log('Filtreleniyor - Kategori:', filters.category);
      where.categoryId = filters.category;
    }
    
    if (filters.material) {
      console.log('Filtreleniyor - Malzeme:', filters.material);
      where.materialId = filters.material;
    }
    
    if (filters.condition) {
      console.log('Filtreleniyor - Durumu:', filters.condition);
      where.condition = filters.condition as 'NEW' | 'USED';
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice && { gte: parseFloat(filters.minPrice) }),
        ...(filters.maxPrice && { lte: parseFloat(filters.maxPrice) })
      }
      console.log('Filtreleniyor - Fiyat:', where.price);
    }

    if (filters.search) {
      const searchTerm = filters.search.trim();
      
      // Türkçe karakterler için normalize edilmiş arama terimleri oluştur
      const normalizedSearchTerms = normalizeSearchTerms(searchTerm);
      
      // Kullanıcının gönderdiği alternatif terimleri de ekle
      if (filters.altTerms) {
        const altTerms = filters.altTerms.split(',').map(term => term.trim());
        console.log('Alternatif arama terimleri:', altTerms);
        normalizedSearchTerms.push(...altTerms);
      }
      
      where.OR = [
        ...normalizedSearchTerms.map(term => ({
          title: { contains: term, mode: 'insensitive' as Prisma.QueryMode }
        })),
        ...normalizedSearchTerms.map(term => ({
          description: { contains: term, mode: 'insensitive' as Prisma.QueryMode }
        }))
      ];
      
      // Arama terimi içinde boşluk varsa her bir kelimeyi ayrı ayrı da ara
      if (searchTerm.includes(' ')) {
        const words = searchTerm.split(/\s+/);
        where.OR.push(
          ...words.flatMap(word => {
            const normalizedWords = normalizeSearchTerms(word);
            return [
              ...normalizedWords.map(term => ({
                title: { contains: term, mode: 'insensitive' as Prisma.QueryMode }
              })),
              ...normalizedWords.map(term => ({
                description: { contains: term, mode: 'insensitive' as Prisma.QueryMode }
              }))
            ];
          })
        );
      }
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' }
    }

    console.log('Query conditions:', { where, orderBy })

    // İlanları ve toplam sayıyı paralel olarak al
    const [items, totalItems] = await Promise.all([
      prisma.listing.findMany({
        where,
        take: ITEMS_PER_PAGE,
        skip: (page - 1) * ITEMS_PER_PAGE,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              company: true,
              profileImage: true
            }
          },
          category: true,
          material: true,
          _count: {
            select: { favorites: true }
          }
        }
      }),
      prisma.listing.count({ where })
    ])

    console.log(`Found ${items.length} items out of ${totalItems} total`)

    // Pagination bilgilerini hesapla
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
    const hasNextPage = items.length === ITEMS_PER_PAGE
    const nextCursor = hasNextPage ? items[items.length - 1].id : null

    const responseData = {
      items,
      pagination: {
        totalItems,
        itemsPerPage: ITEMS_PER_PAGE,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage: page > 1,
        nextCursor
      }
    }

    console.log(`Sayfalama bilgileri: Sayfa ${page}/${totalPages}, Toplam öğe: ${totalItems}, Sayfa başına: ${ITEMS_PER_PAGE}`)

    // Composite cache'e kaydet
    globalCache.setComposite(CACHE_KEYS.LISTINGS, compositeKey, responseData)

    return NextResponse.json({
      success: true,
      data: {
        ...responseData,
        categories,
        materialTypes
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, {
      status: error instanceof Prisma.PrismaClientKnownRequestError ? 400 : 500
    })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Oturum açmanız gerekiyor'
      }, { status: 401 })
    }

    const body = await request.json()
    
    // İlan son kullanma tarihini ayarla (30 gün)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Yeni ilanı oluştur
    const listing = await prisma.listing.create({
      data: {
        ...body,
        sellerId: session.user.id,
        expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      data: listing
    })

  } catch (error) {
    console.error('Create listing error:', error)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'İlan oluşturulurken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, {
      status: error instanceof Prisma.PrismaClientKnownRequestError ? 400 : 500
    })
  } finally {
    await prisma.$disconnect()
  }
}

// İlan oluşturulduğunda veya güncellendiğinde tüm cache'i temizle
export function invalidateListingsCache() {
  const keys = globalCache.keys()
  keys.forEach(key => {
    if (key.startsWith(CACHE_KEYS.LISTINGS)) {
      globalCache.invalidate(key)
    }
  })
}

// Türkçe karakterleri normalize eden ve arama alternatiflerini oluşturan yardımcı fonksiyon
function normalizeSearchTerms(term: string): string[] {
  const result = [term];
  
  // Türkçe karakter çiftleri
  const characterPairs = {
    'i': 'ı', 'ı': 'i',
    'o': 'ö', 'ö': 'o',
    'u': 'ü', 'ü': 'u',
    's': 'ş', 'ş': 's',
    'c': 'ç', 'ç': 'c',
    'g': 'ğ', 'ğ': 'g'
  };
  
  // Ana terimin harflerini tek tek kontrol et ve alternatifler oluştur
  const normalizedTerm = term.toLowerCase();
  result.push(normalizedTerm);
  
  for (const [char, replacement] of Object.entries(characterPairs)) {
    if (normalizedTerm.includes(char)) {
      const altTerm = normalizedTerm.replace(new RegExp(char, 'g'), replacement);
      result.push(altTerm);
    }
  }
  
  // Türkçe yaygın son ekler
  const commonSuffixes = [
    'lar', 'ler', 'leri', 'ları', 'larını', 'lerini',
    'da', 'de', 'ta', 'te', 'dan', 'den', 'tan', 'ten',
    'in', 'ın', 'un', 'ün',
    'a', 'e', 'i', 'ı', 'u', 'ü',
    'ya', 'ye', 'yu', 'yü',
    'im', 'ım', 'um', 'üm',
    'imiz', 'ımız', 'umuz', 'ümüz',
    'iniz', 'ınız', 'unuz', 'ünüz',
    'ci', 'cı', 'cu', 'cü',
    'li', 'lı', 'lu', 'lü',
    'gi', 'gı', 'gu', 'gü',
    'ki', 'kı', 'ku', 'kü'
  ];

  // Türkçe yaygın ön ekler
  const commonPrefixes = ['bi', 'be'];
  
  // Terim bir son ek içeriyorsa, son ek olmadan da arama yap
  for (const suffix of commonSuffixes) {
    if (normalizedTerm.endsWith(suffix) && normalizedTerm.length > suffix.length + 2) {
      const baseForm = normalizedTerm.slice(0, -suffix.length);
      result.push(baseForm);
      
      // Base form + yaygın ekler kombinasyonları
      for (const otherSuffix of commonSuffixes) {
        if (otherSuffix !== suffix) {
          result.push(baseForm + otherSuffix);
        }
      }
    }
  }
  
  // Ön eki kontrol et
  for (const prefix of commonPrefixes) {
    if (normalizedTerm.startsWith(prefix) && normalizedTerm.length > prefix.length + 2) {
      result.push(normalizedTerm.slice(prefix.length));
    }
  }
  
  // Özgün kelime kökünü bulmaya çalış
  let possibleRootForm = normalizedTerm;
  let foundSuffix = false;
  
  // En uzun son ekleri önce kontrol et
  const sortedSuffixes = [...commonSuffixes].sort((a, b) => b.length - a.length);
  
  for (const suffix of sortedSuffixes) {
    if (possibleRootForm.endsWith(suffix) && possibleRootForm.length > suffix.length + 2) {
      possibleRootForm = possibleRootForm.slice(0, -suffix.length);
      foundSuffix = true;
      // Bir soneki bulduktan sonra devam etmeye gerek yok
      break;
    }
  }
  
  // Eğer kök bulunduysa ekle
  if (foundSuffix) {
    result.push(possibleRootForm);
  }
  
  // Son karakteri yumuşama/sertleşme hali için kontrol et (b->p, c->ç, d->t, g->ğ/k)
  const consonantPairs: Record<string, string> = {
    'b': 'p', 'p': 'b',
    'c': 'ç', 'ç': 'c',
    'd': 't', 't': 'd',
    'g': 'k', 'k': 'g'
  };
  
  for (const baseForm of [...result]) {
    if (baseForm.length >= 2) {
      const lastChar = baseForm.charAt(baseForm.length - 1);
      const replacement = consonantPairs[lastChar];
      
      if (replacement) {
        const altForm = baseForm.slice(0, -1) + replacement;
        result.push(altForm);
      }
    }
  }
  
  // Tekrarlanan terimleri kaldır
  return Array.from(new Set(result));
} 
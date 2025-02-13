import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { platform } = await request.json()
    const listingId = params.id

    // İlanı bul
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        description: true,
      }
    })

    if (!listing) {
      return Response.json(
        { success: false, message: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    const shareUrl = `${process.env.NEXTAUTH_URL}/listings/${listingId}`
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(listing.title)
    const encodedDescription = encodeURIComponent(listing.description)

    let shareLink = ''

    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
        break
      default:
        shareLink = shareUrl
    }

    return Response.json({
      success: true,
      data: {
        shareLink
      }
    })
  } catch (error) {
    console.error('Share listing error:', error)
    return Response.json(
      { success: false, message: 'İlan paylaşılırken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 
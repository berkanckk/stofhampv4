import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/app/lib/prismadb';
import { globalCache } from '@/app/lib/cache';

const MESSAGES_PER_PAGE = 20;

// Mesaj cache'ini temizle
export async function invalidateMessagesCache(conversationId: string) {
  const cacheKeys = globalCache.keys().filter(key => 
    key.startsWith(`messages_${conversationId}`)
  );
  
  cacheKeys.forEach(key => globalCache.invalidate(key));
}

// Mesajları getir
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz sohbet ID' },
        { status: 400 }
      );
    }

    // Kullanıcının bu sohbete erişim yetkisi var mı kontrol et
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: session.user.id
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Sohbet bulunamadı' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    
    // Cache key oluştur
    const cacheKey = {
      conversationId,
      page,
      limit: MESSAGES_PER_PAGE
    };

    // Cache'den kontrol et
    let messages = globalCache.getMessages(cacheKey);

    if (!messages) {
      // Veritabanından getir
      messages = await prisma.message.findMany({
        where: {
          conversationId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * MESSAGES_PER_PAGE,
        take: MESSAGES_PER_PAGE
      });

      // Cache'e kaydet
      globalCache.setMessages(cacheKey, messages);
    }

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, message: 'Mesajlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni mesaj gönder
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz sohbet ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Mesaj içeriği gerekli' },
        { status: 400 }
      );
    }

    // Sohbeti ve diğer kullanıcıyı bul
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      include: {
        users: true
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Sohbet bulunamadı' },
        { status: 404 }
      );
    }

    // Alıcıyı belirle (sohbetteki diğer kullanıcı)
    const receiver = conversation.users.find(user => user.id !== session.user.id);
    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'Alıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId: receiver.id,
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    // Cache'i temizle
    await invalidateMessagesCache(conversationId);

    return NextResponse.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, message: 'Mesaj gönderilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import prisma from '@/app/lib/prismadb';
import { invalidateMessagesCache } from '../../conversations/[id]/messages/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, message: 'conversationId gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcının bu sohbette olduğunu kontrol et
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

    // Mesajları okundu olarak işaretle
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Cache'i temizle
    await invalidateMessagesCache(conversationId);

    return NextResponse.json({
      success: true,
      message: 'Mesajlar okundu olarak işaretlendi'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return NextResponse.json(
      { success: false, message: 'Mesajlar okundu olarak işaretlenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 
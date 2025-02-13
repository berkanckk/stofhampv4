'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface User {
  id: string
  name: string
  profileImage: string | null
}

interface Listing {
  id: string
  title: string
  images: string[]
}

interface Message {
  id: string
  content: string
  createdAt: string
  isRead: boolean
  senderId: string
}

interface Conversation {
  id: string
  users: User[]
  listing: Listing | null
  messages: Message[]
  updatedAt: string
}

interface ExtendedSession {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function MessagesPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null }
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        console.log('Conversations data:', result.data)
        setConversations(result.data)
      } catch (error) {
        setError('Sohbetler yüklenirken bir hata oluştu')
        console.error('Fetch conversations error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchConversations()
    }
  }, [session])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mesajlarınızı görüntülemek için giriş yapın
            </h1>
            <Link
              href="/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Mesajlarım</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{conversations.length} aktif sohbet</span>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Henüz hiç mesajınız yok</p>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                İlanları Görüntüle
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const otherUser = conversation.users.find(
                  (user) => user.id !== session.user?.id
                )
                const lastMessage = conversation.messages[0]

                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10 cursor-pointer"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {otherUser?.profileImage ? (
                            <Image
                              src={otherUser.profileImage}
                              alt={otherUser.name}
                              fill
                              sizes="(max-width: 48px) 100vw, 48px"
                              className="rounded-full object-cover ring-2 ring-green-50"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center ring-2 ring-green-50">
                              <span className="text-green-700 text-lg font-medium">
                                {otherUser?.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {conversation.messages.some(m => !m.isRead && m.senderId !== session?.user?.id) && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce shadow-lg border-2 border-white">
                              {conversation.messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {otherUser?.name}
                            </h3>
                            <span className="text-sm text-gray-500 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {format(new Date(conversation.updatedAt), 'dd MMM yyyy', { locale: tr })}
                            </span>
                          </div>

                          {conversation.listing && (
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="truncate">{conversation.listing.title}</span>
                            </div>
                          )}

                          {lastMessage && (
                            <div className="flex items-center justify-between">
                              <p className={`text-sm truncate flex-1 ${
                                !lastMessage.isRead && lastMessage.senderId !== session?.user?.id
                                  ? 'font-semibold text-gray-900'
                                  : 'text-gray-500'
                              }`}>
                                <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                                {lastMessage.content}
                              </p>
                              {!lastMessage.isRead && lastMessage.senderId !== session?.user?.id && (
                                <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
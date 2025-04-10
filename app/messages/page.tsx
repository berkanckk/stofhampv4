'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { motion } from 'framer-motion'

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all')

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      console.log('Conversations data:', result.data)
      
      // Konuşmaları tarihe göre sırala (en son mesajlaşma en üstte)
      // Her zaman tarih kontrolünü yaparak sıralama
      const sortedConversations = [...result.data].sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        return dateB - dateA // Azalan sıralama (en yeni en üstte)
      })
      
      setConversations(sortedConversations)
    } catch (error) {
      setError('Sohbetler yüklenirken bir hata oluştu')
      console.error('Fetch conversations error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
      
      // Polling ile her 10 saniyede bir yeni mesajları kontrol et
      const intervalId = setInterval(() => {
        console.log('Yeni mesajlar kontrol ediliyor...')
        fetchConversations()
      }, 10000) // 10 saniye
      
      // Component unmount olduğunda interval'ı temizle
      return () => clearInterval(intervalId)
    }
  }, [session])

  // Okunmamış mesaj sayısını hesaplama
  const totalUnreadCount = conversations.reduce((total, conversation) => {
    return total + conversation.messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length
  }, 0)

  // Filtreleme işlevi
  const filteredConversations = filterStatus === 'unread' 
    ? conversations.filter(conversation => 
        conversation.messages.some(m => !m.isRead && m.senderId !== session?.user?.id))
    : conversations

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-10 text-center">
            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mesajlarınızı görüntülemek için giriş yapın
            </h1>
            <p className="text-gray-600 mb-6">Mesajlarınızı görmek, yeni konuşmalar başlatmak ve iletişim kurmak için hesabınıza giriş yapın.</p>
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 bg-gray-200 rounded-lg w-1/4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-1/6 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded-lg w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bir hata oluştu</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchConversations()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yeniden Dene
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative">
              <h1 className="text-2xl font-bold text-gray-900 relative z-10">
                Mesaj Kutusu
              </h1>
              <div className="absolute -bottom-2 left-0 w-24 h-2 bg-green-500 rounded-full opacity-60"></div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm bg-green-50 px-4 py-2 rounded-full">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-700 font-medium">{conversations.length} aktif sohbet</span>
              </div>
              
              <div className="relative inline-block text-left">
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-md ${
                      filterStatus === 'all' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-green-50'
                    } border border-gray-200 focus:outline-none transition-colors`}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('unread')}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-md ${
                      filterStatus === 'unread' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-green-50'
                    } border border-gray-200 border-l-0 focus:outline-none transition-colors relative`}
                  >
                    Okunmamış
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {totalUnreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">
                {filterStatus === 'unread' 
                  ? 'Okunmamış mesajınız yok' 
                  : 'Henüz hiç mesajınız yok'}
              </h3>
              <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
                {filterStatus === 'unread' 
                  ? 'Tüm mesajlarınızı okudunuz. Yeni mesajlar geldiğinde burada görünecek.' 
                  : 'İlanlarla ilgili konuşmalar başlattığınızda veya size mesaj gönderildiğinde burada görünecek.'}
              </p>
              <Link
                href="/listings"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium">İlanları Görüntüle</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => {
                const otherUser = conversation.users.find(
                  (user) => user.id !== session.user?.id
                )
                const lastMessage = conversation.messages[0]
                const unreadCount = conversation.messages.filter(
                  m => !m.isRead && m.senderId !== session?.user?.id
                ).length
                
                // Mesajın ne kadar süre önce gönderildiğini hesapla
                const timeAgo = (() => {
                  const now = new Date()
                  const messageTime = new Date(conversation.updatedAt)
                  const diffMs = now.getTime() - messageTime.getTime()
                  
                  // Saniye cinsinden fark
                  const diffSec = Math.floor(diffMs / 1000)
                  
                  if (diffSec < 60) return 'Az önce'
                  
                  // Dakika cinsinden fark
                  const diffMin = Math.floor(diffSec / 60)
                  if (diffMin < 60) return `${diffMin} dk önce`
                  
                  // Saat cinsinden fark
                  const diffHour = Math.floor(diffMin / 60)
                  if (diffHour < 24) return `${diffHour} sa önce`
                  
                  // Gün cinsinden fark
                  const diffDay = Math.floor(diffHour / 24)
                  if (diffDay < 7) return `${diffDay} gün önce`
                  
                  // Diğer durumlar için uzun tarih formatı
                  return format(messageTime, 'dd MMM yyyy', { locale: tr })
                })()

                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      href={`/messages/${conversation.id}`}
                      className={`block rounded-xl transition-all duration-300 transform hover:-translate-y-1 relative z-10 cursor-pointer overflow-hidden group ${
                        unreadCount > 0 
                          ? 'bg-gradient-to-r from-green-50 to-white shadow-md hover:shadow-xl border-l-4 border-green-500' 
                          : 'bg-white shadow-md hover:shadow-xl'
                      }`}
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
                                className="rounded-full object-cover ring-2 ring-green-50 group-hover:ring-green-200 transition-all"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center ring-2 ring-green-50 group-hover:ring-green-200 transition-all">
                                <span className="text-green-700 text-lg font-medium">
                                  {otherUser?.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-lg border-2 border-white">
                                {unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                {otherUser?.name}
                              </h3>
                              <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded-full">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {timeAgo}
                              </span>
                            </div>

                            {conversation.listing && (
                              <div className="flex items-center text-sm text-gray-600 mb-1 bg-gray-50 px-2 py-1 rounded-md inline-block">
                                <svg className="w-3.5 h-3.5 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="truncate max-w-[200px] inline-block">{conversation.listing.title}</span>
                              </div>
                            )}

                            {lastMessage && (
                              <div className="flex items-center justify-between mt-2">
                                <p className={`text-sm truncate max-w-[300px] flex items-center ${
                                  !lastMessage.isRead && lastMessage.senderId !== session?.user?.id
                                    ? 'font-semibold text-gray-900'
                                    : 'text-gray-500'
                                }`}>
                                  {lastMessage.senderId === session?.user?.id && (
                                    <svg className="w-4 h-4 mr-1 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                  )}
                                  {lastMessage.senderId !== session?.user?.id && (
                                    <svg className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" transform="scale(-1, 1) translate(-24, 0)" />
                                    </svg>
                                  )}
                                  <span className="truncate">{lastMessage.content}</span>
                                </p>
                                <div className="ml-2 flex items-center">
                                  {!lastMessage.isRead && lastMessage.senderId !== session?.user?.id && (
                                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0 mr-1"></span>
                                  )}
                                  {lastMessage.senderId === session?.user?.id && (
                                    <span className="flex-shrink-0 text-xs text-gray-400 ml-1">
                                      {lastMessage.isRead ? (
                                        <span className="text-green-600 flex items-center">
                                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Okundu
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 flex items-center">
                                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                          </svg>
                                          İletildi
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
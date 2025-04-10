'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface User {
  id: string
  name: string
  profileImage: string | null
}

interface Message {
  id: string
  content: string
  senderId: string
  sender: User
  createdAt: string
  isRead: boolean
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ConversationPage({ params }: PageProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const firstUnreadRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const POLLING_INTERVAL = 15000 // 15 saniye (5 saniyeden 15'e çıkarıldı)
  const MIN_FETCH_INTERVAL = 5000 // 5 saniye

  const fetchMessages = async (forceUpdate = false) => {
    // Son istekten beri MIN_FETCH_INTERVAL süresi geçmediyse ve zorunlu değilse atla
    const now = Date.now()
    if (!forceUpdate && now - lastFetchTime < MIN_FETCH_INTERVAL) {
      return false
    }
    
    try {
      setLastFetchTime(now)
      const resolvedParams = await params
      const response = await fetch(`/api/conversations/${resolvedParams.id}/messages`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      // Mesaj sayısı değişti mi kontrol et
      const newMessageCount = result.data.length
      const hasNewMessages = newMessageCount > messageCount
      
      setMessages(result.data)
      setMessageCount(newMessageCount)

      // Mesajları okundu olarak işaretle
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId: resolvedParams.id }),
      })
      
      return hasNewMessages // Yeni mesaj var mı bilgisini döndür
    } catch (error) {
      setError('Mesajlar yüklenirken bir hata oluştu')
      console.error('Fetch messages error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      // İlk yüklemede mesajları getir
      fetchMessages(true).then(() => {
        // İlk yüklemede scroll işlemi yapılır
        setInitialScrollDone(true)
        // İlk yüklemede biraz gecikmeli scroll yap (DOM render için)
        setTimeout(() => {
          scrollToBottomIfNeeded()
        }, 300)
      })
      
      // Periyodik olarak mesajları güncelle
      const intervalId = setInterval(() => {
        console.log('Mesajlar güncelleniyor...')
        fetchMessages().then(hasNewMessages => {
          // Sadece yeni mesaj geldiğinde ve otomatik kaydırma açıksa kaydır
          if (hasNewMessages && autoScrollEnabled) {
            scrollToBottomIfNeeded("smooth")
          }
        })
      }, POLLING_INTERVAL)
      
      // Component unmount olduğunda interval'ı temizle
      return () => clearInterval(intervalId)
    }
  }, [session?.user?.id]) // params çıkarıldı çünkü değişmiyor ve gereksiz yeniden render yapıyor
  
  // Kullanıcının scroll yapmasını takip et
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    // Debounce için zamanlayıcı
    let scrollTimer: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      // Debounce scroll eventi
      if (scrollTimer) clearTimeout(scrollTimer)
      
      scrollTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        
        // Kullanıcı sayfanın alt kısmına yakınsa, otomatik kaydırmayı etkinleştir
        if (isNearBottom && !autoScrollEnabled) {
          setAutoScrollEnabled(true)
        }
        
        // Kullanıcı yukarı kaydırdıysa, otomatik kaydırmayı devre dışı bırak
        if (!isNearBottom && autoScrollEnabled) {
          setAutoScrollEnabled(false)
        }
      }, 150) // 150ms debounce
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [autoScrollEnabled])

  // Sayfanın altına kaydır (isteğe bağlı olarak düz veya animasyonlu)
  const scrollToBottomIfNeeded = (behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current
    if (!container || !messagesEndRef.current) return
    
    // Sadece otomatik kaydırma etkinse veya kullanıcı zaten altta ise kaydır
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    if (autoScrollEnabled || isNearBottom) {
      // Kaydırma işlemi
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end' // Görünür alanın sonuna hizala
      })
    }
  }

  const scrollToFirstUnread = () => {
    if (firstUnreadRef.current && messagesContainerRef.current) {
      firstUnreadRef.current.scrollIntoView({
        behavior: "smooth",
        block: 'center' // Okunmamış mesajı görünür alanın ortasına hizala
      })
    }
  }

  // İlk yükleme tamamlandıktan sonra sadece bir kez çalışır
  useEffect(() => {
    if (initialScrollDone && messages.length > 0) {
      const hasUnread = messages.some(msg => !msg.isRead && msg.senderId !== session?.user?.id)
      
      if (hasUnread) {
        // Bir defaya mahsus okunmamış mesaja git
        setTimeout(() => scrollToFirstUnread(), 300)
      } else {
        // Bir defaya mahsus en alta git
        setTimeout(() => scrollToBottomIfNeeded("auto"), 300)
      }
    }
  }, [initialScrollDone]); // sadece initialScrollDone değiştiğinde çalışır

  // Mesaj yazılırken otomatik büyüme
  const adjustTextareaHeight = () => {
    const textarea = messageInputRef.current
    if (!textarea) return
    
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
  }

  // Enter tuşu ile gönderme (Shift+Enter ile yeni satır)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !session?.user?.id || sending) return

    try {
      setSending(true)
      const resolvedParams = await params
      const response = await fetch(`/api/conversations/${resolvedParams.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      // Hemen ekle ve mesaj sayısını artır
      setMessages(prev => [...prev, result.data])
      setNewMessage('')
      setMessageCount(prev => prev + 1)
      setAutoScrollEnabled(true) // Mesaj gönderince otomatik scroll aktif olsun
      
      // Textarea yüksekliğini sıfırla
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto'
      }
      
      // Mesaj gönderince alt tarafa kaydır
      setTimeout(() => scrollToBottomIfNeeded("smooth"), 100)
    } catch (error) {
      console.error('Send message error:', error)
      setError('Mesaj gönderilirken bir hata oluştu')
    } finally {
      setSending(false)
    }
  }

  const formatMessageDate = (dateString: string) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return `Bugün ${format(messageDate, 'HH:mm', { locale: tr })}`
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Dün ${format(messageDate, 'HH:mm', { locale: tr })}`
    } else {
      return format(messageDate, 'dd MMM yyyy HH:mm', { locale: tr })
    }
  }

  // Mesajları günlere göre grupla
  const getMessageDate = (date: string) => {
    return new Date(date).toDateString()
  }

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
              Mesajlara erişmek için giriş yapın
            </h1>
            <p className="text-gray-600 mb-6">Mesajlarınızı görmek ve yanıtlamak için lütfen giriş yapın.</p>
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
            <div className="h-16 bg-gray-100 rounded-t-xl animate-pulse flex items-center px-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-[calc(100vh-250px)] overflow-y-auto p-6 bg-gray-50 space-y-4">
              {[1, 2, 3, 4].map((_, index) => (
                <div 
                  key={index} 
                  className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-[70%] h-16 rounded-lg ${
                      index % 2 === 0 ? 'bg-gray-200' : 'bg-green-200'
                    } animate-pulse`}
                    style={{width: `${Math.floor(Math.random() * 150) + 100}px`}}
                  ></div>
                </div>
              ))}
            </div>
            <div className="h-16 bg-white border-t border-gray-100 rounded-b-xl animate-pulse flex items-center px-6">
              <div className="h-10 bg-gray-100 rounded-full w-full"></div>
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
                fetchMessages()
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

  // Mesajları gönderen kişiye göre grupla
  let currentSenderId: string | null = null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Sohbet Başlığı */}
            <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between">
                <Link href="/messages" className="text-gray-500 hover:text-green-600 flex items-center mr-4 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                
                <div className="flex-1 flex items-center space-x-3">
                  {messages[0]?.sender && messages[0]?.sender.id !== session?.user?.id && (
                    <div className="w-10 h-10 relative flex-shrink-0">
                      {messages[0].sender.profileImage ? (
                        <Image
                          src={messages[0].sender.profileImage}
                          alt={messages[0].sender.name}
                          fill
                          className="rounded-full object-cover ring-2 ring-green-50"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center ring-2 ring-green-50">
                          <span className="text-green-700 text-lg font-medium">
                            {messages[0].sender.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {messages[0]?.sender && messages[0]?.sender.id !== session?.user?.id
                        ? messages[0].sender.name
                        : messages[1]?.sender.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Son görülme: {messages[0]?.createdAt ? formatMessageDate(messages[0].createdAt) : 'Bilinmiyor'}
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length} okunmamış
                  </div>
                </div>
              </div>
            </div>

            {/* Mesajlar */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Henüz mesaj bulunmuyor</p>
                    <p className="text-gray-400 text-sm mt-1">Bu konuşmada ilk mesajı gönderen siz olun</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isFirstUnread = !message.isRead && 
                      message.senderId !== session.user.id && 
                      messages.slice(0, index).every(m => m.isRead || m.senderId === session.user.id);
                    
                    const isNewSender = message.senderId !== currentSenderId;
                    currentSenderId = message.senderId;
                    
                    const showDateHeader = index === 0 || 
                      getMessageDate(message.createdAt) !== getMessageDate(messages[index - 1].createdAt);
                      
                    return (
                      <div key={message.id}>
                        {showDateHeader && (
                          <div className="flex justify-center my-4">
                            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                              {formatMessageDate(message.createdAt).split(' ')[0]}
                            </div>
                          </div>
                        )}
                        
                        {isFirstUnread && (
                          <div 
                            ref={firstUnreadRef}
                            className="flex items-center justify-center my-3"
                          >
                            <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium shadow-sm animate-pulse">
                              {messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length} Yeni Mesaj
                            </div>
                          </div>
                        )}
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            message.senderId === session.user.id ? 'justify-end' : 'justify-start'
                          } ${isNewSender ? 'mt-2' : 'mt-1'}`}
                        >
                          {message.senderId !== session.user.id && isNewSender && (
                            <div className="flex-shrink-0 w-8 h-8 relative mr-2 self-end mb-1">
                              {message.sender.profileImage ? (
                                <Image
                                  src={message.sender.profileImage}
                                  alt={message.sender.name}
                                  fill
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 text-xs font-medium">
                                    {message.sender.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {message.senderId !== session.user.id && !isNewSender && (
                            <div className="w-8 mr-2"></div>
                          )}
                          
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              message.senderId === session.user.id
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-tr-none shadow-sm'
                                : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                            } ${
                              !message.isRead && message.senderId !== session.user.id
                                ? 'border-l-2 border-red-500'
                                : ''
                            }`}
                          >
                            <p className="whitespace-pre-line break-words">{message.content}</p>
                            <div className="flex items-center justify-end space-x-1 mt-1">
                              <p className={`text-xs ${
                                message.senderId === session.user.id
                                  ? 'text-green-100'
                                  : 'text-gray-400'
                              }`}>
                                {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
                              </p>
                              {message.senderId === session.user.id && (
                                <div className="flex items-center space-x-1 ml-1">
                                  {message.isRead ? (
                                    <div className="flex items-center">
                                      <svg className="w-3.5 h-3.5 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs text-green-100 ml-0.5">Okundu</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <svg className="w-3.5 h-3.5 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span className="text-xs text-green-100 ml-0.5">İletildi</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} className="h-1" />
                </>
              )}
            </div>

            {/* Mesaj Formu */}
            <div className="p-3 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      adjustTextareaHeight()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesajınızı yazın..."
                    className="w-full rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none py-3 px-4 text-gray-700 min-h-[44px] max-h-[150px] transition-all"
                    rows={1}
                  />
                  <div className="absolute right-3 bottom-2 text-xs text-gray-400">
                    {sending ? 'Gönderiliyor...' : newMessage.length > 0 ? 'Enter = Gönder' : ''}
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 ${
                    newMessage.trim() && !sending
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-md'
                      : 'bg-gray-200 cursor-not-allowed'
                  } text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300`}
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

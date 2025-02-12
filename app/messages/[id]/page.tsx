'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const firstUnreadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/conversations/${resolvedParams.id}/messages`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setMessages(result.data)

        // Mesajları okundu olarak işaretle
        await fetch('/api/messages/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ conversationId: resolvedParams.id }),
        })
      } catch (error) {
        setError('Mesajlar yüklenirken bir hata oluştu')
        console.error('Fetch messages error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchMessages()
    }
  }, [session, params])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToFirstUnread = () => {
    firstUnreadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
      // İlk okunmamış mesaja git
      const hasUnread = messages.some(msg => !msg.isRead && msg.senderId !== session?.user?.id)
      if (hasUnread) {
        scrollToFirstUnread()
      }
    }
  }, [messages, session?.user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user?.id) return

    try {
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

      setMessages(prev => [...prev, result.data])
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      console.error('Send message error:', error)
      setError('Mesaj gönderilirken bir hata oluştu')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Sohbet Başlığı */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {messages[0]?.sender && messages[0]?.sender.id !== session?.user?.id && (
                    <div className="w-10 h-10 relative">
                      {messages[0].sender.profileImage ? (
                        <Image
                          src={messages[0].sender.profileImage}
                          alt={messages[0].sender.name}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-lg font-medium">
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
                    <p className="text-sm text-gray-500">
                      {messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length} okunmamış mesaj
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isFirstUnread = !message.isRead && 
                  message.senderId !== session.user.id && 
                  messages.slice(0, index).every(m => m.isRead || m.senderId === session.user.id)

                return (
                  <div key={message.id}>
                    {isFirstUnread && (
                      <div 
                        ref={firstUnreadRef}
                        className="flex items-center justify-center my-4"
                      >
                        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium animate-newMessageBadgePulse shadow-lg">
                          {messages.filter(m => !m.isRead && m.senderId !== session?.user?.id).length} Yeni Mesaj
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex ${
                        message.senderId === session.user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.senderId === session.user.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } ${
                          !message.isRead && message.senderId !== session.user.id
                            ? 'border-2 border-red-500 animate-messagePulse shadow-md'
                            : ''
                        }`}
                      >
                        <p>{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <p className={`text-xs ${
                            message.senderId === session.user.id
                              ? 'text-green-100'
                              : 'text-gray-500'
                          }`}>
                            {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
                          </p>
                          {message.senderId === session.user.id && (
                            <svg className="w-4 h-4 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Gönderme Formu */}
            <div className="border-t p-4 bg-white">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

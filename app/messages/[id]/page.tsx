'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { use } from 'react'

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
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ConversationPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversationId = resolvedParams.id

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!session?.user) return

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        setMessages(result.data)
      } catch (error) {
        setError('Mesajlar yüklenirken bir hata oluştu')
        console.error('Fetch messages error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [session, conversationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !session?.user) return

    setSending(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
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

      setMessages((prev) => [...prev, result.data])
      setNewMessage('')
    } catch (error) {
      console.error('Send message error:', error)
      setError('Mesaj gönderilemedi')
    } finally {
      setSending(false)
    }
  }

  if (status === 'loading') {
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

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Bu sayfayı görüntülemek için giriş yapmanız gerekiyor
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
            <Link href="/messages" className="text-green-600 hover:text-green-700 mt-4 inline-block">
              Mesajlara Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto pt-20">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-6rem)]">
            {/* Üst Bar */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/messages"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Mesajlar</span>
                </Link>
              </div>
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 h-[calc(100vh-15rem)] bg-gray-50">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === session?.user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[75%]`}>
                      {!isOwnMessage && (
                        <div className="flex-shrink-0 w-8 h-8 relative">
                          {message.sender.profileImage ? (
                            <Image
                              src={message.sender.profileImage}
                              alt={message.sender.name}
                              fill
                              sizes="(max-width: 40px) 100vw, 40px"
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 text-sm font-medium">
                                {message.sender.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <span className={`text-xs mt-1 block ${
                          isOwnMessage ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Gönderme Formu */}
            <div className="bg-white border-t px-6 py-4">
              <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {sending ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useUnreadCount() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.email) {
      setUnreadCount(0)
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/messages/unread-count')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount)
      } else {
        console.warn('Unexpected response format:', data)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setError('Okunmamış mesaj sayısı alınamadı')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email])

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      if (mounted) {
        await fetchUnreadCount()
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [fetchUnreadCount])

  return { unreadCount, isLoading, error }
} 
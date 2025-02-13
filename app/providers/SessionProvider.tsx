'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from 'next-auth'

interface SessionContextType {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true
})

export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setSession(data)
      } catch (error) {
        console.error('Session fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  )
} 
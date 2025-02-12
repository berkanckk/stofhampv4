'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'

interface UserMenuProps {
  session: Session
  linkStyle: string
  unreadCount: number
}

export default function UserMenu({ session, linkStyle, unreadCount }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 ${linkStyle}`}
      >
        <span>{session.user.name}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-fadeIn">
          <Link
            href="/listings/create"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-base transition-colors duration-300"
            onClick={() => setIsOpen(false)}
          >
            İlan Ver
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-base transition-colors duration-300"
            onClick={() => setIsOpen(false)}
          >
            Profilim
          </Link>
          <Link
            href="/my-listings"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-base transition-colors duration-300"
            onClick={() => setIsOpen(false)}
          >
            İlanlarım
          </Link>
          <Link
            href="/messages"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-base transition-colors duration-300 relative"
            onClick={() => setIsOpen(false)}
          >
            Mesajlarım
            {unreadCount > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => {
              setIsOpen(false)
              signOut()
            }}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-base transition-colors duration-300"
          >
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
} 
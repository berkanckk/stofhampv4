'use client'

import Image from 'next/image'

interface ListingImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
}

export default function ListingImage({ src, alt, priority = false, className }: ListingImageProps) {
  return (
    <div className="relative w-full h-full">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className={className || "object-cover object-center transform group-hover:scale-105 transition-transform duration-300"}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
} 
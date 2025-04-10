'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
// ... existing imports ...

export default function ListingDetailPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/listings/${params.slug}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message)
        }

        setListing(data.data)
        setError(null)
      } catch (error) {
        console.error('Fetch listing error:', error)
        setError('İlan yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchListing()
    }
  }, [params.slug])

  // ... rest of the component code ...
} 
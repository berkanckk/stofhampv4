'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface Material {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  categoryName?: string | null
}

export default function EditMaterialPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [material, setMaterial] = useState<Material | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        
        if (data.success) {
          const categoriesData = data.categories || data.data || [];
          setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        }
      } catch (error) {
        console.error('Kategori alma hatası:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Malzeme verisini yükle
  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await fetch(`/api/admin/materials/${id}`)
        const data = await response.json()
        
        if (data.success && data.material) {
          setMaterial(data.material)
          setName(data.material.name)
          setDescription(data.material.description || '')
          setCategoryId(data.material.categoryId || '')
        } else {
          setError(data.message || 'Malzeme bulunamadı')
        }
      } catch (error) {
        setError('Malzeme yüklenirken bir hata oluştu')
        console.error('Malzeme alma hatası:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMaterial()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!name.trim()) {
      setError('Malzeme adı zorunludur')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          categoryId: categoryId || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/materials')
        router.refresh()
      } else {
        setError(data.message || 'Malzeme güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Malzeme güncelleme hatası:', error)
      setError('Malzeme güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error && !material) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow-sm text-red-700">
        <p className="font-medium text-lg">{error}</p>
        <Link href="/admin/materials" className="mt-4 inline-block text-green-600 hover:text-green-700">
          Malzemelere Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Malzeme Düzenle</h1>
        <Link
          href="/admin/materials"
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Malzemelere Dön
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Malzeme Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Malzeme adını girin"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={categoriesLoading}
            >
              <option value="">Kategori seçin (opsiyonel)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <p className="text-sm text-gray-500 mt-1">Kategoriler yükleniyor...</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Malzeme açıklaması (isteğe bağlı)"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <Link
              href="/admin/materials"
              className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                saving ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
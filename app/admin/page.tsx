'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// ChartJS bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// İstatistik tipleri
interface DashboardStats {
  totalUsers: number
  totalListings: number
  totalCategories: number
  totalMaterials: number
  userTypeCounts: {
    ADMIN: number
    PERSONAL: number
    BUSINESS: number
  }
  recentListings: {
    id: string
    title: string
    price: number
    sellerName: string
    categoryName: string
    createdAt: string
  }[]
  listingsByCategory: {
    id: string
    name: string
    count: number
  }[]
  listingsMonthly: {
    month: number
    year: number
    count: number
  }[]
  loading: boolean
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalListings: 0,
    totalCategories: 0,
    totalMaterials: 0,
    userTypeCounts: { ADMIN: 0, PERSONAL: 0, BUSINESS: 0 },
    recentListings: [],
    listingsByCategory: [],
    listingsMonthly: [],
    loading: true
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        
        if (data.success) {
          setStats({
            ...data.stats,
            loading: false
          })
        } else {
          setError(data.message || 'İstatistikler alınamadı')
        }
      } catch (error) {
        setError('İstatistikler alınırken bir hata oluştu')
        console.error('İstatistik alma hatası:', error)
      } finally {
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Aylık istatistik verilerini grafikler için düzenle
  const getMonthlyChartData = () => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    
    const labels = stats.listingsMonthly.map(item => {
      return `${months[item.month - 1]} ${item.year}`
    })
    
    const data = stats.listingsMonthly.map(item => item.count)
    
    return {
      labels,
      datasets: [
        {
          label: 'Aylık İlan Sayıları',
          data,
          backgroundColor: 'rgba(52, 211, 153, 0.5)',
          borderColor: 'rgb(52, 211, 153)',
          borderWidth: 2,
        }
      ]
    }
  }

  // Kategorilere göre ilan sayıları grafiği için düzenle
  const getCategoryChartData = () => {
    const labels = stats.listingsByCategory.map(item => item.name)
    const data = stats.listingsByCategory.map(item => item.count)
    
    return {
      labels,
      datasets: [
        {
          label: 'Kategori Bazında İlan Sayıları',
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(52, 211, 153, 0.7)',
            'rgba(202, 138, 4, 0.7)',
          ],
          borderWidth: 1,
        }
      ]
    }
  }

  // Kullanıcı tiplerini grafikler için düzenle
  const getUserTypeChartData = () => {
    const labels = ['Admin', 'Bireysel', 'Kurumsal']
    const data = [
      stats.userTypeCounts.ADMIN, 
      stats.userTypeCounts.PERSONAL, 
      stats.userTypeCounts.BUSINESS
    ]
    
    return {
      labels,
      datasets: [
        {
          label: 'Kullanıcı Tipleri',
          data,
          backgroundColor: [
            'rgba(153, 102, 255, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
          ],
          borderWidth: 1,
        }
      ]
    }
  }

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Admin Dashboard</h1>
      
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Toplam İlan</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalListings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Toplam Kategori</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCategories}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 mr-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Toplam Malzeme</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalMaterials}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık İlan Grafiği */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Aylık İlan İstatistikleri</h2>
          <div className="h-80">
            {stats.listingsMonthly && stats.listingsMonthly.length > 0 ? (
              <Line 
                data={getMonthlyChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Henüz veri bulunmamaktadır
              </div>
            )}
          </div>
        </div>
        
        {/* Kategori Dağılımı */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Kategorilere Göre İlan Dağılımı</h2>
          <div className="h-80">
            {stats.listingsByCategory && stats.listingsByCategory.length > 0 ? (
              <Bar 
                data={getCategoryChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Henüz veri bulunmamaktadır
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kullanıcı Dağılımı */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Kullanıcı Tipleri</h2>
          <div className="h-60">
            <Pie 
              data={getUserTypeChartData()} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        
        {/* Son İlanlar */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Son Eklenen İlanlar</h2>
            <Link 
              href="/admin/listings"
              className="text-sm text-green-600 hover:text-green-700 flex items-center"
            >
              Tümünü Gör
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {stats.recentListings && stats.recentListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İlan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                          {listing.title.length > 30 ? `${listing.title.substring(0, 30)}...` : listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {listing.categoryName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {listing.sellerName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(listing.price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(listing.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Henüz ilan bulunmamaktadır
            </div>
          )}
        </div>
      </div>
      
      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Kullanıcı Yönetimi</h3>
                <p className="text-gray-600 text-sm">Kullanıcılarınızı yönetin, düzenleyin</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/categories" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Kategori Yönetimi</h3>
                <p className="text-gray-600 text-sm">Kategorilerinizi yönetin, düzenleyin</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/materials" className="group">
          <div className="bg-white p-6 rounded-lg shadow-md group-hover:shadow-lg transition-shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">Malzeme Yönetimi</h3>
                <p className="text-gray-600 text-sm">Malzemelerinizi yönetin, düzenleyin</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
} 
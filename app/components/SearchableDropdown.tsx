'use client'

import { useState, useRef, useEffect } from 'react'

type Option = {
  id: string
  name: string
}

interface SearchableDropdownProps {
  options: Option[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder: string
  searchPlaceholder: string
  className?: string
  onOpen?: () => void  // Dropdown açıldığında çağrılacak fonksiyon
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  className = '',
  onOpen
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Dropdown açıldığında callback'i çağır
  useEffect(() => {
    if (isOpen && onOpen) {
      // isOpen değiştiğinde SADECE bir kez çağır
      const timer = setTimeout(() => {
        onOpen();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Dışarı tıklama kontrolü
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  // Dropdown açıldığında arama kutusuna odaklan
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filtrelenmiş seçenekler
  const filteredOptions = searchTerm
    ? options.filter(option => 
        option.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : options

  // Seçilen değerin adını bul
  const selectedOptionName = value 
    ? options.find(option => option.id === value)?.name || ''
    : ''

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Seçilen değeri gösteren alan */}
      <div 
        className="flex items-center justify-between py-4 px-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOptionName ? 'text-gray-800' : 'text-gray-500'}>
          {selectedOptionName || placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {/* Dropdown içeriği */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-50" 
        >
          {/* Arama kutusu */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Seçenekler listesi */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Hepsini seç seçeneği */}
            <div 
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${!value ? 'bg-green-50 text-green-700 font-medium' : ''}`}
              onClick={() => {
                onChange(null)
                setIsOpen(false)
                setSearchTerm('')
              }}
            >
              <span>{placeholder}</span>
              {!value && (
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
            
            {/* Diğer seçenekler */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${value === option.id ? 'bg-green-50 text-green-700 font-medium' : ''}`}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                >
                  <span>{option.name}</span>
                  {value === option.id && (
                    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 
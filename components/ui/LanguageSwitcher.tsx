'use client'

import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState('de')

  // Beim Start: Locale aus Cookie lesen
  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      return localeCookie ? localeCookie.split('=')[1] : 'de'
    }
    setCurrentLocale(getLocaleFromCookie())
  }, [])

  const switchLocale = (newLocale: string) => {
    // Cookie setzen
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    
    // Seite komplett neuladen (erzwungen)
    window.location.reload()
  }

  // Schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.language-switcher')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative language-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 text-white hover:bg-white/20 transition-all"
      >
        <span>{currentLocale === 'de' ? '🇩🇪' : '🇬🇧'}</span>
        <span>{currentLocale === 'de' ? 'DE' : 'EN'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-amber-900 border border-amber-500/30 rounded-lg shadow-xl overflow-hidden z-50 min-w-[120px]">
          <button
            onClick={() => switchLocale('de')}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors ${
              currentLocale === 'de' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800'
            }`}
          >
            <span>🇩🇪</span>
            <span>Deutsch</span>
            {currentLocale === 'de' && <span className="ml-auto">✓</span>}
          </button>
          <button
            onClick={() => switchLocale('en')}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors ${
              currentLocale === 'en' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
            {currentLocale === 'en' && <span className="ml-auto">✓</span>}
          </button>
        </div>
      )}
    </div>
  )
}
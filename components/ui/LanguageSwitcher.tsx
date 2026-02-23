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
    
    // Seite komplett neuladen
    window.location.reload()
  }

  // Schließen bei Klick außerhalb (angepasst für Touch)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.language-switcher')) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative language-switcher" style={{ zIndex: 9999 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 text-white hover:bg-white/20 transition-all active:bg-white/30 min-h-[44px]"
        style={{ touchAction: 'manipulation' }}
      >
        <span>{currentLocale === 'de' ? '🇩🇪' : '🇬🇧'}</span>
        <span>{currentLocale === 'de' ? 'DE' : 'EN'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-amber-900 border border-amber-500/30 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]">
          <button
            onClick={() => switchLocale('de')}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors min-h-[48px] ${
              currentLocale === 'de' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800 active:bg-amber-700'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span>🇩🇪</span>
            <span>Deutsch</span>
            {currentLocale === 'de' && <span className="ml-auto">✓</span>}
          </button>
          <button
            onClick={() => switchLocale('en')}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors min-h-[48px] ${
              currentLocale === 'en' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800 active:bg-amber-700'
            }`}
            style={{ touchAction: 'manipulation' }}
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
'use client'

import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState('de')

  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      console.log('Gefundener Cookie:', localeCookie)
      return localeCookie ? localeCookie.split('=')[1] : 'de'
    }
    const locale = getLocaleFromCookie()
    console.log('Aktuelle Sprache:', locale)
    setCurrentLocale(locale)
  }, [])

  const switchLocale = (newLocale: string) => {
    console.log('Wechsle zu:', newLocale)
    // Cookie setzen
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    console.log('Cookie gesetzt:', document.cookie)
    
    // WICHTIG: Seite komplett neuladen mit Zeitverzögerung
    setTimeout(() => {
      window.location.href = window.location.pathname
    }, 100)
  }

  // Schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.language-switcher')) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative language-switcher" style={{ zIndex: 9999 }}>
      <button
        onClick={() => {
          console.log('Button geklickt')
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/30 text-white hover:bg-white/20 transition-all min-h-[44px]"
        style={{ touchAction: 'manipulation' }}
      >
        <span>{currentLocale === 'de' ? '🇩🇪' : '🇬🇧'}</span>
        <span>{currentLocale === 'de' ? 'DE' : 'EN'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-amber-900 border border-amber-500/30 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]">
          <button
            onClick={() => {
              console.log('Deutsch ausgewählt')
              switchLocale('de')
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors min-h-[44px] ${
              currentLocale === 'de' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span>🇩🇪</span>
            <span>Deutsch</span>
            {currentLocale === 'de' && <span className="ml-auto">✓</span>}
          </button>
          <button
            onClick={() => {
              console.log('Englisch ausgewählt')
              switchLocale('en')
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 transition-colors min-h-[44px] ${
              currentLocale === 'en' 
                ? 'bg-amber-700 text-white' 
                : 'text-white hover:bg-amber-800'
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
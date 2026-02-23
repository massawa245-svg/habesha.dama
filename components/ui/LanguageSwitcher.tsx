'use client'

import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState('de')

  // Beim Start: Cookie lesen
  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      console.log('Aktuelle Cookies:', document.cookie)
      console.log('Gefundener Locale-Cookie:', localeCookie)
      
      if (localeCookie) {
        const value = localeCookie.split('=')[1]
        console.log('Sprache aus Cookie:', value)
        setCurrentLocale(value)
      } else {
        console.log('Kein Cookie gefunden, setze Standard: de')
        setCurrentLocale('de')
      }
    }
    
    checkCookie()
  }, [])

  const switchToGerman = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🇩🇪 Deutsch ausgewählt')
    document.cookie = 'NEXT_LOCALE=de; path=/; max-age=31536000; SameSite=Lax'
    console.log('Cookie gesetzt. Aktuelle Cookies:', document.cookie)
    
    // Timeout für Handy
    setTimeout(() => {
      window.location.reload()
    }, 50)
  }

  const switchToEnglish = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🇬🇧 Englisch ausgewählt')
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax'
    console.log('Cookie gesetzt. Aktuelle Cookies:', document.cookie)
    
    // Timeout für Handy
    setTimeout(() => {
      window.location.reload()
    }, 50)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={switchToGerman}
        onTouchStart={switchToGerman}
        className={`px-4 py-2 rounded-lg transition-all min-h-[44px] min-w-[100px] text-base ${
          currentLocale === 'de' 
            ? 'bg-amber-600 text-white shadow-lg' 
            : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        🇩🇪 Deutsch
      </button>
      <button
        onClick={switchToEnglish}
        onTouchStart={switchToEnglish}
        className={`px-4 py-2 rounded-lg transition-all min-h-[44px] min-w-[100px] text-base ${
          currentLocale === 'en' 
            ? 'bg-amber-600 text-white shadow-lg' 
            : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        🇬🇧 English
      </button>
    </div>
  )
}
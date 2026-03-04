'use client'

import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState('de')

  // Beim Start: Cookie lesen - OHNE LOGS!
  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      
      if (localeCookie) {
        const value = localeCookie.split('=')[1]
        setCurrentLocale(value)
      } else {
        setCurrentLocale('de')
      }
    }
    
    checkCookie()
  }, [])

  const switchToGerman = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    document.cookie = 'NEXT_LOCALE=de; path=/; max-age=31536000; SameSite=Lax'
    setTimeout(() => window.location.reload(), 50)
  }

  const switchToEnglish = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax'
    setTimeout(() => window.location.reload(), 50)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={switchToGerman}
        className={`px-4 py-2 rounded-lg transition-all min-h-[44px] min-w-[100px] ${
          currentLocale === 'de' 
            ? 'bg-amber-600 text-white' 
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        🇩🇪 Deutsch
      </button>
      <button
        onClick={switchToEnglish}
        className={`px-4 py-2 rounded-lg transition-all min-h-[44px] min-w-[100px] ${
          currentLocale === 'en' 
            ? 'bg-amber-600 text-white' 
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  )
}

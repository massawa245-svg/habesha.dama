'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const switchLocale = (newLocale: string) => {
    // Cookie setzen
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    
    // Seite neu laden mit neuer Sprache
    router.refresh()
    setIsOpen(false)
    
    // Kleiner Trick: Seite komplett neu laden (manchmal nötig)
    setTimeout(() => {
      window.location.reload()
    }, 100)
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
        <span>{locale === 'de' ? '🇩🇪' : '🇬🇧'}</span>
        <span>{locale === 'de' ? 'DE' : 'EN'}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-amber-900 border border-amber-500/30 rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={() => switchLocale('de')}
            className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-amber-800 transition-colors"
          >
            <span>🇩🇪</span>
            <span>Deutsch</span>
          </button>
          <button
            onClick={() => switchLocale('en')}
            className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-amber-800 transition-colors"
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      )}
    </div>
  )
}
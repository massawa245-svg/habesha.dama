'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    router.refresh()
    setIsOpen(false)
  }

  return (
    <div className="relative">
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
'use client'

import { useEffect, useState } from 'react'
import LoginButton from '@/components/auth/LoginButton'
import UserProfile from '@/components/auth/UserProfile'
import Matchmaking from '@/components/game/Matchmaking'
import RaumErstellen from '@/components/game/RaumErstellen'
import OnlineGame from '@/components/game/OnlineGame'
import { createClient, createGuestUser } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import LogoutButton from '@/components/auth/LogoutButton'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState('de')
  const t = useTranslations('Home')
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [gameId, setGameId] = useState<number | null>(null)
  const [playerColor, setPlayerColor] = useState<'schwarz' | 'weiss' | null>(null)
  const [showRaum, setShowRaum] = useState(false)
  const supabase = createClient()

  // Sprache aus Cookie lesen
  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      return localeCookie ? localeCookie.split('=')[1] : 'de'
    }
    setLocale(getLocaleFromCookie())
    setMounted(true)
  }, [])

  // Auf Sprachwechsel reagieren
  useEffect(() => {
    if (!mounted) return
    
    const checkLocale = () => {
      const cookies = document.cookie.split(';')
      const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
      const newLocale = localeCookie ? localeCookie.split('=')[1] : 'de'
      if (newLocale !== locale) {
        window.location.reload()
      }
    }
    
    const interval = setInterval(checkLocale, 500)
    return () => clearInterval(interval)
  }, [locale, mounted])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleGuestLogin = async () => {
    const guestUser = await createGuestUser()
    if (guestUser) {
      setUser(guestUser)
      setIsGuest(true)
    }
  }

  // Nicht rendern bis gemountet
  if (!mounted) {
    return null
  }

  // LANDING PAGE für nicht eingeloggte
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600 rounded-full blur-3xl"></div>
          </div>

          {/* Navigation mit LanguageSwitcher */}
          <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🇪🇹</span>
              <span className="text-2xl font-bold text-white">{t('title')}</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <LoginButton />
            </div>
          </nav>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="text-amber-300">{t('title')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-100 mb-8">
                {t('subtitle')}
              </p>
              
              {/* Guest Mode Button */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleGuestLogin}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
                >
                  <span>🎮</span>
                  {t('guestPlay')}
                </button>
                <LoginButton />
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('features.realtime')}</h3>
                  <p className="text-amber-200">{t('features.realtimeDesc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('features.tournaments')}</h3>
                  <p className="text-amber-200">{t('features.tournamentsDesc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="text-xl font-bold text-white mb-2">{t('features.mobile')}</h3>
                  <p className="text-amber-200">{t('features.mobileDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            {t('why.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🎯</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('why.rules')}</h3>
                <p className="text-amber-200">{t('why.rulesDesc')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🤝</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('why.invite')}</h3>
                <p className="text-amber-200">{t('why.inviteDesc')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">⚡</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('why.nodownload')}</h3>
                <p className="text-amber-200">{t('why.nodownloadDesc')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🆓</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('why.free')}</h3>
                <p className="text-amber-200">{t('why.freeDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-amber-800/30 py-8 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇪🇹</span>
              <span className="text-white">{t('title')}</span>
            </div>
            <div className="text-amber-300 text-sm">
              © 2026 Habesha Dama. Alle Rechte vorbehalten.
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // 🎮 GAME SECTION für eingeloggte User
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Habesha Dama 🇪🇹</h1>
          <UserProfile />
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Habesha Dama 🇪🇹</h1>
          <div className="flex items-center gap-3">
           <UserProfile />
           <LogoutButton />
         </div>
       </div>
        </div>

        {!gameId ? (
          <>
            {!showRaum ? (
              <div className="space-y-4">
                <Matchmaking 
                  userId={user.id}
                  onGameFound={(id, color) => {
                    setGameId(id)
                    setPlayerColor(color)
                  }}
                />
                <button
                  onClick={() => setShowRaum(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl text-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  🏠 {t('createRoom')}
                </button>
              </div>
            ) : (
              <div>
                <RaumErstellen
                  userId={user.id}
                  onRaumErstellt={(raumId) => {
                    console.log('Raum erstellt:', raumId)
                  }}
                />
                <button
                  onClick={() => setShowRaum(false)}
                  className="mt-4 text-amber-300 hover:text-amber-100 transition-colors"
                >
                  ← {t('back')}
                </button>
              </div>
            )}
          </>
        ) : (
          <OnlineGame 
            gameId={gameId}
            userId={user.id}
            playerColor={playerColor!}
          />
        )}
      </div>
    </main>
  )
}
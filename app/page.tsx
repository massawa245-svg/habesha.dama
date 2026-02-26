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
  const [aktuellerRaumId, setAktuellerRaumId] = useState<string | null>(null)
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

  // 🔥 Auf Raum-Updates hören (KORRIGIERT!)
  useEffect(() => {
    if (!aktuellerRaumId) return

    console.log('👀 Höre auf Raum:', aktuellerRaumId)

    const subscription = supabase
      .channel(`raum-${aktuellerRaumId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `raum_id=eq.${aktuellerRaumId}`
        },
        (payload) => {
          console.log('👀 Raum-Update erhalten:', payload.new)
          
          // Wenn Status auf 'playing' wechselt, ist Gegner da!
          if (payload.new.status === 'playing') {
            console.log('🎮 Gegner beigetreten! Starte Spiel...')
            setGameId(payload.new.id)
            setPlayerColor('schwarz')
            setShowRaum(false)
            setAktuellerRaumId(null)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [aktuellerRaumId, supabase])

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
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 overflow-hidden">
      {/* Animierter Hintergrund */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-2 border-amber-500/20 rounded-full animate-rotate-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce">🇪🇹</span>
          <span className="text-xl sm:text-2xl font-bold text-white">Habesha Dama</span>
        </div>
        <LanguageSwitcher />
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Linke Spalte: Text + Buttons */}
          <div className="text-center lg:text-left animate-slide-in">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
              <span className="text-amber-300">Habesha</span>
              <br />
              <span className="text-white">Dama</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-amber-100 mb-8 max-w-xl mx-auto lg:mx-0">
              {t('subtitle')}
            </p>

            {/* Features als kleine Icons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-amber-300 text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span> Echtzeit
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-amber-300 text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span> Kostenlos
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-amber-300 text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span> Original-Regeln
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={handleGuestLogin}
                className="group bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
              >
                <span className="text-2xl group-hover:rotate-12 transition-transform">🎮</span>
                {t('guestPlay')}
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <div className="w-full sm:w-auto">
                <LoginButton />
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Animiertes Mini-Brett */}
          <div className="relative hidden lg:block animate-float" style={{ animationDelay: '0.5s' }}>
            {/* Brett mit Glow-Effekt */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-600/30 to-amber-900/30 rounded-3xl blur-2xl animate-pulse-glow"></div>
            
            <div className="relative bg-amber-950 p-4 rounded-2xl shadow-2xl border border-amber-500/30">
              <div className="grid grid-cols-8 gap-0 aspect-square w-full max-w-[400px] mx-auto">
                {/* Miniatur-Spielbrett mit sich bewegenden Steinen */}
                {Array(8).fill(null).map((_, row) =>
                  Array(8).fill(null).map((_, col) => {
                    const istDunkel = (row + col) % 2 !== 0
                    const hatStein = (row < 3 && istDunkel) || (row > 4 && istDunkel)
                    const farbe = row < 3 ? 'bg-gray-900' : 'bg-gray-100'
                    
                    // Animierte Steine (nur einige)
                    const animate = hatStein && Math.random() > 0.7
                    
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`aspect-square ${istDunkel ? 'bg-amber-900' : 'bg-amber-100'} flex items-center justify-center p-1`}
                      >
                        {hatStein && (
                          <div className={`w-full h-full rounded-full ${farbe} ${animate ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Kleine schwebende Icons */}
            <div className="absolute -top-8 -right-8 text-4xl animate-float">👑</div>
            <div className="absolute -bottom-8 -left-8 text-4xl animate-float" style={{ animationDelay: '1s' }}>⚡</div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12 animate-slide-in">
          {t('why.title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🎯', title: t('why.rules'), desc: t('why.rulesDesc'), delay: '0s' },
            { icon: '🤝', title: t('why.invite'), desc: t('why.inviteDesc'), delay: '0.2s' },
            { icon: '⚡', title: t('why.nodownload'), desc: t('why.nodownloadDesc'), delay: '0.4s' },
            { icon: '🆓', title: t('why.free'), desc: t('why.freeDesc'), delay: '0.6s' }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30 hover:bg-white/10 transition-all transform hover:scale-105 animate-slide-in"
              style={{ animationDelay: feature.delay }}
            >
              <div className="text-4xl mb-4 animate-float">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-amber-200 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-amber-800/30 py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🇪🇹</span>
            <span className="text-white">Habesha Dama</span>
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
        {/* Header mit UserProfile und Logout */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center sm:text-left">
            Habesha Dama 🇪🇹
          </h1>
          <div className="flex items-center gap-3">
            <UserProfile />
            <LogoutButton />
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
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl text-base sm:text-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all"
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
                    setAktuellerRaumId(raumId)
                  }}
                />
                <button
                  onClick={() => {
                    setShowRaum(false)
                    setAktuellerRaumId(null)
                  }}
                  className="mt-4 text-amber-300 hover:text-amber-100 transition-colors text-sm sm:text-base"
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
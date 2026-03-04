'use client'

import { useEffect, useState } from 'react'
import Matchmaking from '@/components/game/Matchmaking'
import RaumErstellen from '@/components/game/RaumErstellen'
import OnlineGame from '@/components/game/OnlineGame'
import BotGame from '@/components/game/BotGame'
import { createClient, createGuestUser } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { useTranslations } from 'next-intl'
import Header from '@/components/Header'
import GameChat from '@/components/game/GameChat'

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
  const [isBotGame, setIsBotGame] = useState(false)

  // Für geladene Spiel-Daten
  const [savedBrett, setSavedBrett] = useState<any>(null)
  const [savedTurn, setSavedTurn] = useState<any>(null)

  const supabase = createClient()

  // 🔥 VERBESSERT: Beim Laden prüfen ob Spiel gespeichert ist
  useEffect(() => {
    if (!user) return

    const keys = Object.keys(localStorage)
    const gameKeys = keys.filter(key => key.startsWith('game_'))

    if (gameKeys.length > 0) {
      const latestGame = gameKeys
        .map(key => ({
          key,
          data: JSON.parse(localStorage.getItem(key) || '{}')
        }))
        .sort((a, b) => b.data.timestamp - a.data.timestamp)[0]

      const savedGame = latestGame.data

      if (savedGame.userId === user.id) {
        setGameId(savedGame.gameId)
        setPlayerColor(savedGame.playerColor)
        setIsBotGame(savedGame.isBotGame)
        setSavedBrett(savedGame.brett)
        setSavedTurn(savedGame.currentTurn)
      } else {
        localStorage.removeItem(latestGame.key)
      }
    } else {
      const savedGame = localStorage.getItem('currentGame')

      if (savedGame) {
        try {
          const { gameId, playerColor, isBotGame } = JSON.parse(savedGame)

          setGameId(gameId)
          setPlayerColor(playerColor)
          setIsBotGame(isBotGame)
        } catch (e) {
          console.error('Fehler beim Laden des Spiels:', e)
          localStorage.removeItem('currentGame')
        }
      }
    }
  }, [user])

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

  // Auf Raum-Updates hören
  useEffect(() => {
    if (!aktuellerRaumId) return

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
          if (payload.new.status === 'playing') {
            const keys = Object.keys(localStorage)
            keys.filter(key => key.startsWith('game_')).forEach(key => localStorage.removeItem(key))

            localStorage.setItem('currentGame', JSON.stringify({
              gameId: payload.new.id,
              playerColor: 'schwarz',
              isBotGame: false
            }))

            setGameId(payload.new.id)
            setPlayerColor('schwarz')
            setShowRaum(false)
            setAktuellerRaumId(null)
            setSavedBrett(null)
            setSavedTurn(null)
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

  // Raum-Spiel starten (mit localStorage)
  const handleGameStarted = (gameId: number, spielerFarbe: 'schwarz' | 'weiss') => {
    const keys = Object.keys(localStorage)
    keys.filter(key => key.startsWith('game_')).forEach(key => localStorage.removeItem(key))

    localStorage.setItem('currentGame', JSON.stringify({
      gameId,
      playerColor: spielerFarbe,
      isBotGame: false
    }))

    setGameId(gameId)
    setPlayerColor(spielerFarbe)
    setShowRaum(false)
    setAktuellerRaumId(null)
    setSavedBrett(null)
    setSavedTurn(null)
  }

  // Matchmaking mit Bot (mit localStorage)
  const handleMatchmakingFound = (id: number, color: 'schwarz' | 'weiss', isBot?: boolean) => {
    const keys = Object.keys(localStorage)
    keys.filter(key => key.startsWith('game_')).forEach(key => localStorage.removeItem(key))

    localStorage.setItem('currentGame', JSON.stringify({
      gameId: id,
      playerColor: color,
      isBotGame: isBot || false
    }))

    setGameId(id)
    setPlayerColor(color)
    setIsBotGame(isBot || false)
    setSavedBrett(null)
    setSavedTurn(null)
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

        {/* Navigation mit LanguageSwitcher */}
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

              {/* 🔥 Buttons für Gast-Login UND Google Login */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* Gast-Button */}
                <button
                  onClick={handleGuestLogin}
                  className="group bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform">🎮</span>
                  {t('guestPlay')}
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* 🔥 Google Login Button */}
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${location.origin}/auth/callback`
                      }
                    })
                  }}
                  className="group bg-white hover:bg-gray-100 text-gray-800 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 border-2 border-white/20"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Mit Google anmelden</span>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </button>
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

  // 🎮 GAME SECTION für eingeloggte User - Jetzt mit neuem Header!
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
      <div className="max-w-4xl mx-auto p-4">

        {/* 🔥 NEU: Einheitlicher Header (macht alles: Profil, Login, Logout) */}
        <Header />

        {!gameId ? (
          <>
            {!showRaum ? (
              <div className="space-y-6 mt-6">
                {/* GEGNER SUCHEN */}
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30">
                  <h2 className="text-2xl text-amber-300 mb-4 text-center">Spiel starten</h2>
                  <Matchmaking
                    userId={user.id}
                    onGameFound={handleMatchmakingFound}
                  />
                </div>

                {/* RAUM ERSTELLEN */}
                <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30">
                  <h2 className="text-2xl text-amber-300 mb-4 text-center">Mit Freunden spielen</h2>
                  <button
                    onClick={() => setShowRaum(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500
                               hover:from-blue-500 hover:to-blue-400
                               text-white text-xl sm:text-2xl font-bold
                               px-8 py-6 rounded-xl
                               shadow-xl hover:shadow-2xl
                               transform hover:scale-[1.02] transition-all
                               border-2 border-blue-400
                               flex items-center justify-center gap-4
                               min-h-[80px]"
                  >
                    <span className="text-3xl">🏠</span>
                    <span>{t('createRoom')}</span>
                    <span className="text-2xl opacity-60">→</span>
                  </button>
                </div>

                <div className="text-center text-amber-300/70 text-sm mt-4">
                  ⭐ Premium-Features bald verfügbar
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30 mt-6">
                <RaumErstellen
                  userId={user.id}
                  onRaumErstellt={(raumId) => {
                    setAktuellerRaumId(raumId)
                  }}
                  onGameStarted={handleGameStarted}
                />
                <button
                  onClick={() => {
                    setShowRaum(false)
                    setAktuellerRaumId(null)
                  }}
                  className="mt-4 w-full bg-gray-600/50 hover:bg-gray-600/70
                             text-white px-6 py-4 rounded-xl
                             transition-all flex items-center justify-center gap-2
                             border border-gray-500/30"
                >
                  ← {t('back')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 mt-6">
            {/* Zurück-Button mit localStorage Cleanup */}
            <button
              onClick={() => {
                const keys = Object.keys(localStorage)
                keys.filter(key => key.startsWith('game_')).forEach(key => localStorage.removeItem(key))
                localStorage.removeItem('currentGame')

                setGameId(null)
                setPlayerColor(null)
                setIsBotGame(false)
                setSavedBrett(null)
                setSavedTurn(null)
              }}
              className="text-amber-300 hover:text-white transition-colors flex items-center gap-2"
            >
              ← Zurück zum Menü
            </button>

            {isBotGame ? (
              <BotGame
                key={`bot-${gameId}`}
                gameId={gameId}
                userId={user.id}
                playerColor={playerColor!}
                initialBrett={savedBrett}
                initialTurn={savedTurn}
              />
            ) : (
              <OnlineGame
                key={`online-${gameId}`}
                gameId={gameId}
                userId={user.id}
                playerColor={playerColor!}
                initialBrett={savedBrett}
                initialTurn={savedTurn}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
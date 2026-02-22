'use client'

import { useEffect, useState } from 'react'
import LoginButton from '@/components/auth/LoginButton'
import UserProfile from '@/components/auth/UserProfile'
import Matchmaking from '@/components/game/Matchmaking'
import RaumErstellen from '@/components/game/RaumErstellen'
import OnlineGame from '@/components/game/OnlineGame'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  const [playerColor, setPlayerColor] = useState<'schwarz' | 'weiss' | null>(null)
  const [showRaum, setShowRaum] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 🌟 LANDING PAGE für nicht eingeloggte Benutzer
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Hintergrund-Effekte */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600 rounded-full blur-3xl"></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🇪🇹</span>
              <span className="text-2xl font-bold text-white">Habesha Dama</span>
            </div>
            <LoginButton />
          </nav>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Das traditionelle 
                <span className="text-amber-300"> Habesha Dama</span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-100 mb-8">
                Spiele gegen Freunde in Echtzeit – mit den originalen Regeln. 
                Kostenlos, einfach und direkt im Browser.
              </p>
              
              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-2">Echtzeit</h3>
                  <p className="text-amber-200">Spiele gegen Freunde in Echtzeit</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">Turniere</h3>
                  <p className="text-amber-200">Organisiere Turniere mit Freunden</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-amber-500/30">
                  <div className="text-4xl mb-3">📱</div>
                  <h3 className="text-xl font-bold text-white mb-2">Mobile First</h3>
                  <p className="text-amber-200">Funktioniert auf Handy und PC</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex gap-4">
                <LoginButton />
                <a 
                  href="#features" 
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all border border-white/30"
                >
                  Mehr erfahren
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Warum <span className="text-amber-300">Habesha Dama?</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🎯</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Originale Regeln</h3>
                <p className="text-amber-200">Wir spielen nach den echten Habesha-Regeln – inklusive Mehrfach-Fressen und Königszügen.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🤝</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Freunde einladen</h3>
                <p className="text-amber-200">Erstelle Räume und teile Links – deine Freunde können sofort mitspielen.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">⚡</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Kein Download</h3>
                <p className="text-amber-200">Einfach den Link öffnen und loslegen – funktioniert in jedem Browser.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl bg-amber-600/20 p-4 rounded-xl">🆓</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Komplett kostenlos</h3>
                <p className="text-amber-200">Keine versteckten Kosten – einfach anmelden und spielen.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-amber-800/30 py-8 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇪🇹</span>
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

  // 🎮 GAME SECTION für eingeloggte Benutzer (bleibt gleich)
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Habesha Dama 🇪🇹</h1>
          <UserProfile />
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
                  🏠 Raum erstellen (Freund einladen)
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
                  ← Zurück
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
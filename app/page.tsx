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

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center">
          <h1 className="text-4xl text-white mb-4 font-bold">Habesha Dama 🇪🇹</h1>
          <LoginButton />
        </div>
      </main>
    )
  }

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
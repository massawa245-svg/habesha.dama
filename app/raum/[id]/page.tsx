'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LoginButton from '@/components/auth/LoginButton'
import OnlineGame from '@/components/game/OnlineGame'

export default function RaumPage() {
  const params = useParams()
  const router = useRouter()
  const raumId = params.id as string
  const [userId, setUserId] = useState<string | null>(null)
  const [gameId, setGameId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndJoin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setUserId(user.id)

      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('raum_id', raumId)
        .eq('status', 'waiting')
        .single()

      if (gameError || !game) {
        setError('Raum nicht gefunden oder bereits voll')
        setLoading(false)
        return
      }

      const { error: joinError } = await supabase
        .from('games')
        .update({
          player_white: user.id,
          status: 'playing',
          current_turn: 'schwarz'
        })
        .eq('id', game.id)

      if (joinError) {
        setError('Fehler beim Beitreten')
        setLoading(false)
        return
      }

      setGameId(game.id)
      setLoading(false)
    }

    checkUserAndJoin()
  }, [raumId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-white text-xl">Werde in Raum eingeloggt...</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Raum beitreten</h1>
          <p className="text-amber-200 mb-6">
            Du wurdest zu einem Spiel eingeladen. Bitte melde dich an, um beizutreten.
          </p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="bg-black/30 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="text-5xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    )
  }

  if (gameId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Raum beigetreten! 🎉
          </h1>
          <OnlineGame
            gameId={gameId}
            userId={userId}
            playerColor="weiss"
          />
        </div>
      </main>
    )
  }

  return null
}
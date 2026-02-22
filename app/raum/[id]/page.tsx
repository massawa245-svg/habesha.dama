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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)

      // Suche nach einem Spiel mit dieser raum_id
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('raum_id', raumId)
        .eq('status', 'waiting')
        .single()

      if (error || !data) {
        setError('Raum nicht gefunden oder bereits voll')
        setLoading(false)
        return
      }

      // Spiel beitreten als Weiß
      const { error: joinError } = await supabase
        .from('games')
        .update({
          player_white: user.id,
          status: 'playing',
          current_turn: 'schwarz'
        })
        .eq('id', data.id)

      if (joinError) {
        setError('Fehler beim Beitreten')
        setLoading(false)
        return
      }

      setGameId(data.id)
      setLoading(false)
    }

    checkUser()
  }, [raumId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="text-white text-2xl">Lade Raum...</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Habesha Dama 🇪🇹</h1>
          <p className="text-white mb-4">Bitte anmelden, um dem Raum beizutreten</p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-2xl mb-4">❌ {error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg"
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
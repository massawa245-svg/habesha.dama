'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import OnlineGame from '@/components/game/OnlineGame'
import OnlineCounter from '@/components/OnlineCounter'

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
      // 1. Prüfe ob User eingeloggt ist
      let { data: { user } } = await supabase.auth.getUser()
      
      // 2. Wenn nicht, als Gast einloggen!
      if (!user) {
        console.log('👤 Kein User, erstelle Gast...')
        const { data: guestData, error: guestError } = await supabase.auth.signInAnonymously()
        
        if (guestError || !guestData?.user) {
          console.error('❌ Gast-Login fehlgeschlagen:', guestError)
          setError('Konnte keinen Gast-Account erstellen')
          setLoading(false)
          return
        }
        
        user = guestData.user
        console.log('✅ Gast-Account erstellt:', user.id)
      }
      
      setUserId(user.id)

      // 3. Raum suchen
      console.log('🔍 Suche Raum:', raumId)
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('raum_id', raumId)
        .eq('status', 'waiting')
        .single()

      if (gameError || !game) {
        console.error('❌ Raum nicht gefunden:', gameError)
        setError('Raum nicht gefunden oder bereits voll')
        setLoading(false)
        return
      }

      console.log('✅ Raum gefunden:', game)

      // 4. Als Weiß beitreten
      const { error: joinError } = await supabase
        .from('games')
        .update({
          player_white: user.id,
          status: 'playing',
          current_turn: 'schwarz'
        })
        .eq('id', game.id)

      if (joinError) {
        console.error('❌ Fehler beim Beitreten:', joinError)
        setError('Fehler beim Beitreten')
        setLoading(false)
        return
      }

      console.log('🎮 Raum beigetreten, Spiel startet:', game.id)
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

  if (gameId && userId) {
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
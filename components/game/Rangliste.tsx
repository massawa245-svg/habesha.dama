'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Player {
  rank: number
  user_id: string
  username: string
  rating: number
  games_played: number
  wins: number
  win_rate: number
  streak: number
}

// 🔥 NEU: Korrektes Interface für die Datenbank-Antwort
interface PlayerRating {
  user_id: string
  rating: number
  games_played: number
  wins: number
  current_streak: number
  users: {
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  } | null
}

export default function RanglistePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadRangliste()
  }, [])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const loadRangliste = async () => {
    const { data } = await supabase
      .from('player_ratings')
      .select(`
        user_id,
        rating,
        games_played,
        wins,
        current_streak,
        users (email, user_metadata)
      `)
      .order('rating', { ascending: false })
      .limit(100)

    if (data) {
      const ranked = (data as unknown as PlayerRating[])
        .filter(p => p.games_played > 0)
        .map((p, index) => ({
          rank: index + 1,
          user_id: p.user_id,
          // 🔥 HIER die korrekte TypeScript-Syntax:
          username: p.users?.user_metadata?.full_name?.split(' ')[0] || 
                    p.users?.email?.split('@')[0] || 
                    'Spieler',
          rating: p.rating,
          games_played: p.games_played,
          wins: p.wins,
          win_rate: p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0,
          streak: p.current_streak
        }))
      setPlayers(ranked)
    }
    setLoading(false)
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-amber-300'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950">
      <div className="max-w-4xl mx-auto p-4">
        <Header />

        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🏆</span>
            <h1 className="text-3xl font-bold text-white">Rangliste</h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin text-5xl text-amber-300 mb-4">⏳</div>
              <p className="text-amber-300">Wird geladen...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.user_id}
                  onClick={() => router.push(`/profil/${player.user_id}`)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    player.user_id === currentUserId
                      ? 'bg-green-600/20 border-green-500/30'
                      : 'bg-amber-900/20 hover:bg-amber-800/30 border-amber-500/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 text-center font-bold ${getRankColor(player.rank)}`}>
                      #{player.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {player.username}
                        {player.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-green-400">(Du)</span>
                        )}
                      </p>
                      <p className="text-xs text-amber-300">
                        {player.games_played} Spiele • {player.win_rate}% Siege
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-xl">{player.rating}</p>
                      <p className={`text-xs ${
                        player.streak > 0 ? 'text-green-400' : 
                        player.streak < 0 ? 'text-red-400' : 
                        'text-amber-300'
                      }`}>
                        {player.streak > 0 ? `🔥 +${player.streak}` : 
                         player.streak < 0 ? `💔 ${player.streak}` : 
                         '➖'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
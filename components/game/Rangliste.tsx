'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Player {
  rank: number
  user_id: string
  username: string
  rating: number
  games_played: number
  wins: number
  losses: number
  win_rate: number
  streak: number
  avatar?: string
}

export default function Rangliste() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadCurrentUser()
    loadRangliste()
  }, [timeframe])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const loadRangliste = async () => {
    setLoading(true)
    
    // Zeitfilter für Rangliste (optional)
    let dateFilter = ''
    if (timeframe === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      dateFilter = weekAgo.toISOString()
    } else if (timeframe === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      dateFilter = monthAgo.toISOString()
    }

    // Spieler-Ratings laden
    let query = supabase
      .from('player_ratings')
      .select(`
        user_id,
        rating,
        games_played,
        wins,
        losses,
        current_streak,
        users (email, user_metadata)
      `)
      .order('rating', { ascending: false })
      .limit(100)

    const { data } = await query

    if (data) {
      const ranked = data
        .filter(p => p.games_played > 0) // Nur Spieler mit mind. 1 Spiel
        .map((p, index) => ({
          rank: index + 1,
          user_id: p.user_id,
          username: p.users?.user_metadata?.full_name?.split(' ')[0] || 
                    p.users?.email?.split('@')[0] || 
                    'Spieler',
          rating: p.rating,
          games_played: p.games_played,
          wins: p.wins,
          losses: p.losses,
          win_rate: p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0,
          streak: p.current_streak,
          avatar: p.users?.user_metadata?.avatar_url
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

  const getStreakDisplay = (streak: number) => {
    if (streak > 0) return `🔥 +${streak}`
    if (streak < 0) return `💔 ${streak}`
    return '➖'
  }

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            Rangliste
          </h2>
          <p className="text-amber-300 text-sm mt-1">
            Die besten Dama-Spieler
          </p>
        </div>
        
        {/* Zeitfilter */}
        <div className="flex gap-2 bg-amber-900/30 p-1 rounded-lg">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-all ${
              timeframe === 'all' 
                ? 'bg-amber-600 text-white' 
                : 'text-amber-300 hover:bg-amber-800/50'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 text-sm rounded-lg transition-all ${
              timeframe === 'month' 
                ? 'bg-amber-600 text-white' 
                : 'text-amber-300 hover:bg-amber-800/50'
            }`}
          >
            Monat
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 text-sm rounded-lg transition-all ${
              timeframe === 'week' 
                ? 'bg-amber-600 text-white' 
                : 'text-amber-300 hover:bg-amber-800/50'
            }`}
          >
            Woche
          </button>
        </div>
      </div>

      {/* Rangliste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl text-amber-300 mb-4">⏳</div>
          <p className="text-amber-300">Rangliste wird geladen...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Kopfzeile */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-amber-400 font-medium border-b border-amber-500/30">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Spieler</div>
            <div className="col-span-2 text-right">ELO</div>
            <div className="col-span-2 text-right">Siege</div>
            <div className="col-span-2 text-right">Form</div>
          </div>

          {/* Spieler-Liste */}
          {players.map((player) => (
            <div
              key={player.user_id}
              onClick={() => router.push(`/profil/${player.user_id}`)}
              className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg cursor-pointer transition-all ${
                player.user_id === currentUserId
                  ? 'bg-green-600/20 border border-green-500/30'
                  : 'bg-amber-900/20 hover:bg-amber-800/30 border border-amber-500/20'
              }`}
            >
              {/* Rang */}
              <div className={`col-span-1 font-bold ${getRankColor(player.rank)}`}>
                #{player.rank}
              </div>

              {/* Spieler */}
              <div className="col-span-5 flex items-center gap-2">
                {player.avatar ? (
                  <img 
                    src={player.avatar} 
                    alt={player.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-medium truncate">
                    {player.username}
                    {player.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-green-400">(Du)</span>
                    )}
                  </p>
                  <p className="text-xs text-amber-300">
                    {player.games_played} Spiele
                  </p>
                </div>
              </div>

              {/* ELO */}
              <div className="col-span-2 text-right">
                <p className="text-green-400 font-bold text-lg">
                  {player.rating}
                </p>
              </div>

              {/* Siege */}
              <div className="col-span-2 text-right">
                <p className="text-white">
                  {player.wins}
                </p>
                <p className="text-xs text-amber-300">
                  {player.win_rate}%
                </p>
              </div>

              {/* Form/Streak */}
              <div className="col-span-2 text-right">
                <p className={`text-sm ${
                  player.streak > 0 ? 'text-green-400' : 
                  player.streak < 0 ? 'text-red-400' : 
                  'text-amber-300'
                }`}>
                  {getStreakDisplay(player.streak)}
                </p>
              </div>
            </div>
          ))}

          {players.length === 0 && (
            <div className="text-center py-12 text-amber-300">
              <p className="text-2xl mb-2">🎮</p>
              <p>Noch keine Spieler in der Rangliste</p>
              <p className="text-sm mt-2">Spiele dein erstes Spiel um dabei zu sein!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
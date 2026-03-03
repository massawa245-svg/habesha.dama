'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface PlayerStats {
  id: number
  user_id: string
  rating: number
  games_played: number
  wins: number
  losses: number
  draws: number
  highest_rating: number
  current_streak: number
  best_streak: number
  last_game_at: string
  created_at: string
}

interface HistoryEntry {
  id: number
  old_rating: number
  new_rating: number
  change: number
  opponent_id: string
  opponent_rating: number
  result: 'win' | 'loss' | 'draw'
  created_at: string
}

export default function ProfilPage() {
  const { id } = useParams()
  const router = useRouter()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadProfile()
    loadHistory()
  }, [id])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const loadProfile = async () => {
    const { data } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('user_id', id)
      .single()

    setStats(data)
  }

  const loadHistory = async () => {
    const { data } = await supabase
      .from('rating_history')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    setHistory(data || [])
    setLoading(false)
  }

  const getWinRate = () => {
    if (!stats || stats.games_played === 0) return 0
    return Math.round((stats.wins / stats.games_played) * 100)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return 'text-yellow-400' // Champion
    if (rating >= 1800) return 'text-amber-400'  // Diamant
    if (rating >= 1600) return 'text-amber-300'  // Gold
    if (rating >= 1400) return 'text-amber-200'  // Silber
    if (rating >= 1200) return 'text-amber-100'  // Bronze
    return 'text-gray-400'                       // Neu
  }

  const getRatingTitle = (rating: number) => {
    if (rating >= 2000) return '🏆 Champion'
    if (rating >= 1800) return '💎 Diamant'
    if (rating >= 1600) return '🥇 Gold'
    if (rating >= 1400) return '🥈 Silber'
    if (rating >= 1200) return '🥉 Bronze'
    return '🆕 Neuling'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950">
        <div className="max-w-4xl mx-auto p-4">
          <Header />
          <div className="text-center py-12">
            <div className="animate-spin text-5xl text-amber-300 mb-4">⏳</div>
            <p className="text-amber-300">Profil wird geladen...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950">
      <div className="max-w-4xl mx-auto p-4">
        <Header />

        {/* Zurück-Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 text-amber-300 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Zurück
        </button>

        {/* Profil-Kopf */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Spieler-Profil</h1>
              <p className="text-amber-300 text-sm break-all">ID: {id?.toString().substring(0, 16)}...</p>
            </div>
            
            {/* Bearbeiten-Button (nur für eigenes Profil) */}
            {currentUserId === id && (
              <button
                onClick={() => router.push('/einstellungen')}
                className="bg-amber-800/50 hover:bg-amber-700/50 text-white px-4 py-2 rounded-lg text-sm transition-all border border-amber-500/30"
              >
                ⚙️ Einstellungen
              </button>
            )}
          </div>
        </div>

        {/* ELO-Karte */}
        <div className="bg-gradient-to-br from-amber-800/50 to-amber-950/50 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Aktuelles Rating */}
            <div className="text-center">
              <p className="text-amber-300 text-sm mb-2">ELO RATING</p>
              <p className={`text-5xl font-bold ${getRatingColor(stats?.rating || 1200)}`}>
                {stats?.rating || 1200}
              </p>
              <p className="text-amber-200 text-sm mt-2">
                {getRatingTitle(stats?.rating || 1200)}
              </p>
            </div>

            {/* Bestes Rating */}
            <div className="text-center border-l border-amber-500/30 pl-6">
              <p className="text-amber-300 text-sm mb-2">BESTES RATING</p>
              <p className="text-3xl font-bold text-green-400">
                {stats?.highest_rating || 1200}
              </p>
            </div>

            {/* Gewinnserie */}
            <div className="text-center border-l border-amber-500/30 pl-6">
              <p className="text-amber-300 text-sm mb-2">AKTUELLE SERIE</p>
              <p className={`text-3xl font-bold ${(stats?.current_streak || 0) > 0 ? 'text-green-400' : (stats?.current_streak || 0) < 0 ? 'text-red-400' : 'text-amber-300'}`}>
                {stats?.current_streak || 0}
              </p>
              <p className="text-amber-200 text-sm mt-2">
                Beste: {stats?.best_streak || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4 text-center">
            <p className="text-amber-300 text-sm">Spiele</p>
            <p className="text-3xl font-bold text-white">{stats?.games_played || 0}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-green-500/30 p-4 text-center">
            <p className="text-green-300 text-sm">Siege</p>
            <p className="text-3xl font-bold text-green-400">{stats?.wins || 0}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-red-500/30 p-4 text-center">
            <p className="text-red-300 text-sm">Verluste</p>
            <p className="text-3xl font-bold text-red-400">{stats?.losses || 0}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-4 text-center">
            <p className="text-amber-300 text-sm">Siegesrate</p>
            <p className="text-3xl font-bold text-amber-400">{getWinRate()}%</p>
          </div>
        </div>

        {/* Letzte Spiele */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6">
          <h2 className="text-2xl text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Letzte Spiele
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-amber-300 text-lg mb-2">🎮</p>
              <p className="text-amber-300">Noch keine Spiele gespielt</p>
              <p className="text-sm text-amber-300/50 mt-2">
                Spiele dein erstes Spiel um in der Rangliste zu erscheinen!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20 hover:bg-amber-900/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Ergebnis-Icon */}
                      <div className="w-10 h-10 rounded-full bg-amber-800/50 flex items-center justify-center">
                        {entry.result === 'win' && <span className="text-2xl">🏆</span>}
                        {entry.result === 'loss' && <span className="text-2xl">😢</span>}
                        {entry.result === 'draw' && <span className="text-2xl">🤝</span>}
                      </div>

                      {/* Details */}
                      <div>
                        <p className="text-white font-medium">
                          {entry.result === 'win' && 'Sieg'}
                          {entry.result === 'loss' && 'Niederlage'}
                          {entry.result === 'draw' && 'Unentschieden'}
                        </p>
                        <p className="text-amber-300 text-sm">
                          {new Date(entry.created_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* ELO-Änderung */}
                    <div className="text-right">
                      <p className="text-amber-300 text-sm">ELO</p>
                      <p className="text-sm">
                        <span className="text-gray-400">{entry.old_rating}</span>
                        <span className="text-amber-300 mx-1">→</span>
                        <span className={`font-bold ${entry.new_rating > entry.old_rating ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.new_rating}
                        </span>
                      </p>
                      <p className={`text-sm font-bold ${entry.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </p>
                    </div>
                  </div>

                  {/* Gegner-Info (optional) */}
                  {entry.opponent_id && (
                    <div className="mt-2 pt-2 border-t border-amber-500/20 text-xs text-amber-300">
                      Gegner-Rating: {entry.opponent_rating}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link zur Rangliste */}
        <div className="mt-6 text-center">
          <Link
            href="/rangliste"
            className="inline-block bg-amber-800/50 hover:bg-amber-700/50 text-white px-6 py-3 rounded-lg transition-all border border-amber-500/30"
          >
            🏆 Zur Rangliste
          </Link>
        </div>
      </div>
    </div>
  )
}
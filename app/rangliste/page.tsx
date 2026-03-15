'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Player {
  rank: number
  user_id: string
  username: string
  avatar_url: string
  rating: number
  games_played: number
  wins: number
  win_rate: number
  streak: number
}

interface PlayerRating {
  user_id: string
  rating: number
  games_played: number
  wins: number
  wins_streak: number
  users: {
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  } | null
}

// ── Liga System ──────────────────────────────────────────────────────────────
const LIGA_STUFEN = [
  { name: 'Anfänger',  min: 0,    icon: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.15)'  },
  { name: 'Kämpfer',   min: 1100, icon: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)' },
  { name: 'Krieger',   min: 1300, icon: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.15)'   },
  { name: 'Meister',   min: 1500, icon: '💎', color: '#00cfff', bg: 'rgba(0,207,255,0.15)'   },
  { name: 'Legende',   min: 1800, icon: '👑', color: '#ff6b35', bg: 'rgba(255,107,53,0.15)'  },
]

function getLiga(rating: number) {
  return [...LIGA_STUFEN].reverse().find(l => rating >= l.min) || LIGA_STUFEN[0]
}

// ── Top 3 Podest ─────────────────────────────────────────────────────────────
function TopDrei({ players }: { players: Player[] }) {
  if (players.length < 1) return null

  const order = [1, 0, 2] // Podest: 2. Platz links, 1. Platz mitte, 3. Platz rechts
  const heights = ['h-24', 'h-32', 'h-20']
  const sizes = ['w-16 h-16', 'w-20 h-20', 'w-14 h-14']
  const medals = ['🥈', '🥇', '🥉']
  const textSizes = ['text-lg', 'text-xl', 'text-base']

  return (
    <div className="flex items-end justify-center gap-3 mb-8 px-4">
      {order.map((idx, podestPos) => {
        const player = players[idx]
        if (!player) return <div key={podestPos} className="flex-1" />
        const liga = getLiga(player.rating)

        return (
          <div key={player.user_id} className="flex-1 flex flex-col items-center gap-2">
            {/* Krone für Platz 1 */}
            {podestPos === 1 && (
              <div className="text-3xl animate-bounce">👑</div>
            )}

            {/* Avatar */}
            <div className="relative">
              <div
                className={`${sizes[podestPos]} rounded-full overflow-hidden border-4`}
                style={{
                  borderColor: liga.color,
                  boxShadow: `0 0 20px ${liga.color}60`
                }}
              >
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl"
                    style={{ background: `linear-gradient(135deg, ${liga.color}40, transparent)` }}>
                    👤
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 text-lg">{medals[podestPos]}</div>
            </div>

            {/* Name */}
            <span className={`text-white font-bold ${textSizes[podestPos]} truncate max-w-[80px] text-center`}>
              {player.username}
            </span>

            {/* Rating */}
            <span className="font-bold text-sm" style={{ color: liga.color }}>
              {player.rating}
            </span>

            {/* Podest-Stufe */}
            <div
              className={`w-full ${heights[podestPos]} rounded-t-xl flex items-center justify-center`}
              style={{
                background: `linear-gradient(180deg, ${liga.color}30, ${liga.color}10)`,
                borderTop: `2px solid ${liga.color}60`,
                borderLeft: `1px solid ${liga.color}30`,
                borderRight: `1px solid ${liga.color}30`,
              }}
            >
              <span className="text-2xl font-black" style={{ color: liga.color }}>
                {idx + 1}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────────────────
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
        wins_streak,
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
          username:
            p.users?.user_metadata?.full_name?.split(' ')[0] ||
            p.users?.email?.split('@')[0] ||
            'Spieler',
          avatar_url:
            p.users?.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.user_id}`,
          rating: p.rating,
          games_played: p.games_played,
          wins: p.wins,
          win_rate: p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0,
          // ✅ FIX: wins_streak statt current_streak
          streak: p.wins_streak || 0,
        }))
      setPlayers(ranked)
    }
    setLoading(false)
  }

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 to-amber-950">
      <div className="max-w-4xl mx-auto p-4">
        <Header />

        {/* Titel */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🏆</span>
          <h1 className="text-3xl font-bold text-white">Rangliste</h1>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-6xl text-amber-300 mb-4">⏳</div>
            <p className="text-amber-300 text-lg">Wird geladen...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-amber-300 text-lg">Noch keine Spieler in der Rangliste.</p>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-6">

            {/* ── Top 3 Podest ── */}
            {top3.length >= 2 && <TopDrei players={top3} />}

            {/* ── Rest der Liste ── */}
            <div className="space-y-2">
              {(top3.length >= 2 ? rest : players).map((player) => {
                const liga = getLiga(player.rating)
                const isMe = player.user_id === currentUserId

                return (
                  <div
                    key={player.user_id}
                    onClick={() => router.push(`/profil/${player.user_id}`)}
                    className="p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3"
                    style={{
                      backgroundColor: isMe ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.2)',
                      borderColor: isMe ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    {/* Rang */}
                    <div className="w-8 text-center font-bold text-amber-400 text-sm shrink-0">
                      #{player.rank}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                      style={{ borderColor: liga.color }}
                    >
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${player.user_id}`
                        }}
                      />
                    </div>

                    {/* Name + Liga */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{player.username}</span>
                        {isMe && <span className="text-xs text-green-400 shrink-0">(Du)</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Liga Badge */}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{ color: liga.color, backgroundColor: liga.bg }}
                        >
                          {liga.icon} {liga.name}
                        </span>
                        <span className="text-amber-400/60 text-xs truncate">
                          {player.games_played} Spiele · {player.win_rate}% Siege
                        </span>
                      </div>
                    </div>

                    {/* Rating + Streak */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg" style={{ color: liga.color }}>
                        {player.rating}
                      </p>
                      <p className={`text-xs ${
                        player.streak > 0 ? 'text-green-400' :
                        player.streak < 0 ? 'text-red-400' :
                        'text-amber-500'
                      }`}>
                        {player.streak > 2
                          ? `🔥 ${player.streak} Serie`
                          : player.streak < 0
                          ? `💔 ${Math.abs(player.streak)} Niederlagen`
                          : '➖'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
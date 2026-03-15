'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { initialesBrett } from '@/lib/game/logic'
import { useTranslations } from 'next-intl'
import { usePresence } from '@/hooks/usePresence'

interface MatchmakingProps {
  userId: string
  onGameFound: (gameId: number, playerColor: 'schwarz' | 'weiss', isBotGame?: boolean) => void
}

const LIGA_STUFEN = [
  { name: 'Anfänger',  min: 0,    icon: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.4)'  },
  { name: 'Kämpfer',   min: 1100, icon: '🥈', color: '#c0c0c0', glow: 'rgba(192,192,192,0.4)' },
  { name: 'Krieger',   min: 1300, icon: '🥇', color: '#ffd700', glow: 'rgba(255,215,0,0.4)'   },
  { name: 'Meister',   min: 1500, icon: '💎', color: '#00cfff', glow: 'rgba(0,207,255,0.4)'   },
  { name: 'Legende',   min: 1800, icon: '👑', color: '#ff6b35', glow: 'rgba(255,107,53,0.4)'  },
]

function getLiga(rating: number) {
  return [...LIGA_STUFEN].reverse().find(l => rating >= l.min) || LIGA_STUFEN[0]
}

function randomDiceBearUrl() {
  const styles = ['adventurer', 'avataaars', 'big-smile', 'fun-emoji', 'personas']
  const style = styles[Math.floor(Math.random() * styles.length)]
  const seed = Math.random().toString(36).substring(2, 8)
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
}

export default function Matchmaking({ userId, onGameFound }: MatchmakingProps) {
  const t = useTranslations('Game')
  const supabase = createClient()

  const [searching, setSearching] = useState(false)
  const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null)
  const [searchTime, setSearchTime] = useState(0)
  const [showBotOption, setShowBotOption] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const [opponentFound, setOpponentFound] = useState(false)

  const [myAvatar, setMyAvatar] = useState('')
  const [myName, setMyName] = useState('Du')
  const [myRating, setMyRating] = useState(1200)
  const [opponentAvatar, setOpponentAvatar] = useState('')
  const [rotatingAvatars, setRotatingAvatars] = useState<string[]>([])
  const [currentAvatarIdx, setCurrentAvatarIdx] = useState(0)

  // ✅ Presence Hook
  const { onlineCount, searchingCount, updateStatus } = usePresence(userId, 'online')

  // Eigene User-Daten laden
  useEffect(() => {
    const loadMyData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyAvatar(user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.id}`)
      setMyName(user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Du')
      const { data: rating } = await supabase.from('player_ratings').select('rating').eq('user_id', user.id).single()
      setMyRating(rating?.rating || 1200)
    }
    loadMyData()
  }, [])

  // Rotierende Avatare
  useEffect(() => {
    if (!searching) return
    const avatars = Array.from({ length: 6 }, () => randomDiceBearUrl())
    setRotatingAvatars(avatars)
    setCurrentAvatarIdx(0)
    const interval = setInterval(() => setCurrentAvatarIdx(prev => (prev + 1) % avatars.length), 800)
    return () => clearInterval(interval)
  }, [searching])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (searching) {
      interval = setInterval(() => setSearchTime(prev => prev + 1), 1000)
    } else {
      setSearchTime(0)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [searching])

  const cleanupOldGames = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    await supabase.from('games').delete().eq('status', 'waiting').lt('created_at', fiveMinutesAgo)
  }

  const startSearch = async () => {
    setSearching(true)
    setShowBotOption(false)
    setOpponentFound(false)

    // ✅ Status auf "searching" setzen
    await updateStatus('searching')

    try {
      await cleanupOldGames()

      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      const { data: openGames } = await supabase
        .from('games').select('*').eq('status', 'waiting')
        .gt('created_at', oneMinuteAgo).order('created_at', { ascending: true }).limit(5)

      const availableGame = openGames?.find(game => game.player_black !== userId)

      if (availableGame) {
        const { data: oppUser } = await supabase
          .from('users').select('user_metadata').eq('id', availableGame.player_black).single()
        setOpponentAvatar(oppUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${availableGame.player_black}`)
        setOpponentFound(true)

        const { error } = await supabase.from('games').update({
          player_white: userId, status: 'playing', current_turn: 'schwarz'
        }).eq('id', availableGame.id).eq('status', 'waiting')

        if (!error) {
          await updateStatus('playing') // ✅
          setTimeout(() => {
            onGameFound(availableGame.id, 'weiss', false)
            setSearching(false)
          }, 1500)
          return
        }
      }

      const { data: newGame, error: createError } = await supabase
        .from('games').insert({
          player_black: userId,
          player_white: null,
          status: 'waiting',
          current_turn: 'schwarz',
          board: JSON.stringify(initialesBrett()),
          created_at: new Date().toISOString()
        }).select().single()

      if (createError || !newGame) {
        alert('Fehler beim Erstellen des Spiels.')
        setSearching(false)
        await updateStatus('online')
        return
      }

      setCurrentGameId(newGame.id)

      let waited = 0
      const maxWait = 25

      const waitInterval = setInterval(async () => {
        waited++
        const { data } = await supabase
          .from('games').select('status, player_white').eq('id', newGame.id).maybeSingle()

        if (!data) {
          clearInterval(waitInterval)
          setSearching(false)
          await updateStatus('online')
          return
        }

        if (data.status === 'playing' && data.player_white) {
          const { data: oppUser } = await supabase
            .from('users').select('user_metadata').eq('id', data.player_white).single()
          setOpponentAvatar(oppUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.player_white}`)
          setOpponentFound(true)
          clearInterval(waitInterval)

          await updateStatus('playing') // ✅
          setTimeout(() => {
            onGameFound(newGame.id, 'schwarz', false)
            setSearching(false)
          }, 1500)
        }

        if (waited >= maxWait && !showBotOption) {
          clearInterval(waitInterval)
          setShowBotOption(true)
        }
      }, 1000)

    } catch (error) {
      console.error('❌ Fehler:', error)
      setSearching(false)
      await updateStatus('online')
    }
  }

  const startBotGame = async () => {
    if (!currentGameId) return
    setOpponentAvatar('https://api.dicebear.com/7.x/bottts/svg?seed=habeshabot')
    setOpponentFound(true)

    const { error } = await supabase.from('games').update({ status: 'playing' }).eq('id', currentGameId)
    if (error) { alert('Fehler beim Starten des Bot-Spiels.'); return }

    localStorage.setItem(`bot_game_${currentGameId}`, 'true')
    await updateStatus('playing') // ✅
    setTimeout(() => {
      onGameFound(currentGameId, 'schwarz', true)
      setSearching(false)
      setShowBotOption(false)
    }, 1200)
  }

  const cancelSearch = async () => {
    if (gameChannel) gameChannel.unsubscribe()
    if (currentGameId) {
      await supabase.from('games').delete().eq('id', currentGameId).eq('status', 'waiting')
    }
    await updateStatus('online') // ✅
    setSearching(false)
    setSearchTime(0)
    setShowBotOption(false)
    setCurrentGameId(null)
    setOpponentFound(false)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const liga = getLiga(myRating)

  // ── HAUPT-ANSICHT ────────────────────────────────────────────────────────────
  if (!searching) {
    return (
      <div className="space-y-3">
        {/* ✅ Online Counter */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-green-500/20">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-60" />
            </div>
            <span className="text-green-400 text-sm font-medium">{onlineCount} online</span>
          </div>
          {searchingCount > 0 && (
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-amber-500/20">
              <span className="text-amber-300 text-sm">⚔️ {searchingCount} suchen gerade</span>
            </div>
          )}
        </div>

        <button
          onClick={startSearch}
          className="w-full bg-gradient-to-r from-green-600 to-green-500
                     hover:from-green-500 hover:to-green-400
                     text-white text-xl sm:text-2xl font-bold
                     px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl
                     transform hover:scale-[1.02] transition-all
                     border-2 border-green-400
                     flex items-center justify-center gap-4 min-h-[80px]"
        >
          <span className="text-3xl">⚔️</span>
          <span>{t('findOpponent')}</span>
          <span className="text-2xl opacity-60">→</span>
        </button>
      </div>
    )
  }

  // ── SUCH-ANSICHT (Liga-Design) ───────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-600/50"
        style={{
          background: 'linear-gradient(160deg, #3d1a00 0%, #5c2a00 40%, #3d1a00 100%)',
          boxShadow: `0 0 40px ${liga.glow}, 0 8px 32px rgba(0,0,0,0.5)`
        }}
      >
        {/* Dekorative Ecken */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/60 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/60 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/60 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/60 rounded-br-2xl" />

        <div className="relative z-10 p-6">

          {/* Liga + Online Counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{ background: `linear-gradient(135deg, ${liga.glow}, transparent)`, borderColor: liga.color + '60' }}
            >
              <span className="text-xl">{liga.icon}</span>
              <span className="font-bold text-lg" style={{ color: liga.color }}>{liga.name}</span>
            </div>

            {/* ✅ Online Counter während Suche */}
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-60" />
              </div>
              <span className="text-green-400 text-xs">{onlineCount} online</span>
              {searchingCount > 0 && (
                <span className="text-amber-300 text-xs">· ⚔️ {searchingCount} suchen</span>
              )}
            </div>
          </div>

          {/* VS Bereich */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Eigener Avatar */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4"
                  style={{ borderColor: liga.color, boxShadow: `0 0 20px ${liga.glow}` }}
                >
                  {myAvatar ? (
                    <img src={myAvatar} alt={myName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-800 flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-amber-900" />
              </div>
              <span className="text-white font-bold text-sm truncate max-w-[80px] text-center">{myName}</span>
              <span className="text-amber-400 text-xs">{myRating} Pkt</span>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-3xl font-black text-amber-300"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.8)' }}>VS</div>
              <div className="text-amber-500/60 text-xs">{formatTime(searchTime)}</div>
            </div>

            {/* Gegner Avatar */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-500`}
                  style={{
                    borderColor: opponentFound ? '#22c55e' : '#f59e0b',
                    boxShadow: opponentFound ? '0 0 20px rgba(34,197,94,0.5)' : '0 0 20px rgba(245,158,11,0.3)'
                  }}
                >
                  {opponentFound ? (
                    <img src={opponentAvatar} alt="Gegner" className="w-full h-full object-cover" />
                  ) : rotatingAvatars.length > 0 ? (
                    <img key={currentAvatarIdx} src={rotatingAvatars[currentAvatarIdx]}
                      alt="Suche..." className="w-full h-full object-cover transition-opacity duration-300" />
                  ) : (
                    <div className="w-full h-full bg-amber-900 flex items-center justify-center text-3xl animate-pulse">❓</div>
                  )}
                </div>
                {!opponentFound && (
                  <div className="absolute -inset-1 rounded-full border-2 border-amber-400/40 animate-ping" />
                )}
              </div>
              <span className="text-amber-300 font-bold text-sm text-center">
                {opponentFound ? 'Gefunden! 🎉' : 'Wird gesucht...'}
              </span>
              {!opponentFound ? (
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <div className="text-green-400 text-xl animate-bounce">✓</div>
              )}
            </div>
          </div>

          {/* Fortschrittsbalken */}
          <div className="w-full bg-amber-950/80 h-2 rounded-full mb-4 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min((searchTime / 25) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${liga.color}, #22c55e)`
              }}
            />
          </div>

          {/* Bot Option */}
          {showBotOption && (
            <div className="mb-4 p-4 rounded-xl border border-amber-600/30 bg-amber-900/30 text-center">
              <p className="text-amber-300 text-sm mb-3">⏱️ Kein Gegner gefunden — gegen Bot spielen?</p>
              <button onClick={startBotGame}
                className="w-full bg-gradient-to-r from-purple-700 to-purple-600
                           hover:from-purple-600 hover:to-purple-500
                           text-white px-6 py-3 rounded-xl font-bold
                           transition-all border border-purple-500/40
                           flex items-center justify-center gap-2"
              >
                <span className="text-xl">🤖</span>
                Gegen Bot spielen
              </button>
            </div>
          )}

          {/* Abbrechen */}
          <button onClick={cancelSearch}
            className="w-full bg-red-900/40 hover:bg-red-800/60 text-red-300
                       px-6 py-3 rounded-xl transition-all border border-red-700/30 font-medium"
          >
            {t('cancel')}
          </button>

        </div>
      </div>
    </div>
  )
}
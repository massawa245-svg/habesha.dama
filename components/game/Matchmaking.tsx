'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { initialesBrett } from '@/lib/game/logic'
import { useTranslations } from 'next-intl'

interface MatchmakingProps {
  userId: string
  onGameFound: (gameId: number, playerColor: 'schwarz' | 'weiss') => void
}

export default function Matchmaking({ userId, onGameFound }: MatchmakingProps) {
  const t = useTranslations('Game')  // ← WICHTIG: 'Game' statt 'Home'!
  const [searching, setSearching] = useState(false)
  const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  const startSearch = async () => {
    setSearching(true)
    console.log('🔍 Suche Gegner...')

    const { data: openGames } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'waiting')
      .limit(1)

    if (openGames && openGames.length > 0) {
      const game = openGames[0]
      const { error } = await supabase
        .from('games')
        .update({ 
          player_white: userId, 
          status: 'playing',
          current_turn: 'schwarz'
        })
        .eq('id', game.id)

      if (!error) {
        onGameFound(game.id, 'weiss')
        setSearching(false)
      }
    } else {
      const { data: newGame, error } = await supabase
        .from('games')
        .insert({
          player_black: userId,
          player_white: null,
          status: 'waiting',
          current_turn: 'schwarz',
          board: JSON.stringify(initialesBrett())
        })
        .select()
        .single()

      if (error) {
        console.error('Fehler beim Erstellen:', error)
        setSearching(false)
        return
      }

      const channel = supabase.channel(`game-${newGame.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${newGame.id}`
          },
          (payload) => {
            if (payload.new.status === 'playing') {
              onGameFound(newGame.id, 'schwarz')
              channel.unsubscribe()
            }
          }
        )
        .subscribe()

      setGameChannel(channel)
    }
  }

  const cancelSearch = () => {
    if (gameChannel) {
      gameChannel.unsubscribe()
    }
    setSearching(false)
  }

    return (
    <div className="w-full">
      {!searching ? (
        <button
          onClick={startSearch}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 
                     hover:from-green-500 hover:to-green-400 
                     text-white text-xl sm:text-2xl font-bold 
                     px-8 py-6 rounded-xl
                     shadow-xl hover:shadow-2xl
                     transform hover:scale-[1.02] transition-all
                     border-2 border-green-400
                     flex items-center justify-center gap-4
                     min-h-[80px]"
        >
          <span className="text-3xl">⚔️</span>
          <span>{t('findOpponent')}</span>
          <span className="text-2xl opacity-60">→</span>
        </button>
      ) : (
        <div className="bg-amber-800/30 p-8 rounded-xl text-center border border-amber-500/30">
          <p className="text-white text-xl mb-4">{t('searching')}</p>
          <div className="animate-spin text-5xl mb-6 text-amber-300">⏳</div>
          <button
            onClick={cancelSearch}
            className="bg-red-600/50 hover:bg-red-700/70 text-white px-6 py-3 rounded-lg transition-all border border-red-400/30"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  )
}

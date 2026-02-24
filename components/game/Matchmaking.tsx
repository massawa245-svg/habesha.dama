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
    <div className="bg-amber-800/50 p-8 rounded-xl text-center max-w-md mx-auto">
      {!searching ? (
        <button
          onClick={startSearch}
          className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl hover:bg-green-700 transition-colors w-full"
        >
          🔍 {t('findOpponent')}
        </button>
      ) : (
        <div>
          <p className="text-white text-xl mb-4">{t('searching')}</p>
          <div className="animate-spin text-5xl mb-6">⏳</div>
          <button
            onClick={cancelSearch}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
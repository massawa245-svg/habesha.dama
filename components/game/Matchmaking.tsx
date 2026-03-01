'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { initialesBrett } from '@/lib/game/logic'
import { useTranslations } from 'next-intl'

interface MatchmakingProps {
  userId: string
  onGameFound: (gameId: number, playerColor: 'schwarz' | 'weiss', isBotGame?: boolean) => void
}

export default function Matchmaking({ userId, onGameFound }: MatchmakingProps) {
  const t = useTranslations('Game')
  const [searching, setSearching] = useState(false)
  const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null)
  const [searchTime, setSearchTime] = useState(0)
  const [waitingPlayers, setWaitingPlayers] = useState(0)
  const [showBotOption, setShowBotOption] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const supabase = createClient()

  // Timer für Suchdauer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (searching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1)
      }, 1000)
    } else {
      setSearchTime(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [searching])

  // Prüfe alle 3 Sekunden wie viele Spieler warten
  useEffect(() => {
    if (!searching) return
    
    const checkWaitingPlayers = setInterval(async () => {
      try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
        
        const { data, error } = await supabase
          .from('games')
          .select('id')
          .eq('status', 'waiting')
          .gt('created_at', twoMinutesAgo)
        
        if (error) {
          console.error('❌ Fehler beim Abrufen der Warteschlange:', error)
          return
        }
        
        setWaitingPlayers(data?.length || 0)
      } catch (err) {
        console.error('❌ Ausnahme in Warteschlangen-Prüfung:', err)
      }
    }, 3000)
    
    return () => clearInterval(checkWaitingPlayers)
  }, [searching, supabase])

  // Aufräumen alter Spiele
  const cleanupOldGames = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      await supabase
        .from('games')
        .delete()
        .eq('status', 'waiting')
        .lt('created_at', fiveMinutesAgo)
    } catch (err) {
      console.error('❌ Fehler beim Aufräumen alter Spiele:', err)
    }
  }

  const startSearch = async () => {
    setSearching(true)
    setShowBotOption(false)
    console.log('🔍 Suche echten Gegner...')

    try {
      // Prüfe Datenbankverbindung zuerst
      const { error: testError } = await supabase
        .from('games')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('❌ Datenbank nicht erreichbar:', testError)
        alert('Datenbank-Fehler. Bitte später erneut versuchen.')
        setSearching(false)
        return
      }

      await cleanupOldGames()

      // Nach offenen und frischen Spielen suchen
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      
      const { data: openGames, error: searchError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting')
        .gt('created_at', oneMinuteAgo)
        .order('created_at', { ascending: true })
        .limit(5)

      if (searchError) {
        console.error('❌ Fehler bei der Spielsuche:', searchError)
        setSearching(false)
        return
      }

      console.log('📊 Frische offene Spiele:', openGames?.length || 0)

      // Prüfen ob es ein Spiel gibt, das NICHT von mir ist
      const availableGame = openGames?.find(game => game.player_black !== userId)

      if (availableGame) {
        console.log('🎮 Echter Gegner gefunden! Trete bei:', availableGame.id)
        
        const { error } = await supabase
          .from('games')
          .update({ 
            player_white: userId, 
            status: 'playing',
            current_turn: 'schwarz'
          })
          .eq('id', availableGame.id)
          .eq('status', 'waiting')

        if (!error) {
          console.log('✅ Erfolgreich beigetreten!')
          setTimeout(() => {
            onGameFound(availableGame.id, 'weiss', false)
            setSearching(false)
          }, 500)
          return
        } else {
          console.error('❌ Fehler beim Beitreten:', error)
        }
      }

      // Kein echter Gegner gefunden - eigenes Spiel erstellen
      console.log('🆕 Kein Gegner da, erstelle eigenes Spiel...')
      
      const newGameData = {
        player_black: userId,
        player_white: null,
        status: 'waiting',
        current_turn: 'schwarz',
        board: JSON.stringify(initialesBrett()),
        created_at: new Date().toISOString()
      }
      
      console.log('📝 Erstelle Spiel mit Daten:', newGameData)
      
      const { data: newGame, error: createError } = await supabase
        .from('games')
        .insert(newGameData)
        .select()
        .single()

      if (createError) {
        console.error('❌ Fehler beim Erstellen:', createError)
        if (createError.code === '42501') {
          alert('Berechtigungsfehler. Bitte neu einloggen.')
        } else if (createError.code === '23505') {
          alert('Ein Spiel mit dieser ID existiert bereits. Bitte erneut versuchen.')
        } else {
          alert(`Fehler: ${createError.message || 'Unbekannter Fehler'}`)
        }
        setSearching(false)
        return
      }

      if (!newGame) {
        console.error('❌ Keine Daten zurückbekommen')
        alert('Fehler beim Erstellen des Spiels. Keine Daten erhalten.')
        setSearching(false)
        return
      }

      console.log('✅ Eigenes Spiel erstellt:', newGame)
      setCurrentGameId(newGame.id)

       // Auf echten Gegner warten (maximal 25 Sekunden)
let waited = 0
const maxWait = 25

const waitInterval = setInterval(async () => {
  try {
    waited++
    
    // maybeSingle() statt single() - gibt null zurück wenn nicht gefunden
    const { data, error } = await supabase
      .from('games')
      .select('status')
      .eq('id', newGame.id)
      .maybeSingle()
    
    if (error) {
      console.error('❌ Fehler beim Prüfen des Spielstatus:', error)
      return
    }
    
    // Wenn Spiel nicht existiert (wurde gelöscht)
    if (!data) {
      console.log('⚠️ Spiel wurde gelöscht, breche Suche ab')
      clearInterval(waitInterval)
      setSearching(false)
      setShowBotOption(false)
      return
    }
    
    // Wenn Gegner beigetreten ist
    if (data.status === 'playing') {
      console.log('🎮 Echter Gegner gefunden!')
      clearInterval(waitInterval)
      onGameFound(newGame.id, 'schwarz', false)
      setSearching(false)
    }
    
      // Nach 25 Sekunden Bot-Option anzeigen
      if (waited >= maxWait && !showBotOption) {
        clearInterval(waitInterval)
       setShowBotOption(true)
      }
    } catch (err) {
     console.error('❌ Ausnahme beim Warten auf Gegner:', err)
    }
    }, 1000)

    } catch (error) {
      console.error('❌ Unerwarteter Fehler:', error)
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte Seite neu laden.')
      setSearching(false)
    }
  }

  // ✅ KORRIGIERTE Bot-Spiel starten Funktion
  const startBotGame = async () => {
    if (!currentGameId) {
      console.error('❌ Keine GameId für Bot-Spiel')
      return
    }
    
    console.log('🤖 Bot-Spiel wird gestartet...')
    
    try {
      // NUR status updaten - is_bot_game gibt es nicht in der DB!
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'playing'
        })
        .eq('id', currentGameId)
      
      if (error) {
        console.error('❌ Fehler beim Bot-Update:', error)
        alert('Fehler beim Starten des Bot-Spiels.')
        return
      }
      
      // Bot-Status im localStorage speichern
      localStorage.setItem(`bot_game_${currentGameId}`, 'true')
      
      onGameFound(currentGameId, 'schwarz', true)
      setSearching(false)
      setShowBotOption(false)
    } catch (error) {
      console.error('❌ Fehler beim Bot-Start:', error)
      alert('Fehler beim Starten des Bot-Spiels.')
    }
  }

  const cancelSearch = async () => {
    if (gameChannel) {
      gameChannel.unsubscribe()
    }
    
    // Eigenes Spiel löschen falls vorhanden
    if (currentGameId) {
      try {
        await supabase
          .from('games')
          .delete()
          .eq('id', currentGameId)
          .eq('status', 'waiting')
      } catch (err) {
        console.error('❌ Fehler beim Löschen des Spiels:', err)
      }
    }
    
    setSearching(false)
    setSearchTime(0)
    setShowBotOption(false)
    setCurrentGameId(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
          <p className="text-white text-xl mb-2">{t('searching')}</p>
          <p className="text-amber-300 text-sm mb-2">
            Zeit: {formatTime(searchTime)} / 0:30
          </p>
          
          <p className="text-green-400 text-sm mb-4">
            Spieler in Warteschlange: {waitingPlayers}
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="animate-spin text-5xl text-amber-300">⏳</div>
          </div>

          <div className="w-full bg-amber-900/50 h-2 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${(searchTime / 30) * 100}%` }}
            />
          </div>

          {showBotOption && (
            <div className="mb-4 space-y-2">
              <p className="text-yellow-400 text-sm">
                ⏱️ Kein Gegner gefunden
              </p>
              <button
                onClick={startBotGame}
                className="w-full bg-purple-600 hover:bg-purple-700 
                           text-white px-6 py-3 rounded-lg 
                           transition-all border border-purple-400/30
                           flex items-center justify-center gap-2"
              >
                <span className="text-xl">🤖</span>
                Gegen Bot spielen
              </button>
            </div>
          )}

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
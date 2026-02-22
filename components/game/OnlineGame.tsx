'use client'

import { useState, useEffect } from 'react'
import DamaBoard from '@/components/board/DamaBoard'
import { createClient } from '@/lib/supabase/client'
import type { Position, Stein } from '@/lib/game/types'
import { initialesBrett, hatWeitereFresszuege } from '@/lib/game/logic'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface OnlineGameProps {
  gameId: number
  userId: string
  playerColor: 'schwarz' | 'weiss'
}

export default function OnlineGame({ gameId, userId, playerColor }: OnlineGameProps) {
  const [brett, setBrett] = useState<Stein[][]>(initialesBrett)
  const [currentTurn, setCurrentTurn] = useState<'schwarz' | 'weiss'>('schwarz')
  const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null)
  const [winner, setWinner] = useState<'schwarz' | 'weiss' | null>(null)
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false)
  const supabase = createClient()

  const checkWinner = (aktuellesBrett: Stein[][]): 'schwarz' | 'weiss' | null => {
    let schwarz = 0
    let weiss = 0
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const stein = aktuellesBrett[row][col]
        if (stein) {
          if (stein.spieler === 'schwarz') schwarz++
          else weiss++
        }
      }
    }
    
    if (schwarz === 0) return 'weiss'
    if (weiss === 0) return 'schwarz'
    return null
  }

  useEffect(() => {
    const loadGame = async () => {
      const { data } = await supabase
        .from('games')
        .select('board, current_turn')
        .eq('id', gameId)
        .single()

      if (data) {
        const parsedBoard = typeof data.board === 'string' 
          ? JSON.parse(data.board) 
          : data.board
        setBrett(parsedBoard)
        setCurrentTurn(data.current_turn)
        
        const gameWinner = checkWinner(parsedBoard)
        if (gameWinner) {
          setWinner(gameWinner)
          setShowWinnerAnimation(true)
        }
      }
    }
    loadGame()
  }, [gameId, supabase])

  useEffect(() => {
    const channel = supabase.channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        (payload) => {
          console.log('🔄 Spiel-Update erhalten:', payload.new)
          
          if (payload.new.board) {
            const parsedBoard = typeof payload.new.board === 'string' 
              ? JSON.parse(payload.new.board) 
              : payload.new.board
            setBrett(parsedBoard)
            
            const gameWinner = checkWinner(parsedBoard)
            if (gameWinner) {
              setWinner(gameWinner)
              setShowWinnerAnimation(true)
            }
          }
          setCurrentTurn(payload.new.current_turn)
        }
      )
      .subscribe()

    setGameChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [gameId, supabase])

  const handleZug = async (von: Position, nach: Position) => {
    console.log('📤 Sende Zug:', von, nach)

    const neuesBrett = brett.map(row => [...row])
    const stein = neuesBrett[von.row][von.col]
    if (!stein) return
    
    neuesBrett[von.row][von.col] = null
    neuesBrett[nach.row][nach.col] = stein

    const rowDiff = Math.abs(nach.row - von.row)
    const colDiff = Math.abs(nach.col - von.col)
    let gefressen = false
    
    if (rowDiff === 2 && colDiff === 2) {
      const mittelRow = (von.row + nach.row) / 2
      const mittelCol = (von.col + nach.col) / 2
      neuesBrett[mittelRow][mittelCol] = null
      gefressen = true
    }

    if (!stein.istKoenig) {
      if (playerColor === 'schwarz' && nach.row === 7) {
        neuesBrett[nach.row][nach.col] = { ...stein, istKoenig: true }
      } else if (playerColor === 'weiss' && nach.row === 0) {
        neuesBrett[nach.row][nach.col] = { ...stein, istKoenig: true }
      }
    }

    const weitereFresszuege = gefressen && hatWeitereFresszuege(neuesBrett, nach, playerColor, stein.istKoenig)
    const nextTurn = weitereFresszuege ? playerColor : (currentTurn === 'schwarz' ? 'weiss' : 'schwarz')

    const { error } = await supabase
      .from('games')
      .update({ 
        current_turn: nextTurn,
        board: JSON.stringify(neuesBrett)
      })
      .eq('id', gameId)

    if (error) {
      console.error('Fehler beim Aktualisieren des Spiels:', error)
      return
    }

    setBrett(neuesBrett)
    setCurrentTurn(nextTurn)
    
    const gameWinner = checkWinner(neuesBrett)
    if (gameWinner) {
      setWinner(gameWinner)
      setShowWinnerAnimation(true)
    }
  }

  if (winner && showWinnerAnimation) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-slide-in">
        <div className="bg-gradient-to-br from-amber-800 to-amber-950 p-12 rounded-3xl shadow-2xl text-center border border-amber-500/30 max-w-md mx-4">
          <div className="text-8xl mb-6 animate-bounce">
            {winner === playerColor ? '🏆' : '😢'}
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            {winner === playerColor ? 'DU HAST GEWONNEN!' : 'Du hast verloren...'}
          </h2>
          <p className="text-2xl text-amber-300 mb-8">
            {winner === 'schwarz' ? '⚫ Schwarz' : '⚪ Weiß'} hat gewonnen!
          </p>
          <button
            onClick={() => {
              setShowWinnerAnimation(false)
              window.location.reload()
            }}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-green-500 hover:to-green-400 transition-all transform hover:scale-105 shadow-xl"
          >
            ⚔️ Neues Spiel ⚔️
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Spieler-Info mit Animation */}
      <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-amber-500/30 transform transition-all duration-300 hover:scale-105">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${playerColor === 'schwarz' ? 'bg-gradient-to-br from-gray-800 to-black' : 'bg-gradient-to-br from-gray-100 to-white'} border-2 border-amber-500 shadow-xl animate-pulse-glow`} />
            <div>
              <p className="text-amber-300 text-sm">Du spielst</p>
              <p className={`text-2xl font-bold ${playerColor === 'schwarz' ? 'text-white' : 'text-gray-200'}`}>
                {playerColor === 'schwarz' ? '⚫ SCHWARZ' : '⚪ WEISS'}
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-amber-300 text-sm">Aktueller Zug</p>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${currentTurn === 'schwarz' ? 'bg-black' : 'bg-white'} border border-amber-500 ${currentTurn === playerColor ? 'animate-pulse' : ''}`} />
              <span className={`text-2xl font-bold ${currentTurn === 'schwarz' ? 'text-white' : 'text-gray-200'}`}>
                {currentTurn === 'schwarz' ? '⚫ SCHWARZ' : '⚪ WEISS'}
              </span>
              {currentTurn === playerColor && (
                <span className="ml-2 text-yellow-300 animate-pulse">⭐</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brett */}
      <DamaBoard
        brett={brett}
        setBrett={setBrett}
        meinSpieler={playerColor}
        aktuellerSpieler={currentTurn}
        spielBeendet={winner !== null}
        onZug={handleZug}
      />
    </div>
  )
}
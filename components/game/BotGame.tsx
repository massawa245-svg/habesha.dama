'use client'

import { useState, useEffect, useCallback } from 'react'
import DamaBoard from '../board/DamaBoard'
import { createClient } from '@/lib/supabase/client'
import type { Position, Stein, Player } from '@/lib/game/types'
import { initialesBrett, hatWeitereFresszuege, hatFressmoeglichkeit } from '@/lib/game/logic'
import { DamaBot } from '@/lib/game/bot'

interface BotGameProps {
  gameId: number
  userId: string
  playerColor: 'schwarz' | 'weiss'
  initialBrett?: Stein[][]
  initialTurn?: 'schwarz' | 'weiss'
}

export default function BotGame({ 
  gameId, 
  userId, 
  playerColor,
  initialBrett,
  initialTurn
}: BotGameProps) {
  const [brett, setBrett] = useState<Stein[][]>(initialBrett || initialesBrett)
  const [currentTurn, setCurrentTurn] = useState<'schwarz' | 'weiss'>(initialTurn || 'schwarz')
  const [winner, setWinner] = useState<'schwarz' | 'weiss' | null>(null)
  const [botThinking, setBotThinking] = useState(false)
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false)
  const [showRematchDialog, setShowRematchDialog] = useState(false)
  
  // Zeit-Überwachung
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now())
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const bot = new DamaBot('medium')

  const isMyTurn = currentTurn === playerColor
  const isBotTurn = currentTurn !== playerColor

  // 🔥 NEU: Prüfen ob das Spiel bereits beendet war (beim Laden)
  useEffect(() => {
    if (initialBrett && initialTurn) {
      console.log('📥 Bot-Spiel aus localStorage geladen')
      setBrett(initialBrett)
      setCurrentTurn(initialTurn)
      setLastMoveTime(Date.now())
      
      // Prüfen ob das Spiel bereits zu Ende ist
      const gameWinner = checkWinner(initialBrett)
      if (gameWinner) {
        console.log('🏆 Bereits beendetes Spiel geladen:', gameWinner)
        setWinner(gameWinner)
        setShowWinnerAnimation(true)
      }
    }
  }, [initialBrett, initialTurn])

  // 🔥 NEU: Spielstand im localStorage speichern (auch wenn beendet)
  useEffect(() => {
    if (!gameId || !userId || !playerColor) return

    const gameState = {
      gameId,
      userId,
      playerColor,
      brett,
      currentTurn,
      winner,                    // 🔥 Winner speichern!
      isBotGame: true,
      timestamp: Date.now()
    }
    
    localStorage.setItem(`game_${gameId}`, JSON.stringify(gameState))
    console.log('🤖 Bot-Spielstand gespeichert', { currentTurn, winner })
    
  }, [brett, currentTurn, gameId, userId, playerColor, winner])

  // 🔥 Zeit-Überwachung starten
  useEffect(() => {
    if (winner) return // Wenn schon gewonnen, nichts tun
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    const id = setTimeout(() => {
      console.log('⏰ Zeitüberschreitung! Kein Zug für 5 Minuten')
      
      if (currentTurn === 'schwarz') {
        console.log('🏆 Weiss gewinnt durch Zeitüberschreitung von Schwarz')
        setWinner('weiss')
      } else {
        console.log('🏆 Schwarz gewinnt durch Zeitüberschreitung von Weiss')
        setWinner('schwarz')
      }
      setShowWinnerAnimation(true)
    }, 5 * 60 * 1000)
    
    setTimeoutId(id)
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lastMoveTime, currentTurn, winner])

  // 🔥 Prüft ob Spieler noch Züge hat
  const hatSpielerZuege = (brett: Stein[][], spieler: 'schwarz' | 'weiss'): boolean => {
    console.log(`🔍 Prüfe ob ${spieler} noch Züge hat...`)
    
    if (hatFressmoeglichkeit(brett, spieler)) {
      console.log(`✅ ${spieler} kann fressen`)
      return true
    }
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const stein = brett[row][col]
        if (stein?.spieler === spieler) {
          const richtungen = [
            { row: -1, col: -1 }, { row: -1, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 1 }
          ]
          
          for (const dir of richtungen) {
            const nachRow = row + dir.row
            const nachCol = col + dir.col
            
            if (nachRow >= 0 && nachRow < 8 && nachCol >= 0 && nachCol < 8) {
              if (brett[nachRow][nachCol] === null) {
                if (!stein.istKoenig) {
                  if (spieler === 'schwarz' && dir.row > 0) {
                    console.log(`✅ ${spieler} kann normal ziehen`)
                    return true
                  }
                  if (spieler === 'weiss' && dir.row < 0) {
                    console.log(`✅ ${spieler} kann normal ziehen`)
                    return true
                  }
                } else {
                  console.log(`✅ ${spieler} (König) kann ziehen`)
                  return true
                }
              }
            }
          }
        }
      }
    }
    
    console.log(`❌ ${spieler} hat KEINE Züge mehr`)
    return false
  }

  // 🔥 Gewinner prüfen
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
    
    if (schwarz === 0) {
      console.log('🏆 Weiss gewinnt - Schwarz hat keine Steine mehr')
      return 'weiss'
    }
    if (weiss === 0) {
      console.log('🏆 Schwarz gewinnt - Weiss hat keine Steine mehr')
      return 'schwarz'
    }
    
    const spielerDran = currentTurn
    const kannZiehen = hatSpielerZuege(aktuellesBrett, spielerDran)
    
    if (!kannZiehen) {
      const gewinner = spielerDran === 'schwarz' ? 'weiss' : 'schwarz'
      console.log(`🏆 ${gewinner} gewinnt - ${spielerDran} ist gesperrt`)
      return gewinner
    }
    
    return null
  }

  // Bot-Zug ausführen
  useEffect(() => {
    if (!isBotTurn || winner || botThinking) return
    
    const makeBotMove = async () => {
      setBotThinking(true)
      console.log('🤖 Bot denkt nach...')
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const move = bot.calculateMove(brett, currentTurn)
      
      if (move) {
        console.log('🤖 Bot macht Zug:', move)
        await handleBotMove(move.von, move.nach)
      } else {
        console.log('🤖 Bot hat keine Züge mehr')
        const gameWinner = playerColor
        console.log(`🏆 Spieler gewinnt! ${gameWinner}`)
        setWinner(gameWinner)
        setShowWinnerAnimation(true)
      }
      
      setBotThinking(false)
    }
    
    makeBotMove()
  }, [isBotTurn, winner, botThinking, currentTurn])

  const handleBotMove = async (von: Position, nach: Position) => {
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
      if (currentTurn === 'schwarz' && nach.row === 7) {
        neuesBrett[nach.row][nach.col] = { ...stein, istKoenig: true }
      } else if (currentTurn === 'weiss' && nach.row === 0) {
        neuesBrett[nach.row][nach.col] = { ...stein, istKoenig: true }
      }
    }

    const weitereFresszuege = gefressen && hatWeitereFresszuege(neuesBrett, nach, currentTurn, stein.istKoenig)
    const nextTurn = weitereFresszuege ? currentTurn : (currentTurn === 'schwarz' ? 'weiss' : 'schwarz')

    setBrett(neuesBrett)
    setCurrentTurn(nextTurn)
    setLastMoveTime(Date.now())
    
    const gameWinner = checkWinner(neuesBrett)
    if (gameWinner) {
      setWinner(gameWinner)
      setShowWinnerAnimation(true)
    }
  }

  const handlePlayerMove = async (von: Position, nach: Position) => {
    if (!isMyTurn || winner) return
    
    const neuesBrett = brett.map(row => [...row])
    const stein = neuesBrett[von.row][von.col]
    if (!stein || stein.spieler !== playerColor) return
    
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

    setBrett(neuesBrett)
    setCurrentTurn(nextTurn)
    setLastMoveTime(Date.now())
    
    const gameWinner = checkWinner(neuesBrett)
    if (gameWinner) {
      setWinner(gameWinner)
      setShowWinnerAnimation(true)
    }
  }

  const handleRematch = () => {
    console.log('🔄 Rematch gestartet')
    setBrett(initialesBrett())
    setCurrentTurn('schwarz')
    setWinner(null)
    setShowWinnerAnimation(false)
    setShowRematchDialog(false)
    setLastMoveTime(Date.now())
    
    // Neuen GameId für Rematch? Oder einfach weiterspielen
    window.location.reload() // Einfachste Lösung
  }

  const handleBackToMenu = () => {
    // localStorage aufräumen
    const keys = Object.keys(localStorage)
    keys.filter(key => key.startsWith('game_')).forEach(key => localStorage.removeItem(key))
    localStorage.removeItem('currentGame')
    window.location.reload()
  }

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('👋 BotGame unmountet')
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  // Winner Animation mit Rematch Dialog
  if (winner && showWinnerAnimation) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-amber-800 to-amber-950 p-12 rounded-3xl shadow-2xl text-center border border-amber-500/30 max-w-md mx-4">
          <div className="text-8xl mb-6 animate-bounce">
            {winner === playerColor ? '🏆' : '🤖'}
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            {winner === playerColor ? 'DU HAST GEWONNEN!' : 'Bot hat gewonnen...'}
          </h2>
          <p className="text-2xl text-amber-300 mb-8">
            {winner === 'schwarz' ? '⚫ Schwarz' : '⚪ Weiß'} hat gewonnen!
          </p>
          
          {/* 🔥 NEU: Rematch Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleRematch}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-green-500 hover:to-green-400 transition-all transform hover:scale-105 shadow-xl"
            >
              ⚔️ Revanche spielen
            </button>
            
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-105 shadow-xl"
            >
              🏠 Zurück zum Menü
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info-Leiste */}
      <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-amber-500/30">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-amber-300">Du spielst</p>
            <p className={`text-2xl font-bold ${isMyTurn && !winner ? 'text-green-400 animate-pulse' : 'text-white'}`}>
              {playerColor === 'schwarz' ? '⚫ SCHWARZ' : '⚪ WEISS'}
            </p>
          </div>
          <div className="text-center">
            {botThinking && <p className="text-sm text-green-400 animate-pulse">🤖 Bot überlegt...</p>}
          </div>
          <div>
            <p className="text-amber-300">Bot spielt</p>
            <p className={`text-2xl font-bold ${isBotTurn && !winner ? 'text-green-400 animate-pulse' : 'text-white'}`}>
              {playerColor === 'schwarz' ? '⚪ WEISS' : '⚫ SCHWARZ'}
            </p>
          </div>
        </div>
        <div className="text-xs text-amber-400 text-center mt-2">
          ⏱️ 5 Minuten pro Zug
        </div>
      </div>

      {/* Spielbrett */}
      <DamaBoard
        brett={brett}
        setBrett={setBrett}
        meinSpieler={playerColor}
        aktuellerSpieler={currentTurn}
        spielBeendet={winner !== null}
        onZug={handlePlayerMove}
      />
    </div>
  )
}
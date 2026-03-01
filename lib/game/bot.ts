// lib/game/bot.ts

import { Position, Stein, Player } from './types'
import { istGueltigerZug, kannFressen } from './logic'

export type BotDifficulty = 'pro'

export class DamaBot {
  private difficulty: BotDifficulty = 'pro'
  
  constructor() {
    // Profi-Modus
  }

  calculateMove(brett: Stein[][], spieler: Player): { von: Position, nach: Position } | null {
    console.log(`🤖 Bot (PRO) berechnet Zug für:`, spieler)
    
    const captureMoves = this.findAllCaptureMoves(brett, spieler)
    if (captureMoves.length > 0) {
      // 90% bester Fresszug, 10% Überraschung
      if (Math.random() < 0.9) {
        return this.selectBestCaptureMove(captureMoves, brett, spieler)
      } else {
        return captureMoves[Math.floor(Math.random() * captureMoves.length)]
      }
    }
    
    const normalMoves = this.findAllNormalMoves(brett, spieler)
    if (normalMoves.length === 0) return null
    
    // 85% strategisch, 15% zufällig
    if (Math.random() < 0.85) {
      return this.selectBestStrategicMove(normalMoves, brett, spieler)
    } else {
      return normalMoves[Math.floor(Math.random() * normalMoves.length)]
    }
  }

  private findAllCaptureMoves(brett: Stein[][], spieler: Player): Array<{von: Position, nach: Position}> {
    const moves: Array<{von: Position, nach: Position}> = []
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const stein = brett[row][col]
        if (stein?.spieler === spieler) {
          const richtungen = [
            { row: -2, col: -2 }, { row: -2, col: 2 },
            { row: 2, col: -2 }, { row: 2, col: 2 }
          ]
          
          for (const dir of richtungen) {
            const nach = { row: row + dir.row, col: col + dir.col }
            if (nach.row >= 0 && nach.row < 8 && nach.col >= 0 && nach.col < 8) {
              if (kannFressen(brett, { row, col }, nach, spieler, stein.istKoenig)) {
                moves.push({ von: { row, col }, nach })
              }
            }
          }
        }
      }
    }
    return moves
  }

  private findAllNormalMoves(brett: Stein[][], spieler: Player): Array<{von: Position, nach: Position}> {
    const moves: Array<{von: Position, nach: Position}> = []
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const stein = brett[row][col]
        if (stein?.spieler === spieler) {
          const richtungen = [
            { row: -1, col: -1 }, { row: -1, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 1 }
          ]
          
          for (const dir of richtungen) {
            const nach = { row: row + dir.row, col: col + dir.col }
            if (nach.row >= 0 && nach.row < 8 && nach.col >= 0 && nach.col < 8) {
              if (istGueltigerZug(brett, { row, col }, nach, spieler, stein.istKoenig)) {
                moves.push({ von: { row, col }, nach })
              }
            }
          }
        }
      }
    }
    return moves
  }

  private selectBestCaptureMove(
    moves: Array<{von: Position, nach: Position}>, 
    brett: Stein[][],
    spieler: Player
  ): {von: Position, nach: Position} {
    
    let bestMove = moves[0]
    let maxCaptures = 1
    
    for (const move of moves) {
      const tempBrett = JSON.parse(JSON.stringify(brett))
      const stein = tempBrett[move.von.row][move.von.col]
      
      tempBrett[move.von.row][move.von.col] = null
      tempBrett[move.nach.row][move.nach.col] = stein
      
      const mittelRow = (move.von.row + move.nach.row) / 2
      const mittelCol = (move.von.col + move.nach.col) / 2
      tempBrett[mittelRow][mittelCol] = null
      
      // Prüfe weitere Fresszüge
      let captureCount = 1
      let currentPos = move.nach
      let currentStein = stein
      let maxDepth = 3 // Maximal 3 Fresszüge pro Runde
      let depth = 0
      
      while (depth < maxDepth) {
        const weitereFresser = this.findAllCaptureMovesFromPosition(
          tempBrett, 
          currentPos, 
          spieler, 
          currentStein.istKoenig
        )
        
        if (weitereFresser.length === 0) break
        
        // Nimm den ersten weiteren Fresszug
        const nextMove = weitereFresser[0]
        captureCount++
        depth++
        
        // Führe weiteren Fresszug aus
        tempBrett[currentPos.row][currentPos.col] = null
        tempBrett[nextMove.nach.row][nextMove.nach.col] = currentStein
        
        const nextMittelRow = (currentPos.row + nextMove.nach.row) / 2
        const nextMittelCol = (currentPos.col + nextMove.nach.col) / 2
        tempBrett[nextMittelRow][nextMittelCol] = null
        
        currentPos = nextMove.nach
      }
      
      if (captureCount > maxCaptures) {
        maxCaptures = captureCount
        bestMove = move
      }
    }
    
    return bestMove
  }

  private findAllCaptureMovesFromPosition(
    brett: Stein[][], 
    pos: Position, 
    spieler: Player,
    istKoenig: boolean
  ): Array<{von: Position, nach: Position}> {
    const moves: Array<{von: Position, nach: Position}> = []
    const richtungen = [
      { row: -2, col: -2 }, { row: -2, col: 2 },
      { row: 2, col: -2 }, { row: 2, col: 2 }
    ]
    
    for (const dir of richtungen) {
      const nach = { row: pos.row + dir.row, col: pos.col + dir.col }
      if (nach.row >= 0 && nach.row < 8 && nach.col >= 0 && nach.col < 8) {
        if (kannFressen(brett, pos, nach, spieler, istKoenig)) {
          moves.push({ von: pos, nach })
        }
      }
    }
    
    return moves
  }

  private selectBestStrategicMove(
    moves: Array<{von: Position, nach: Position}>, 
    brett: Stein[][],
    spieler: Player
  ): {von: Position, nach: Position} {
    
    let bestMove = moves[0]
    let bestScore = -999
    
    for (const move of moves) {
      let score = 0
      const stein = brett[move.von.row][move.von.col]
      
      // 1. Vorwärts (wichtig!)
      if (spieler === 'schwarz' && move.nach.row > move.von.row) score += 5
      if (spieler === 'weiss' && move.nach.row < move.von.row) score += 5
      
      // 2. König werden (sehr wichtig!)
      if (spieler === 'schwarz' && move.nach.row === 7) score += 10
      if (spieler === 'weiss' && move.nach.row === 0) score += 10
      
      // 3. Zentrum kontrollieren
      if (move.nach.col >= 2 && move.nach.col <= 5) score += 3
      
      // 4. Rand vermeiden
      if (move.nach.col === 0 || move.nach.col === 7) score -= 2
      
      // 5. Prüfe ob der Zug sicher ist
      const tempBrett = JSON.parse(JSON.stringify(brett))
      tempBrett[move.von.row][move.von.col] = null
      tempBrett[move.nach.row][move.nach.col] = stein
      
      const gegner = spieler === 'schwarz' ? 'weiss' : 'schwarz'
      const gegnerFresser = this.findAllCaptureMoves(tempBrett, gegner)
      
      // Kann der Gegner diesen Stein fressen?
      const kannGefressenWerden = gegnerFresser.some(fresser => 
        fresser.nach.row === move.nach.row && fresser.nach.col === move.nach.col
      )
      
      if (kannGefressenWerden) score -= 8
      
      // 6. Bevorzuge Züge die den Gegner einschränken
      const gegnerMoves = this.findAllNormalMoves(tempBrett, gegner)
      score += (8 - gegnerMoves.length) // Weniger Optionen für Gegner = besser
      
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }
    
    return bestMove
  }
}
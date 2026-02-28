import { Position, Stein, Player } from './types'
import { istGueltigerZug, kannFressen, hatFressmoeglichkeit, hatWeitereFresszuege } from './logic'

// Bot-Logik für Dama
export class DamaBot {
  private difficulty: 'easy' | 'medium' | 'hard'
  
  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty
  }

  // Hauptfunktion: Berechne den besten Zug
  calculateMove(brett: Stein[][], spieler: Player): { von: Position, nach: Position } | null {
    console.log('🤖 Bot berechnet Zug für:', spieler)
    
    // 1. Prüfe ob Fressen möglich ist (muss Priorität haben)
    const captureMoves = this.findAllCaptureMoves(brett, spieler)
    if (captureMoves.length > 0) {
      console.log('🤖 Bot findet Fresszug:', captureMoves.length)
      return this.selectBestMove(captureMoves, brett)
    }
    
    // 2. Sonst normale Züge
    const normalMoves = this.findAllNormalMoves(brett, spieler)
    if (normalMoves.length > 0) {
      console.log('🤖 Bot findet normalen Zug:', normalMoves.length)
      return this.selectBestMove(normalMoves, brett)
    }
    
    return null // Kein Zug möglich
  }

  // Finde alle Fresszüge
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

  // Finde alle normalen Züge
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

  // Wähle den besten Zug basierend auf Schwierigkeit
  private selectBestMove(
    moves: Array<{von: Position, nach: Position}>, 
    brett: Stein[][]
  ): {von: Position, nach: Position} {
    
    if (this.difficulty === 'easy') {
      // Easy: Zufälliger Zug
      return moves[Math.floor(Math.random() * moves.length)]
    }
    
    if (this.difficulty === 'hard') {
      // Hard: Bewerte Züge
      return this.evaluateMoves(moves, brett)
    }
    
    // Medium: Mischung aus zufällig und bewertet
    if (Math.random() > 0.5) {
      return moves[Math.floor(Math.random() * moves.length)]
    } else {
      return this.evaluateMoves(moves, brett)
    }
  }

  // Bewerte Züge (für schweren Modus)
  private evaluateMoves(
    moves: Array<{von: Position, nach: Position}>, 
    brett: Stein[][]
  ): {von: Position, nach: Position} {
    // Einfache Bewertung: Bevorzuge Züge die Könige machen
    const kingMoves = moves.filter(move => {
      const stein = brett[move.von.row][move.von.col]
      if (!stein) return false
      
      // Wenn Stein zur König-Reihe kommt
      if (stein.spieler === 'schwarz' && move.nach.row === 7) return true
      if (stein.spieler === 'weiss' && move.nach.row === 0) return true
      return false
    })
    
    if (kingMoves.length > 0) {
      return kingMoves[Math.floor(Math.random() * kingMoves.length)]
    }
    
    return moves[Math.floor(Math.random() * moves.length)]
  }
}
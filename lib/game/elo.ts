// lib/game/elo.ts

export interface EloConfig {
  kFactor: number;
  defaultRating: number;
  cValue: number;
}

export interface EloResult {
  newRatingA: number;
  newRatingB: number;
  changeA: number;
  changeB: number;
}

export class EloRating {
  private config: EloConfig;

  constructor(config: Partial<EloConfig> = {}) {
    this.config = {
      kFactor: config.kFactor || 32,
      defaultRating: config.defaultRating || 1200,
      cValue: config.cValue || 400,
    };
  }

  // Erwartete Gewinnwahrscheinlichkeit
  expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / this.config.cValue));
  }

  // Neues Rating berechnen
  calculateRating(
    ratingA: number,
    ratingB: number,
    result: 'win' | 'loss' | 'draw' // aus Sicht von Spieler A
  ): EloResult {
    const scoreA = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    const expectedA = this.expectedScore(ratingA, ratingB);
    
    const changeA = Math.round(this.config.kFactor * (scoreA - expectedA));
    const changeB = -changeA;
    
    return {
      newRatingA: ratingA + changeA,
      newRatingB: ratingB + changeB,
      changeA,
      changeB
    };
  }

  // Mit Stein-Differenz für dominante Siege
  calculateRatingWithMargin(
    ratingA: number,
    ratingB: number,
    piecesA: number,
    piecesB: number
  ): EloResult {
    const result = piecesA > piecesB ? 'win' : piecesA < piecesB ? 'loss' : 'draw';
    const baseResult = this.calculateRating(ratingA, ratingB, result);
    
    // Bonus für hohen Sieg (max 8 Punkte extra)
    const pieceDiff = Math.abs(piecesA - piecesB);
    const maxDiff = 12; // Max Steine im Spiel
    const bonus = Math.min(8, Math.round(4 * (pieceDiff / maxDiff)));
    
    if (result === 'win') {
      return {
        newRatingA: ratingA + baseResult.changeA + bonus,
        newRatingB: ratingB + baseResult.changeB - bonus,
        changeA: baseResult.changeA + bonus,
        changeB: baseResult.changeB - bonus
      };
    } else if (result === 'loss') {
      return {
        newRatingA: ratingA + baseResult.changeA - bonus,
        newRatingB: ratingB + baseResult.changeB + bonus,
        changeA: baseResult.changeA - bonus,
        changeB: baseResult.changeB + bonus
      };
    }
    
    return baseResult;
  }
}
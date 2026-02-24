// Elo-Berechnung nach Standard-Formel
export function calculateElo(
  playerElo: number,
  opponentElo: number,
  score: 1 | 0 | 0.5 // 1 = Sieg, 0 = Niederlage, 0.5 = Unentschieden
): number {
  const K = 32; // Entwicklungsfaktor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const newElo = Math.round(playerElo + K * (score - expectedScore));
  return newElo;
}

// Gewinner und Verlierer Elo berechnen
export function calculateBothElos(
  winnerElo: number,
  loserElo: number
): { newWinnerElo: number; newLoserElo: number } {
  const newWinnerElo = calculateElo(winnerElo, loserElo, 1);
  const newLoserElo = calculateElo(loserElo, winnerElo, 0);
  return { newWinnerElo, newLoserElo };
}
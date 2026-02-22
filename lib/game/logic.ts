import type { Position, Player, Stein } from './types'

export const istGueltigerZug = (
  brett: Stein[][],
  von: Position, 
  nach: Position, 
  spieler: Player,
  istKoenig: boolean
): boolean => {
  const rowDiff = nach.row - von.row;
  const colDiff = Math.abs(nach.col - von.col);
  
  if (colDiff !== 1 || Math.abs(rowDiff) !== 1) return false;
  if (brett[nach.row][nach.col] !== null) return false;
  
  if (!istKoenig) {
    if (spieler === 'schwarz' && rowDiff <= 0) return false;
    if (spieler === 'weiss' && rowDiff >= 0) return false;
  }
  
  return true;
};

export const kannFressen = (
  brett: Stein[][],
  von: Position,
  nach: Position,
  spieler: Player,
  istKoenig: boolean
): boolean => {
  const rowDiff = nach.row - von.row;
  const colDiff = Math.abs(nach.col - von.col);
  
  if (colDiff !== 2 || Math.abs(rowDiff) !== 2) return false;
  if (brett[nach.row][nach.col] !== null) return false;
  
  const mittelRow = von.row + (rowDiff > 0 ? 1 : -1);
  const mittelCol = von.col + (nach.col > von.col ? 1 : -1);
  const gegner = brett[mittelRow]?.[mittelCol];
  
  if (!gegner || gegner.spieler === spieler) return false;
  
  if (!istKoenig) {
    if (spieler === 'schwarz' && rowDiff <= 0) return false;
    if (spieler === 'weiss' && rowDiff >= 0) return false;
  }
  
  return true;
};

export const hatWeitereFresszuege = (
  brett: Stein[][],
  pos: Position, 
  spieler: Player, 
  istKoenig: boolean
): boolean => {
  const richtungen = [
    { row: -2, col: -2 }, { row: -2, col: 2 },
    { row: 2, col: -2 }, { row: 2, col: 2 }
  ];
  
  for (const dir of richtungen) {
    const nach = { row: pos.row + dir.row, col: pos.col + dir.col };
    
    if (nach.row < 0 || nach.row >= 8 || nach.col < 0 || nach.col >= 8) continue;
    
    const gegnerRow = pos.row + (dir.row > 0 ? 1 : -1);
    const gegnerCol = pos.col + (dir.col > 0 ? 1 : -1);
    const gegner = brett[gegnerRow]?.[gegnerCol];
    
    if (!gegner || gegner.spieler === spieler) continue;
    if (brett[nach.row][nach.col] !== null) continue;
    
    if (istKoenig) return true;
    if (spieler === 'schwarz' && dir.row > 0) return true;
    if (spieler === 'weiss' && dir.row < 0) return true;
  }
  return false;
};

export const initialesBrett = (): Stein[][] => {
  const neuesBrett: Stein[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 0) {
        neuesBrett[row][col] = { spieler: 'schwarz', istKoenig: false };
      }
    }
  }
  
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 0) {
        neuesBrett[row][col] = { spieler: 'weiss', istKoenig: false };
      }
    }
  }
  
  return neuesBrett;
};

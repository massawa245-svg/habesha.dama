export type Position = { row: number; col: number };
export type Player = 'schwarz' | 'weiss';
export type Stein = { spieler: Player; istKoenig: boolean } | null;

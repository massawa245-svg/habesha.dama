import { createClient } from '@/lib/supabase/server';
import { EloRating } from '@/lib/game/elo';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { gameId, winnerId, loserId, draw = false, piecesWinner = 12, piecesLoser = 0 } = await request.json();
    
    const supabase = await createClient();
    
    // Spieler-Ratings holen
    const { data: ratings } = await supabase
      .from('player_ratings')
      .select('user_id, rating, games_played, wins, losses, current_streak, best_streak')
      .in('user_id', [winnerId, loserId]);
    
    const winnerData = ratings?.find(r => r.user_id === winnerId);
    const loserData = ratings?.find(r => r.user_id === loserId);
    
    const winnerRating = winnerData?.rating || 1200;
    const loserRating = loserData?.rating || 1200;
    
    // ELO berechnen
    const elo = new EloRating({ kFactor: 32 });
    const result = elo.calculateRatingWithMargin(
      winnerRating, 
      loserRating, 
      piecesWinner, 
      piecesLoser
    );
    
    // Wenn Unentschieden
    if (draw) {
      const drawResult = elo.calculateRating(winnerRating, loserRating, 'draw');
      
      // Beide Spieler aktualisieren
      await Promise.all([
        updatePlayerRating(supabase, winnerId, drawResult.newRatingA, drawResult.changeA, 'draw', loserId, loserRating),
        updatePlayerRating(supabase, loserId, drawResult.newRatingB, drawResult.changeB, 'draw', winnerId, winnerRating)
      ]);
      
      return NextResponse.json({ 
        success: true, 
        result: drawResult,
        message: 'Unentschieden - ELO angepasst'
      });
    }
    
    // Sieg/Niederlage
    await Promise.all([
      updatePlayerRating(supabase, winnerId, result.newRatingA, result.changeA, 'win', loserId, loserRating),
      updatePlayerRating(supabase, loserId, result.newRatingB, result.changeB, 'loss', winnerId, winnerRating)
    ]);
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: `ELO aktualisiert: +${result.changeA} / ${result.changeB}`
    });
    
  } catch (error) {
    console.error('ELO Update Fehler:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updatePlayerRating(
  supabase: any,
  userId: string,
  newRating: number,
  change: number,
  result: 'win' | 'loss' | 'draw',
  opponentId: string,
  opponentRating: number
) {
  // Aktuelle Daten holen
  const { data: current } = await supabase
    .from('player_ratings')
    .select('games_played, wins, losses, draws, current_streak, best_streak, highest_rating')
    .eq('user_id', userId)
    .maybeSingle();
  
  // Streak berechnen
  let newStreak = current?.current_streak || 0;
  if (result === 'win') {
    newStreak = newStreak > 0 ? newStreak + 1 : 1;
  } else if (result === 'loss') {
    newStreak = newStreak < 0 ? newStreak - 1 : -1;
  } else {
    newStreak = 0; // Draw reset
  }
  
  const bestStreak = Math.max(Math.abs(newStreak), current?.best_streak || 0);
  const highestRating = Math.max(newRating, current?.highest_rating || 1200);
  
  // Spieler-Rating aktualisieren
  await supabase
    .from('player_ratings')
    .upsert({
      user_id: userId,
      rating: newRating,
      games_played: (current?.games_played || 0) + 1,
      wins: (current?.wins || 0) + (result === 'win' ? 1 : 0),
      losses: (current?.losses || 0) + (result === 'loss' ? 1 : 0),
      draws: (current?.draws || 0) + (result === 'draw' ? 1 : 0),
      current_streak: newStreak,
      best_streak: bestStreak,
      highest_rating: highestRating,
      last_game_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
  
  // Verlauf speichern
  await supabase
    .from('rating_history')
    .insert({
      user_id: userId,
      game_id: null, // Wird später mit gameId verknüpft
      old_rating: newRating - change,
      new_rating: newRating,
      change: change,
      opponent_id: opponentId,
      opponent_rating: opponentRating,
      result: result,
      created_at: new Date().toISOString()
    });
}
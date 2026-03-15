// app/api/elo/update/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function calculateElo(ratingA: number, ratingB: number, scoreA: number) {
  const K = 32
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const changeA = Math.round(K * (scoreA - expectedA))
  return {
    newRatingA: ratingA + changeA,
    newRatingB: ratingB - changeA,
    changeA,
    changeB: -changeA,
  }
}

export async function POST(request: Request) {
  try {
    const { gameId, winnerId, loserId, draw } = await request.json()

    if (!gameId || (!draw && (!winnerId || !loserId))) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 })
    }

    // ✅ Doppelte Verarbeitung verhindern
    const { data: game } = await supabase
      .from('games')
      .select('elo_processed')
      .eq('id', gameId)
      .single()

    if (game?.elo_processed) {
      return NextResponse.json({ success: true, message: 'Bereits verarbeitet' })
    }

    // Rating holen oder neu anlegen
    const getOrCreate = async (userId: string) => {
      const { data } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (data) return data

      const { data: newRating } = await supabase
        .from('player_ratings')
        .insert({
          user_id: userId,
          rating: 1200,
          games_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          highest_rating: 1200,
          current_streak: 0,
          best_streak: 0,
        })
        .select()
        .single()

      return newRating
    }

    const winnerData = await getOrCreate(winnerId)
    const loserData = await getOrCreate(loserId)

    if (!winnerData || !loserData) {
      return NextResponse.json({ error: 'Rating nicht gefunden' }, { status: 400 })
    }

    const result = calculateElo(
      winnerData.rating,
      loserData.rating,
      draw ? 0.5 : 1
    )

    const now = new Date().toISOString()

    // ── Winner updaten ────────────────────────────────────────────────────────
    const winnerNewStreak = draw ? 0 : (winnerData.current_streak >= 0 ? winnerData.current_streak + 1 : 1)
    const winnerNewHighest = Math.max(result.newRatingA, winnerData.highest_rating || 1200)

    await supabase
      .from('player_ratings')
      .update({
        rating: result.newRatingA,
        games_played: winnerData.games_played + 1,
        wins: draw ? winnerData.wins : winnerData.wins + 1,
        draws: draw ? winnerData.draws + 1 : winnerData.draws,
        highest_rating: winnerNewHighest,
        current_streak: winnerNewStreak,
        best_streak: Math.max(winnerNewStreak, winnerData.best_streak || 0),
        last_game_at: now,
        updated_at: now,
      })
      .eq('user_id', winnerId)

    // ── Loser updaten ─────────────────────────────────────────────────────────
    const loserNewRating = Math.max(result.newRatingB, 100)
    const loserNewStreak = draw ? 0 : (loserData.current_streak <= 0 ? loserData.current_streak - 1 : -1)

    await supabase
      .from('player_ratings')
      .update({
        rating: loserNewRating,
        games_played: loserData.games_played + 1,
        losses: draw ? loserData.losses : loserData.losses + 1,
        draws: draw ? loserData.draws + 1 : loserData.draws,
        current_streak: loserNewStreak,
        last_game_at: now,
        updated_at: now,
      })
      .eq('user_id', loserId)

    // ── Rating History speichern ──────────────────────────────────────────────
    await supabase.from('rating_history').insert([
      {
        user_id: winnerId,
        game_id: gameId,
        old_rating: winnerData.rating,
        new_rating: result.newRatingA,
        change: result.changeA,
        opponent_id: loserId,
        opponent_rating: loserData.rating,
        result: draw ? 'draw' : 'win',
      },
      {
        user_id: loserId,
        game_id: gameId,
        old_rating: loserData.rating,
        new_rating: loserNewRating,
        change: result.changeB,
        opponent_id: winnerId,
        opponent_rating: winnerData.rating,
        result: draw ? 'draw' : 'loss',
      },
    ])

    // ── Spiel als verarbeitet markieren ───────────────────────────────────────
    await supabase
      .from('games')
      .update({ elo_processed: true })
      .eq('id', gameId)

    console.log(`✅ ELO: Winner +${result.changeA} (${result.newRatingA}), Loser ${result.changeB} (${loserNewRating})`)

    return NextResponse.json({
      success: true,
      result: {
        changeA: result.changeA,
        changeB: result.changeB,
        newRatingWinner: result.newRatingA,
        newRatingLoser: loserNewRating,
      },
    })

  } catch (error) {
    console.error('❌ ELO Update Fehler:', error)
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Service Role Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Spieler-Statistiken holen
    const { data: playerStats } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Letzte 5 Spiele holen
    const { data: recentGames } = await supabase
      .from('rating_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: playerStats || {
        rating: 1200,
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0
      },
      recentGames: recentGames || []
    });

  } catch (error) {
    console.error('Check API Fehler:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
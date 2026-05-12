// POST /api/save-game-state
// Persists the in-progress game state (played tiles, scores, team names) so the
// host can reload mid-game without losing progress.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import type { GameState } from '@/lib/types';

interface Body {
  game_token?: string;
  game_state?: GameState;
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    if (!body.game_token || !body.game_state) {
      return NextResponse.json({ error: 'game_token and game_state required' }, { status: 400 });
    }
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from('games')
      .update({ game_state: body.game_state })
      .eq('token', body.game_token);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

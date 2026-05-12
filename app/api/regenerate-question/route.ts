// POST /api/regenerate-question
// Regenerates a single question in an existing game by (categoryIndex, questionIndex).

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { regenerateSingleQuestion } from '@/lib/anthropic';
import type { Event, Respondent, Response, GameData } from '@/lib/types';

export const maxDuration = 60;

interface Body {
  game_token?: string;
  category_index?: number;
  question_index?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    if (!body.game_token || body.category_index === undefined || body.question_index === undefined) {
      return NextResponse.json({ error: 'game_token, category_index, question_index required' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
    }

    const supabase = getAdminSupabase();
    const { data: game, error: gameErr } = await supabase
      .from('games')
      .select('*')
      .eq('token', body.game_token)
      .single();
    if (gameErr || !game) return NextResponse.json({ error: 'game not found' }, { status: 404 });

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', game.event_id)
      .single();

    const { data: respondents } = await supabase
      .from('respondents')
      .select('*')
      .eq('event_id', game.event_id);

    const respondentIds = (respondents || []).map((r: Respondent) => r.id);
    let responses: Response[] = [];
    if (respondentIds.length > 0) {
      const { data: resps } = await supabase
        .from('responses')
        .select('*')
        .in('respondent_id', respondentIds);
      responses = (resps || []) as Response[];
    }

    const newQ = await regenerateSingleQuestion(
      {
        event: event as Event,
        respondents: (respondents || []) as Respondent[],
        responses,
      },
      game.game_data as GameData,
      body.category_index,
      body.question_index
    );

    const gameData = game.game_data as GameData;
    gameData.categories[body.category_index].questions[body.question_index] = newQ;

    await supabase.from('games').update({ game_data: gameData }).eq('id', game.id);

    return NextResponse.json({ question: newQ });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

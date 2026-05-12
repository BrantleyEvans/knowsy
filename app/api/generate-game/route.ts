// POST /api/generate-game
// Pulls all per-subject responses for an event, calls Claude (or falls back to
// sample data if ANTHROPIC_API_KEY is missing), saves the game, returns the token.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { generateGame } from '@/lib/anthropic';
import { sampleGame } from '@/lib/sample-game';
import type { Event, Respondent, Response, GameData } from '@/lib/types';

export const maxDuration = 60;

interface Body {
  event_id?: string;
  force_demo?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: Body = await req.json();
    if (!body.event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', body.event_id)
      .single();
    if (eventErr || !event) {
      return NextResponse.json({ error: 'event not found' }, { status: 404 });
    }

    const subjects = (event.subjects as Event['subjects']) || [];
    const totalCats = subjects.reduce((n, s) => n + (s.category_count || 0), 0);
    if (totalCats !== 5) {
      return NextResponse.json(
        { error: `event subjects don't sum to 5 categories (got ${totalCats}). Update subjects before generating.` },
        { status: 400 }
      );
    }

    const { data: respondents, error: rErr } = await supabase
      .from('respondents')
      .select('*')
      .eq('event_id', event.id);
    if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

    const respondentIds = (respondents || []).map((r: Respondent) => r.id);
    let responses: Response[] = [];
    if (respondentIds.length > 0) {
      const { data: resps, error: respErr } = await supabase
        .from('responses')
        .select('*')
        .in('respondent_id', respondentIds);
      if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });
      responses = (resps || []) as Response[];
    }

    let gameData: GameData;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const useDemo = body.force_demo || !apiKey || responses.length === 0;

    if (useDemo) {
      gameData = sampleGame(event as Event);
    } else {
      try {
        gameData = await generateGame({
          event: event as Event,
          respondents: (respondents || []) as Respondent[],
          responses,
        });
      } catch (err) {
        console.error('Claude generate failed, falling back to sample:', err);
        gameData = sampleGame(event as Event);
      }
    }

    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('event_id', event.id)
      .maybeSingle();

    let gameRow;
    if (existingGame) {
      const { data, error } = await supabase
        .from('games')
        .update({
          game_data: gameData,
          generated_at: new Date().toISOString(),
        })
        .eq('id', existingGame.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      gameRow = data;
    } else {
      const { data, error } = await supabase
        .from('games')
        .insert({
          event_id: event.id,
          game_data: gameData,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      gameRow = data;
    }

    await supabase
      .from('events')
      .update({ status: 'generated', generated_at: new Date().toISOString() })
      .eq('id', event.id);

    return NextResponse.json({
      game_token: gameRow.token,
      demo: useDemo,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

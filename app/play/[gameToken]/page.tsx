// Game presentation page — loads the generated game data, hands off to the client.

import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase';
import JeopardyBoard from '@/components/JeopardyBoard';
import type { GameData, GameState } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ gameToken: string }>;
}

export default async function PlayPage({ params }: PageProps) {
  const { gameToken } = await params;
  const supabase = getAdminSupabase();

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('token', gameToken)
    .single();
  if (!game) notFound();

  const { data: event } = await supabase
    .from('events')
    .select('event_name, bride_name, groom_name, tone')
    .eq('id', game.event_id)
    .single();

  return (
    <JeopardyBoard
      gameToken={game.token}
      gameData={game.game_data as GameData}
      initialState={game.game_state as GameState}
      eventName={event?.event_name || 'Trivia Game'}
      brideName={event?.bride_name || ''}
    />
  );
}

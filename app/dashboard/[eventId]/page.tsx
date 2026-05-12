// Dashboard page — server component that loads the event, then renders the
// interactive client view.

import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase';
import DashboardClient from './DashboardClient';
import type { Event, Respondent } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = getAdminSupabase();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (!event) notFound();

  const { data: respondents } = await supabase
    .from('respondents')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  const { data: game } = await supabase
    .from('games')
    .select('token, generated_at')
    .eq('event_id', eventId)
    .maybeSingle();

  return (
    <DashboardClient
      event={event as Event}
      respondents={(respondents || []) as Respondent[]}
      existingGameToken={game?.token || null}
    />
  );
}

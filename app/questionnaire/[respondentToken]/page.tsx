// Public questionnaire page — loads respondent + event, hands off to client form.

import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase';
import QuestionnaireForm from '@/components/QuestionnaireForm';
import type { Event, Respondent } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ respondentToken: string }>;
}

export default async function QuestionnairePage({ params }: PageProps) {
  const { respondentToken } = await params;
  const supabase = getAdminSupabase();

  const { data: respondent } = await supabase
    .from('respondents')
    .select('*')
    .eq('token', respondentToken)
    .single();
  if (!respondent) notFound();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', respondent.event_id)
    .single();
  if (!event) notFound();

  return (
    <QuestionnaireForm
      event={event as Event}
      respondent={respondent as Respondent}
      alreadySubmitted={Boolean((respondent as Respondent).submitted_at)}
    />
  );
}

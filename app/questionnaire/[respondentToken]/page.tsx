// Public questionnaire page — server component that loads respondent + event,
// then hands off to the client form.

import { notFound } from 'next/navigation';
import { getAdminSupabase } from '@/lib/supabase';
import QuestionnaireForm from '@/components/QuestionnaireForm';
import { getQuestionsForRole, renderQuestionText } from '@/lib/questions';
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

  const r = respondent as Respondent;
  const e = event as Event;

  const questions = getQuestionsForRole(r.role).map((q) => ({
    ...q,
    text: renderQuestionText(q.text, e.bride_name, e.groom_name),
  })).filter((q) => !q.spicyOnly || e.tone !== 'wholesome');

  return (
    <QuestionnaireForm
      event={e}
      respondent={r}
      questions={questions}
      alreadySubmitted={Boolean(r.submitted_at)}
    />
  );
}

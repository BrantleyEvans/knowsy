// POST /api/submit-questionnaire
// Saves a batch of per-subject responses for one respondent (by token) and marks them submitted.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

interface AnswerInput {
  subject_id: string;
  question_key: string;
  question_text: string;
  answer_text: string;
}

interface SubmitBody {
  token?: string;
  answers?: AnswerInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitBody = await req.json();
    if (!body.token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: 'answers must be a non-empty array' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { data: respondent, error: lookupErr } = await supabase
      .from('respondents')
      .select('*')
      .eq('token', body.token)
      .single();
    if (lookupErr || !respondent) {
      return NextResponse.json({ error: 'invalid token' }, { status: 404 });
    }

    if (respondent.submitted_at) {
      return NextResponse.json(
        { error: 'You have already submitted answers for this link.' },
        { status: 409 }
      );
    }

    const rows = body.answers
      .filter((a) => a.answer_text && a.answer_text.trim() && a.subject_id)
      .map((a) => ({
        respondent_id: respondent.id,
        subject_id: a.subject_id,
        question_key: a.question_key,
        question_text: a.question_text,
        answer_text: a.answer_text.trim(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No answers provided.' }, { status: 400 });
    }

    const { error: insertErr } = await supabase.from('responses').insert(rows);
    if (insertErr) {
      console.error('insert responses error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const { error: updateErr } = await supabase
      .from('respondents')
      .update({ submitted_at: new Date().toISOString() })
      .eq('id', respondent.id);
    if (updateErr) {
      console.error('mark submitted error:', updateErr);
    }

    return NextResponse.json({ ok: true, submitted: rows.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

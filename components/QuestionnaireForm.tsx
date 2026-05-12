'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Event, Respondent, Subject } from '@/lib/types';
import { SUBJECT_PROMPTS, renderPromptText } from '@/lib/questions';

interface Props {
  event: Event;
  respondent: Respondent;
  alreadySubmitted: boolean;
}

type AnswerMap = Record<string, string>; // key: `${subjectId}.${promptKey}`

function answerKey(subjectId: string, promptKey: string): string {
  return `${subjectId}.${promptKey}`;
}

export default function QuestionnaireForm({ event, respondent, alreadySubmitted }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswer(k: string, v: string) {
    setAnswers((a) => ({ ...a, [k]: v }));
  }

  const subjects: Subject[] = event.subjects || [];
  const filledCount = Object.values(answers).filter((v) => v.trim()).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (filledCount === 0) {
      setError('Fill in at least one box — even one good story is enough.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: {
        token: string;
        answers: { subject_id: string; question_key: string; question_text: string; answer_text: string }[];
      } = { token: respondent.token, answers: [] };

      for (const s of subjects) {
        for (const p of SUBJECT_PROMPTS) {
          const k = answerKey(s.id, p.key);
          const v = (answers[k] || '').trim();
          if (!v) continue;
          payload.answers.push({
            subject_id: s.id,
            question_key: p.key,
            question_text: renderPromptText(p.template, s.name),
            answer_text: v,
          });
        }
      }

      const res = await fetch('/api/submit-questionnaire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      router.push('/questionnaire/success');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (alreadySubmitted) {
    return (
      <main className="flex-1 px-6 py-20 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">🍾</div>
          <h1 className="script text-4xl text-[#5C1A2F]">Already in.</h1>
          <p className="mt-3 text-[#3A1525]/70">
            Looks like this link has already been used. If you think that&apos;s wrong,
            ask whoever sent it to issue a new one.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-5 py-8 max-w-2xl mx-auto w-full">
      <div className="text-center mb-8">
        <p className="uppercase tracking-[0.26em] text-[10px] sm:text-xs text-[#B76E79] font-bold">
          {event.event_name}
        </p>
        <h1 className="script text-5xl sm:text-6xl mt-4 text-[#5C1A2F]">
          Tell us about the crew.
        </h1>
        <p className="mt-4 text-[#3A1525]/75 text-sm sm:text-base leading-relaxed">
          We&apos;ll turn your stories into a trivia game we&apos;ll play at the bach.
          One section per person. Fill in what you have, skip what you don&apos;t.
          Inside-joke energy is the whole point — be specific.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-[#3A1525]/45">
          Filling in as{' '}
          <span className="font-bold text-[#5C1A2F]/85">{respondent.display_name}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {subjects.length === 0 && (
          <div className="card text-center">
            <p className="text-sm text-[#3A1525]/70">
              The host hasn&apos;t picked subjects yet. Ask them to finish setup.
            </p>
          </div>
        )}

        {subjects.map((s, si) => (
          <section key={s.id} className="card space-y-4">
            <div className="border-b border-[#B76E79]/15 pb-3">
              <p className="text-xs uppercase tracking-widest font-bold text-[#B76E79]">
                Section {si + 1} of {subjects.length}
              </p>
              <h2 className="script text-4xl sm:text-5xl text-[#5C1A2F] mt-1 leading-none">
                {s.name}
              </h2>
              <p className="text-xs text-[#3A1525]/60 mt-1 uppercase tracking-wider">
                {s.relationship}
              </p>
            </div>

            {SUBJECT_PROMPTS.map((p) => {
              const k = answerKey(s.id, p.key);
              return (
                <label key={p.key} className="block">
                  <span className="block text-sm font-semibold text-[#5C1A2F] mb-1.5">
                    {renderPromptText(p.template, s.name)}
                    <span className="text-[#3A1525]/40 text-xs ml-2 font-normal">(optional)</span>
                  </span>
                  <textarea
                    value={answers[k] || ''}
                    onChange={(e) => setAnswer(k, e.target.value)}
                    rows={3}
                    className="input"
                    placeholder="Skip or write as much as you want…"
                  />
                </label>
              );
            })}
          </section>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || filledCount === 0}
          className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending…' : `Send it (${filledCount} answer${filledCount === 1 ? '' : 's'})`}
        </button>
        <p className="text-xs text-[#3A1525]/45 text-center">
          One shot — make sure everything looks right before you submit.
        </p>
      </form>
    </main>
  );
}

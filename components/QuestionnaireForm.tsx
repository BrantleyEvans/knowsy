'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Event, QuestionDef, Respondent } from '@/lib/types';

interface Props {
  event: Event;
  respondent: Respondent;
  questions: QuestionDef[];
  alreadySubmitted: boolean;
}

export default function QuestionnaireForm({
  event,
  respondent,
  questions,
  alreadySubmitted,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function toggleMulti(key: string, option: string) {
    const current = answers[key] ? answers[key].split(' | ') : [];
    const exists = current.includes(option);
    const next = exists ? current.filter((o) => o !== option) : [...current, option];
    setAnswer(key, next.join(' | '));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const required = questions.filter((q) => !q.optional);
    const missing = required.filter((q) => !answers[q.key] || !answers[q.key].trim());
    if (missing.length > 0) {
      setError(`Almost — answer the missing ${missing.length} question(s) before submitting.`);
      const el = document.getElementById(`q-${missing[0].key}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        token: respondent.token,
        answers: questions
          .filter((q) => answers[q.key] && answers[q.key].trim())
          .map((q) => ({
            question_key: q.key,
            question_text: q.text,
            answer_text: answers[q.key],
          })),
      };
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
          Tell us about {event.bride_name}.
        </h1>
        <p className="mt-4 text-[#3A1525]/75 text-sm sm:text-base">
          Your answers go into a personalized trivia game we play at the bach.
          Be specific — the inside-joke energy is the whole game.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-[#3A1525]/45">
          Filling in as{' '}
          <span className="font-bold text-[#5C1A2F]/85">{respondent.display_name}</span> ({respondent.role})
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.key} id={`q-${q.key}`} className="card">
            <label className="block">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-[#B76E79] font-extrabold">{i + 1}.</span>
                <span className="font-semibold text-[#5C1A2F] leading-snug">
                  {q.text}
                  {q.optional && (
                    <span className="text-[#3A1525]/45 text-sm ml-2 font-normal">(optional)</span>
                  )}
                </span>
              </div>

              {q.type === 'text' && (
                <input
                  type="text"
                  value={answers[q.key] || ''}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  className="input"
                  placeholder="Type your answer…"
                />
              )}
              {q.type === 'longtext' && (
                <textarea
                  value={answers[q.key] || ''}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Be specific — names, places, what happened…"
                />
              )}
              {q.type === 'select' && q.options && (
                <select
                  value={answers[q.key] || ''}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  className="input"
                >
                  <option value="">Pick one…</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
              {q.type === 'multiselect' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt) => {
                    const selected = (answers[q.key] || '').split(' | ').includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => toggleMulti(q.key, opt)}
                        className={`px-3 py-2 rounded-lg text-sm text-left border transition-colors ${
                          selected
                            ? 'bg-[#B76E79] text-white border-[#B76E79]'
                            : 'bg-white text-[#5C1A2F] border-[#B76E79]/20 hover:border-[#B76E79]/55'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </label>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed"
        >
          {submitting ? 'Sending…' : 'Send it'}
        </button>
        <p className="text-xs text-[#3A1525]/45 text-center">
          One shot — make sure everything looks right before you submit.
        </p>
      </form>
    </main>
  );
}

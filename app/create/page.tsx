'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Subject } from '@/lib/types';

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `subj-${Math.random().toString(36).slice(2, 10)}`;
}

const RELATIONSHIP_OPTIONS = [
  'bride',
  'groom',
  'partner',
  'maid of honor',
  'bridesmaid',
  'squad',
  'parents',
  'parent',
  'friend',
  'sibling',
  'other',
];

export default function CreateEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    event_name: '',
    bride_name: '',
    groom_name: '',
    event_type: 'bachelorette',
    event_date: '',
    tone: 'spicy' as 'wholesome' | 'spicy' | 'wild',
    creator_email: '',
  });

  // Default bachelorette mix — gets bridge/partner names from form when those fields update.
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: uid(), name: '', relationship: 'bride', category_count: 2 },
    { id: uid(), name: '', relationship: 'partner', category_count: 1 },
    { id: uid(), name: 'The crew', relationship: 'squad', category_count: 2 },
  ]);

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Auto-fill subject name from bride/groom when the corresponding form field changes
  function setBrideName(v: string) {
    onChange('bride_name', v);
    setSubjects((subs) => subs.map((s, i) =>
      i === 0 && s.relationship === 'bride' && !s.name ? { ...s, name: v } : s
    ));
  }
  function setGroomName(v: string) {
    onChange('groom_name', v);
    setSubjects((subs) => subs.map((s) =>
      s.relationship === 'partner' && !s.name ? { ...s, name: v } : s
    ));
  }

  function updateSubject(id: string, patch: Partial<Subject>) {
    setSubjects((subs) => subs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addSubject() {
    setSubjects((subs) => [...subs, { id: uid(), name: '', relationship: 'friend', category_count: 1 }]);
  }
  function removeSubject(id: string) {
    setSubjects((subs) => subs.filter((s) => s.id !== id));
  }

  const totalCats = useMemo(() => subjects.reduce((n, s) => n + (Number(s.category_count) || 0), 0), [subjects]);
  const subjectsValid = totalCats === 5 && subjects.every((s) => s.name.trim().length > 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!subjectsValid) {
      setError(
        totalCats === 5
          ? 'Every subject needs a name.'
          : `Subjects must add up to exactly 5 categories. You have ${totalCats}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/create-event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subjects: subjects.map((s) => ({
            id: s.id,
            name: s.name.trim(),
            relationship: s.relationship.trim() || 'guest',
            category_count: Number(s.category_count),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create event');
      router.push(`/dashboard/${json.event.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
      <Link href="/" className="text-sm text-[#5C1A2F]/60 hover:text-[#5C1A2F]">
        ← back
      </Link>
      <h1 className="script text-5xl sm:text-6xl mt-4 text-[#5C1A2F]">
        Plan her party.
      </h1>
      <p className="text-[#3A1525]/70 mt-3">
        Takes 60 seconds. You can edit later.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="What's the event called?">
          <input
            required
            value={form.event_name}
            onChange={(e) => onChange('event_name', e.target.value)}
            placeholder="e.g. Laura's Bachelorette Weekend"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Bride's name">
            <input
              required
              value={form.bride_name}
              onChange={(e) => setBrideName(e.target.value)}
              placeholder="Laura"
              className="input"
            />
          </Field>
          <Field label="Her partner's name (optional)">
            <input
              value={form.groom_name}
              onChange={(e) => setGroomName(e.target.value)}
              placeholder="Brantley"
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Event type">
            <select
              value={form.event_type}
              onChange={(e) => onChange('event_type', e.target.value)}
              className="input"
            >
              <option value="bachelorette">Bachelorette</option>
              <option value="bachelor">Bachelor</option>
              <option value="bridal_shower">Bridal Shower</option>
              <option value="engagement_party">Engagement Party</option>
              <option value="rehearsal_dinner">Rehearsal Dinner</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date (optional)">
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => onChange('event_date', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="How spicy do you want this?">
          <div className="grid grid-cols-3 gap-2">
            {(['wholesome', 'spicy', 'wild'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange('tone', t)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                  form.tone === t
                    ? 'bg-[#B76E79] text-white border-[#B76E79]'
                    : 'bg-white text-[#5C1A2F] border-[#B76E79]/25 hover:border-[#B76E79]/55'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {/* Subjects builder */}
        <div className="card !p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base text-[#5C1A2F]">Who gets their own categories?</h3>
            <span className={`text-xs font-bold tabular-nums ${
              totalCats === 5 ? 'text-green-700' : 'text-[#B76E79]'
            }`}>
              {totalCats} / 5 categories
            </span>
          </div>
          <p className="text-xs text-[#3A1525]/65 mb-3 leading-relaxed">
            The board is 5 columns. Pick the people (or groups) and decide who
            gets how many. The squad shares one card; the bride can have two.
            Total must equal 5.
          </p>

          <div className="space-y-2">
            {subjects.map((s, i) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={s.name}
                  onChange={(e) => updateSubject(s.id, { name: e.target.value })}
                  placeholder={i === 0 ? 'Bride name' : i === 1 ? 'Partner name' : 'Subject name'}
                  className="input col-span-5 !py-2 !px-3 text-sm"
                />
                <select
                  value={s.relationship}
                  onChange={(e) => updateSubject(s.id, { relationship: e.target.value })}
                  className="input col-span-4 !py-2 !px-3 text-sm"
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={s.category_count}
                  onChange={(e) => updateSubject(s.id, { category_count: Number(e.target.value) })}
                  className="input col-span-2 !py-2 !px-3 text-sm text-center"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSubject(s.id)}
                  disabled={subjects.length <= 1}
                  className="col-span-1 text-[#B76E79]/70 hover:text-[#B76E79] disabled:opacity-25 text-lg leading-none"
                  title="Remove subject"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSubject}
            disabled={subjects.length >= 5}
            className="mt-3 text-sm text-[#B76E79] hover:text-[#9A5660] font-semibold disabled:opacity-40"
          >
            + Add another subject
          </button>
        </div>

        <Field label="Your email (so we can find your event later)">
          <input
            type="email"
            value={form.creator_email}
            onChange={(e) => onChange('creator_email', e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </Field>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !subjectsValid}
          className="btn-primary w-full py-4 text-lg disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating…' : 'Plan her party (Stripe stubbed — $0 today)'}
        </button>
        <p className="text-xs text-[#3A1525]/45 text-center">
          TODO: real Stripe Checkout slots in here. For MVP we create the event directly.
        </p>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#5C1A2F] mb-1">{label}</span>
      {children}
    </label>
  );
}

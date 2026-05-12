'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  function onChange<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // TODO(stripe): replace this direct create with a Stripe Checkout session,
      // then create the event upon webhook success. For MVP we just create it.
      const res = await fetch('/api/create-event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
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
        Takes 30 seconds. You can edit later.
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
              onChange={(e) => onChange('bride_name', e.target.value)}
              placeholder="Laura"
              className="input"
            />
          </Field>
          <Field label="Her partner's name (optional)">
            <input
              value={form.groom_name}
              onChange={(e) => onChange('groom_name', e.target.value)}
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
          <p className="text-xs text-[#3A1525]/60 mt-2 leading-relaxed">
            <strong>Wholesome</strong> = PG, sweet, no edge. <strong>Spicy</strong> = PG-13, inside jokes, embarrassing
            moments. <strong>Wild</strong> = R-rated, the spicier stories — never mean-spirited.
          </p>
        </Field>

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
          disabled={submitting}
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

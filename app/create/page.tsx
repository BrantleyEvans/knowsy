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
      <Link href="/" className="text-sm text-[#1E1B3A]/60 hover:text-[#1E1B3A]">
        ← back
      </Link>
      <h1 className="text-3xl sm:text-4xl font-extrabold mt-4 text-[#1E1B3A]">
        Create your event
      </h1>
      <p className="text-[#1E1B3A]/70 mt-2">Takes 30 seconds. You can edit later.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Event name">
          <input
            required
            value={form.event_name}
            onChange={(e) => onChange('event_name', e.target.value)}
            placeholder="e.g. Sarah's Bachelorette Weekend"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Bride / guest of honor name">
            <input
              required
              value={form.bride_name}
              onChange={(e) => onChange('bride_name', e.target.value)}
              placeholder="Sarah"
              className="input"
            />
          </Field>
          <Field label="Partner's name (optional)">
            <input
              value={form.groom_name}
              onChange={(e) => onChange('groom_name', e.target.value)}
              placeholder="Mike"
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
          <Field label="Event date (optional)">
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => onChange('event_date', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Tone">
          <div className="grid grid-cols-3 gap-2">
            {(['wholesome', 'spicy', 'wild'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange('tone', t)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                  form.tone === t
                    ? 'bg-[#E85D5D] text-white border-[#E85D5D]'
                    : 'bg-white text-[#1E1B3A] border-[#1E1B3A]/15 hover:border-[#1E1B3A]/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#1E1B3A]/55 mt-2">
            wholesome = PG. spicy = PG-13, inside jokes encouraged. wild = R-rated,
            the spicier stories. Never mean-spirited.
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
          {submitting ? 'Creating…' : 'Create event (Stripe stubbed — $0 today)'}
        </button>
        <p className="text-xs text-[#1E1B3A]/45 text-center">
          TODO: this is where the real Stripe Checkout flow will go. For now we
          create the event directly.
        </p>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#1E1B3A] mb-1">{label}</span>
      {children}
    </label>
  );
}

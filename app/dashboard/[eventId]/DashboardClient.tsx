'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Event, Respondent, RespondentRole } from '@/lib/types';

const ROLES: { value: RespondentRole; label: string }[] = [
  { value: 'bride', label: 'Bride' },
  { value: 'groom', label: 'Partner' },
  { value: 'bridesmaid', label: 'Bridesmaid' },
  { value: 'parent', label: 'Parent' },
  { value: 'friend', label: 'Friend' },
];

interface Props {
  event: Event;
  respondents: Respondent[];
  existingGameToken: string | null;
}

export default function DashboardClient({
  event,
  respondents: initial,
  existingGameToken,
}: Props) {
  const router = useRouter();
  const [respondents, setRespondents] = useState<Respondent[]>(initial);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newRole, setNewRole] = useState<RespondentRole>('bridesmaid');
  const [newName, setNewName] = useState('');

  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh());
    }, 10000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    setRespondents(initial);
  }, [initial]);

  const submittedCount = respondents.filter((r) => r.submitted_at).length;
  const totalCount = respondents.length;
  const submittedPct = totalCount === 0 ? 0 : (submittedCount / totalCount) * 100;
  const canGenerate = totalCount > 0 && submittedPct >= 50;

  async function addRespondent() {
    if (!newName.trim() || respondents.length >= 10) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/add-respondent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          role: newRole,
          display_name: newName.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setRespondents((rs) => [...rs, json.respondent]);
      setNewName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function removeRespondent(id: string) {
    if (!confirm('Remove this person? Her link will stop working.')) return;
    try {
      const res = await fetch(`/api/add-respondent?id=${id}`, { method: 'DELETE' });
      if (res.ok) setRespondents((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function generateGame() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate');
      router.push(`/play/${json.game_token}`);
    } catch (err) {
      setError((err as Error).message);
      setGenerating(false);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/questionnaire/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      const el = document.getElementById(`copy-${token}`);
      if (el) {
        const orig = el.textContent;
        el.textContent = 'Copied!';
        setTimeout(() => {
          if (el) el.textContent = orig;
        }, 1500);
      }
    });
  }

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <Link href="/" className="text-sm text-[#5C1A2F]/60 hover:text-[#5C1A2F]">
        ← back
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="script text-5xl sm:text-6xl text-[#5C1A2F] leading-none">
            {event.event_name}
          </h1>
          <p className="text-[#3A1525]/70 mt-2">
            For <span className="font-bold">{event.bride_name}</span>
            {event.groom_name ? (
              <> & <span className="font-bold">{event.groom_name}</span></>
            ) : null}
            {' · '}<span className="capitalize">{event.tone}</span> tone
          </p>
        </div>
        {existingGameToken && (
          <Link
            href={`/play/${existingGameToken}`}
            className="text-sm bg-[#E8D5B7] hover:bg-[#C9B68F] text-[#5C1A2F] font-bold px-4 py-2 rounded-full transition-colors"
          >
            Open existing game →
          </Link>
        )}
      </div>

      <div className="mt-8 card">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#5C1A2F]">Crew responses</h2>
          <span className="text-sm text-[#3A1525]/60">
            {submittedCount} / {totalCount} submitted
          </span>
        </div>
        <div className="mt-3 h-2 bg-[#F8D7DC] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#B76E79] transition-all"
            style={{ width: `${submittedPct}%` }}
          />
        </div>
        <p className="text-xs text-[#3A1525]/55 mt-2">
          The &quot;Build her game&quot; button unlocks once at least half the crew has submitted.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-lg mb-3 text-[#5C1A2F]">The crew</h2>
        {respondents.length === 0 ? (
          <p className="text-[#3A1525]/55 text-sm">
            Add her people below to generate their personal questionnaire links.
          </p>
        ) : (
          <ul className="space-y-3">
            {respondents.map((r) => {
              const url =
                typeof window !== 'undefined'
                  ? `${window.location.origin}/questionnaire/${r.token}`
                  : `/questionnaire/${r.token}`;
              return (
                <li
                  key={r.id}
                  className="card flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#5C1A2F]">
                        {r.display_name || '(no name)'}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-[#3A1525]/55">
                        {r.role}
                      </span>
                      {r.submitted_at ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                          submitted
                        </span>
                      ) : (
                        <span className="text-xs bg-[#F8D7DC] text-[#5C1A2F] px-2 py-0.5 rounded-full">
                          pending
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-[#3A1525]/50 mt-1 block truncate">
                      {url}
                    </code>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      id={`copy-${r.token}`}
                      onClick={() => copyLink(r.token)}
                      className="text-xs bg-[#B76E79] hover:bg-[#9A5660] text-white px-3 py-1.5 rounded-full font-semibold transition-colors"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => removeRespondent(r.id)}
                      className="text-xs bg-[#F8D7DC]/70 hover:bg-[#F8D7DC] text-[#5C1A2F]/75 px-3 py-1.5 rounded-full"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {respondents.length < 10 && (
        <div className="mt-6 card">
          <h3 className="font-bold text-sm mb-3 text-[#5C1A2F]">
            Add to the crew ({respondents.length} / 10)
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as RespondentRole)}
              className="input sm:w-40"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRespondent()}
              placeholder="Display name (e.g. Megan B.)"
              className="input flex-1"
            />
            <button
              onClick={addRespondent}
              disabled={!newName.trim() || adding}
              className="btn-primary"
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 card text-center">
        <h2 className="font-extrabold text-xl text-[#5C1A2F]">Ready to build her game?</h2>
        <p className="text-[#3A1525]/65 mt-1 text-sm">
          {canGenerate
            ? "You've got enough responses. Let's go."
            : `Waiting for at least ${Math.ceil(totalCount * 0.5)} of ${totalCount || 1} to submit.`}
        </p>
        <button
          onClick={generateGame}
          disabled={!canGenerate || generating}
          className="mt-5 bg-[#E8D5B7] hover:bg-[#C9B68F] disabled:opacity-50 disabled:cursor-not-allowed text-[#5C1A2F] font-extrabold px-8 py-4 rounded-full text-lg transition-colors"
        >
          {generating ? 'Building (can take 30s)…' : 'Build her game'}
        </button>
        {!canGenerate && totalCount === 0 && (
          <p className="text-xs text-[#3A1525]/55 mt-3">Add at least one bridesmaid first.</p>
        )}
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-[#3A1525]/40">
        Bookmark this page — anyone with the URL can manage the event.
      </p>
    </main>
  );
}

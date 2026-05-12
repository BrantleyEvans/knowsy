// POST /api/create-event
// Creates a new event with host-configured subjects.
// TODO(stripe): replace this direct create with a Stripe webhook upon successful payment.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import type { Subject } from '@/lib/types';

interface CreateEventBody {
  event_name?: string;
  bride_name?: string;
  groom_name?: string;
  event_type?: string;
  event_date?: string;
  tone?: 'wholesome' | 'spicy' | 'wild';
  creator_email?: string;
  subjects?: Subject[];
}

function validateSubjects(subjects: unknown): { ok: true; subjects: Subject[] } | { ok: false; err: string } {
  if (!Array.isArray(subjects)) return { ok: false, err: 'subjects must be an array' };
  if (subjects.length < 1) return { ok: false, err: 'at least one subject required' };
  if (subjects.length > 5) return { ok: false, err: 'at most 5 subjects (one per category)' };
  const normalized: Subject[] = [];
  let sum = 0;
  for (const s of subjects as Array<Record<string, unknown>>) {
    const id = typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID();
    const name = typeof s.name === 'string' ? s.name.trim() : '';
    const relationship = typeof s.relationship === 'string' ? s.relationship.trim() : '';
    const cc = Number(s.category_count);
    if (!name) return { ok: false, err: 'every subject needs a name' };
    if (!Number.isInteger(cc) || cc < 1 || cc > 5) return { ok: false, err: `category_count must be 1–5 for ${name}` };
    normalized.push({ id, name, relationship: relationship || 'guest', category_count: cc });
    sum += cc;
  }
  if (sum !== 5) return { ok: false, err: `subjects category_count must sum to 5 (got ${sum})` };
  return { ok: true, subjects: normalized };
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateEventBody = await req.json();

    if (!body.event_name || !body.bride_name) {
      return NextResponse.json(
        { error: 'event_name and bride_name are required' },
        { status: 400 }
      );
    }

    const v = validateSubjects(body.subjects);
    if (!v.ok) {
      return NextResponse.json({ error: v.err }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('events')
      .insert({
        event_name: body.event_name,
        bride_name: body.bride_name,
        groom_name: body.groom_name || null,
        event_type: body.event_type || 'bachelorette',
        event_date: body.event_date || null,
        tone: body.tone || 'spicy',
        creator_email: body.creator_email || null,
        subjects: v.subjects,
      })
      .select()
      .single();

    if (error) {
      console.error('create-event error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || 'Unknown error' },
      { status: 500 }
    );
  }
}

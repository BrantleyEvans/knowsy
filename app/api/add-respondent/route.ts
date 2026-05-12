// POST /api/add-respondent
// Adds a respondent to an event and returns the row (including the token).

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

const VALID_ROLES = ['bride', 'groom', 'bridesmaid', 'parent', 'friend'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, role, display_name } = body || {};

    if (!event_id || !role) {
      return NextResponse.json({ error: 'event_id and role are required' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `role must be one of ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('respondents')
      .insert({ event_id, role, display_name: display_name || null })
      .select()
      .single();

    if (error) {
      console.error('add-respondent error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ respondent: data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = getAdminSupabase();
    const { error } = await supabase.from('respondents').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

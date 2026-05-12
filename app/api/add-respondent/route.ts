// POST /api/add-respondent
// Adds a respondent to an event. Role is now optional metadata.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, role, display_name } = body || {};

    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }
    if (!display_name || !display_name.trim()) {
      return NextResponse.json({ error: 'display_name required' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('respondents')
      .insert({
        event_id,
        role: role && typeof role === 'string' && role.trim() ? role.trim() : null,
        display_name: display_name.trim(),
      })
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

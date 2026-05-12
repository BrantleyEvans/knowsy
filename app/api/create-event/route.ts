// POST /api/create-event
// Creates a new event. Stub Stripe — for now we just create the event without payment.
// TODO(stripe): once the Stripe Checkout integration is live, this route should
// either (a) verify a Stripe Checkout session ID, or (b) be replaced by the
// Stripe webhook that creates the event upon successful payment.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

interface CreateEventBody {
  event_name?: string;
  bride_name?: string;
  groom_name?: string;
  event_type?: string;
  event_date?: string;
  tone?: 'wholesome' | 'spicy' | 'wild';
  creator_email?: string;
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
        // stripe_payment_id will be set after Stripe integration
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

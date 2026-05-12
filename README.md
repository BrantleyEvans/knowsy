# PartyJeopardy — MVP

AI-generated, hyper-personal trivia for bachelorette/bachelor parties. The maid
of honor (MOH) collects survey answers from the bridal party, Claude turns those
answers into a 5x5 trivia board + Final round, and the party plays it live off
one screen.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres) for storage
- Anthropic SDK for game generation (claude-sonnet-4-5)
- Stripe — STUBBED for MVP. The Create button creates the event without payment.
  Integration points are marked with TODO(stripe) comments.

## Quick start

1. Install deps: `npm install`
2. Create a Supabase project at supabase.com, open the SQL editor, paste in
   `supabase/schema.sql`, and run it.
3. Get an Anthropic API key from console.anthropic.com.
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   If you skip the Anthropic key, the app will fall back to built-in sample
   game data so you can still see the play UI working end-to-end.
5. `npm run dev`

Then open http://localhost:3000. Flow: landing → create event → add respondents
→ copy questionnaire link → fill it out → back to dashboard → generate game →
play the board.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import at vercel.com/new.
3. Paste the four env vars from step 4 above.
4. Deploy.

## What's stubbed / future work

- Stripe — the /create flow short-circuits payment. Search code for TODO(stripe).
- Auth — there is no auth. Anyone with the dashboard URL can manage an event.
  Plan: Supabase Auth, scoped to the creator's user_id.
- Email sending — the MOH manually copies the questionnaire links.

## File tour

```
app/
  page.tsx                          Landing
  create/page.tsx                   Event creation form
  dashboard/[eventId]/              MOH dashboard
  questionnaire/[respondentToken]/  Public respondent form
  questionnaire/success/            Thank-you page
  play/[gameToken]/                 Game presentation
  api/                              create-event, add-respondent,
                                    submit-questionnaire, generate-game,
                                    regenerate-question, save-game-state
lib/
  supabase.ts        Browser + server + admin clients
  anthropic.ts       generateGame() — the heart of the product
  questions.ts       Question banks for all 5 respondent roles
  sample-game.ts     Fallback sample data when no API key set
  types.ts           Shared TypeScript types
components/
  JeopardyBoard.tsx     5x5 board, Final round, winner
  QuestionDisplay.tsx   Fullscreen question + award buttons
  Scoreboard.tsx        4 editable team scores
  QuestionnaireForm.tsx Respondent form (role-aware)
supabase/
  schema.sql
```

## License

MIT. UI inspired by the classic trivia format. Not affiliated with Jeopardy
Productions, Inc. — the user-visible copy intentionally uses generic terms
("Trivia Game", "Quiz Board") to stay clear of trademark issues.

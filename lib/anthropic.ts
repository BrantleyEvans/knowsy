// Anthropic client + the generateGame function — the heart of the product.

import Anthropic from '@anthropic-ai/sdk';
import type { Event, GameData, Respondent, Response } from './types';

const MODEL = 'claude-sonnet-4-5-20250929';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey });
}

export const GAME_GENERATION_SYSTEM_PROMPT = `You are generating a personalized Jeopardy-style trivia game for a bachelorette/bachelor party. The game will be played live at the party with 4 teams competing. Your job is to take real, specific details from the respondents' survey answers and turn them into 5 categories x 5 questions each, plus one Final Jeopardy question.

REQUIREMENTS:
1. CATEGORIES must be specific to this group, not generic. Examples of GOOD category names: "Sarah's Greatest Hits", "Things Mike Has Said At 2am", "Bridesmaid Lore", "Sarah's College Era". Examples of BAD: "About The Bride", "Trivia", "Fun Facts". Every category should be inside-baseball — the kind of name only a friend would write.
2. QUESTIONS must reference SPECIFIC details from the responses. Bad: "What is Sarah's favorite drink?". Good: "Sarah's drink order at any bar — specify cocktail AND garnish." Use real names, places, stories, exact phrases respondents wrote. Be specific to the point that someone outside the group couldn't answer.
3. ANSWERS must be verifiable from the responses provided. Do NOT invent facts not in the data. If multiple respondents disagree, use the answer most respondents gave OR phrase the question so multiple answers are acceptable. Keep answers short (1-2 sentences max).
4. DIFFICULTY scales with point value:
   - $100: Easy — most respondents agree on the answer
   - $200: Slightly harder — specific recall
   - $300: Medium — references a specific detail
   - $400: Hard — niche detail or precise wording
   - $500: Very hard — a single specific story or precise detail
5. TONE: Match the requested tone from the event:
   - wholesome: PG, sweet, celebrates the bride. No edgy content.
   - spicy: PG-13, includes embarrassing moments and inside jokes. Default.
   - wild: R-rated, includes the spicier stories, but never mean-spirited.
6. EVERY question should LAND. No filler. If you don't have enough material for a 5th question in a category, fold it into another category — but you must produce exactly 5 categories of 5 questions each.
7. FINAL JEOPARDY should be the most emotionally resonant question — something that might make the bride laugh AND tear up. Reference a moment from the data that hits.
8. AVOID: mean-spirited questions, references to exes, sexual content beyond suggestive (even on "wild" tone), anything that would embarrass the bride in front of family.

OUTPUT (strict JSON, no preamble, no markdown fences):
{
  "categories": [
    {
      "name": "string",
      "questions": [
        {
          "points": 100,
          "question_text": "string",
          "answer_text": "string",
          "source_respondents": ["string array of display names whose answers informed this"]
        }
      ]
    }
  ],
  "final_jeopardy": {
    "category": "string",
    "question_text": "string",
    "answer_text": "string"
  }
}

You must return EXACTLY 5 categories, each with EXACTLY 5 questions at point values 100, 200, 300, 400, 500. Plus exactly one final_jeopardy object.`;

export interface GenerateGameInput {
  event: Event;
  respondents: Respondent[];
  responses: Response[];
}

function formatPromptBody(input: GenerateGameInput): string {
  const { event, respondents, responses } = input;

  const respondentBlocks: string[] = [];
  for (const r of respondents) {
    const myResponses = responses.filter((resp) => resp.respondent_id === r.id);
    if (myResponses.length === 0) continue;
    const lines = myResponses
      .filter((rr) => rr.answer_text && rr.answer_text.trim())
      .map((rr) => `  Q: ${rr.question_text}\n  A: ${rr.answer_text}`)
      .join('\n\n');
    if (!lines) continue;
    respondentBlocks.push(
      `--- ${r.display_name || 'Anonymous'} (${r.role}) ---\n${lines}`
    );
  }

  return `EVENT DETAILS:
- Event name: ${event.event_name}
- Bride: ${event.bride_name}
- Groom/partner: ${event.groom_name || '(none listed)'}
- Event type: ${event.event_type}
- Tone (this is important — match it): ${event.tone}

RESPONSES FROM ${respondentBlocks.length} respondent(s):

${respondentBlocks.join('\n\n')}

Now generate the trivia game as strict JSON per the system prompt. Remember: 5 categories x 5 questions + 1 Final Jeopardy. Use real names and specific details from the responses above. Match the tone "${event.tone}".`;
}

function stripJSONFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }
  return t.trim();
}

function extractJSON(text: string): string {
  // Find the first { and last } to be resilient if Claude adds any preamble.
  const stripped = stripJSONFences(text);
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No JSON object found in response');
  }
  return stripped.slice(firstBrace, lastBrace + 1);
}

function validateGameData(data: unknown): GameData {
  if (!data || typeof data !== 'object') throw new Error('Response is not an object');
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.categories)) throw new Error('Missing categories array');
  if (!d.final_jeopardy || typeof d.final_jeopardy !== 'object') {
    throw new Error('Missing final_jeopardy');
  }
  if (d.categories.length !== 5) {
    throw new Error(`Expected 5 categories, got ${d.categories.length}`);
  }
  for (const cat of d.categories as Array<Record<string, unknown>>) {
    if (!cat.name || typeof cat.name !== 'string') throw new Error('Category missing name');
    if (!Array.isArray(cat.questions) || cat.questions.length !== 5) {
      throw new Error(`Category "${cat.name}" must have 5 questions`);
    }
    for (const q of cat.questions as Array<Record<string, unknown>>) {
      if (typeof q.points !== 'number') throw new Error('Question missing points');
      if (typeof q.question_text !== 'string') throw new Error('Question missing text');
      if (typeof q.answer_text !== 'string') throw new Error('Question missing answer');
      if (!Array.isArray(q.source_respondents)) q.source_respondents = [];
    }
  }
  const fj = d.final_jeopardy as Record<string, unknown>;
  if (typeof fj.category !== 'string') throw new Error('Final jeopardy missing category');
  if (typeof fj.question_text !== 'string') throw new Error('Final jeopardy missing question_text');
  if (typeof fj.answer_text !== 'string') throw new Error('Final jeopardy missing answer_text');

  return data as unknown as GameData;
}

/**
 * Calls Claude with the structured prompt and returns a validated GameData.
 */
export async function generateGame(input: GenerateGameInput): Promise<GameData> {
  const client = getClient();
  const body = formatPromptBody(input);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: GAME_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: body }],
  });

  // Extract text from response blocks
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  if (!text) throw new Error('Empty response from Claude');

  const jsonStr = extractJSON(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${(err as Error).message}\n\nRaw: ${text.slice(0, 500)}`);
  }
  return validateGameData(parsed);
}

/**
 * Regenerate a single question, given the existing context and the question to replace.
 * Used by the /api/regenerate-question route.
 */
export async function regenerateSingleQuestion(
  input: GenerateGameInput,
  existing: GameData,
  categoryIndex: number,
  questionIndex: number
): Promise<GameData['categories'][number]['questions'][number]> {
  const client = getClient();
  const cat = existing.categories[categoryIndex];
  const oldQ = cat.questions[questionIndex];
  const body = formatPromptBody(input) +
    `\n\nIMPORTANT: I need a REPLACEMENT for the following question in the "${cat.name}" category (${oldQ.points} points). The current question and answer is:\nQ: ${oldQ.question_text}\nA: ${oldQ.answer_text}\n\nReturn ONLY the new question as JSON in this exact shape (no preamble, no markdown): { "points": ${oldQ.points}, "question_text": "...", "answer_text": "...", "source_respondents": [] }`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: GAME_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: body }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const stripped = stripJSONFences(text);
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  const jsonStr = stripped.slice(first, last + 1);
  const parsed = JSON.parse(jsonStr);
  return {
    points: parsed.points || oldQ.points,
    question_text: parsed.question_text,
    answer_text: parsed.answer_text,
    source_respondents: parsed.source_respondents || [],
  };
}

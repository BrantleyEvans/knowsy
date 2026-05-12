// Anthropic client + the generateGame function — the heart of the product.
//
// v2 model: input is a list of host-configured subjects (each with a
// category_count). The AI distributes 5 board categories per the host's mix
// and draws each category's content from that subject's pooled responses.

import Anthropic from '@anthropic-ai/sdk';
import type { Event, GameData, Respondent, Response, Subject } from './types';

const MODEL = 'claude-sonnet-4-5-20250929';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey });
}

export const GAME_GENERATION_SYSTEM_PROMPT = `You are generating a personalized trivia game for a bachelorette/bachelor party. The game will be played live at the party with 4 teams competing. Your job is to take real, specific details from the responses and turn them into a 5-category x 5-question board, plus one Final round question.

THE HOST has pre-configured a list of SUBJECTS — the people who will get their own board categories — along with how many of the 5 total categories each subject should receive. You MUST honor that distribution exactly. For example: subject "Kat" with category_count=2 means TWO categories on the board are about Kat. Sum of category_count across subjects is always exactly 5.

REQUIREMENTS:

1. CATEGORY DISTRIBUTION: Generate exactly the number of categories per subject the host specified. Tag each category with "subject_id" matching the input subject's id. If a subject has multiple categories, give each one a distinct angle (e.g. "Kat's College Era" vs "Kat's Drink Order Has Layers").

2. CATEGORIES must be specific to the subject and the group, not generic. GOOD: "Kat's Greatest Hits", "Things Mike Says At 2am", "Bridesmaid Group Chat Lore". BAD: "About The Bride", "Trivia", "Fun Facts". Every category name should be inside-baseball — the kind only a friend would write.

3. QUESTIONS must reference SPECIFIC details from the responses about that subject. Use real names, places, exact phrasing the respondents used. Be specific to the point that someone outside the group couldn't guess.

4. ANSWERS must be verifiable from the responses. Do NOT invent facts not in the data. Keep answers short (1-2 sentences max). CRITICAL: Output answers as plain DECLARATIVE statements, never as questions. Do not use the "What is X?" / "Who is X?" Jeopardy phrasing. Bad: "What is a hand grenade?" Good: "A hand grenade." Bad: "Who is Megan?" Good: "Megan, the maid of honor." The question_text field is the clue; the answer_text field is the statement that resolves it.

5. DIFFICULTY scales with point value:
   - $100: Easy — most respondents agree on the answer
   - $200: Slightly harder — specific recall
   - $300: Medium — references a specific detail
   - $400: Hard — niche detail or precise wording
   - $500: Very hard — a single specific story or precise detail

6. TONE: Match the requested tone:
   - wholesome: PG, sweet, celebrates the people. No edgy content.
   - spicy: PG-13, includes embarrassing moments and inside jokes. Default.
   - wild: R-rated, the spicier stories, but never mean-spirited.

7. EVERY question should LAND. No filler. If a subject's responses are thin, ask the host to collect more rather than making things up — but you still MUST output 5 questions per category. Use the same source detail from different angles before inventing.

8. FINAL ROUND should be the most emotionally resonant question — one that might make people laugh AND tear up. Reference a moment from the data that hits. It can be about any subject or about the event/relationship as a whole.

9. AVOID: mean-spirited questions, references to exes, sexual content beyond suggestive (even on "wild" tone), anything that would embarrass anyone in front of family.

OUTPUT (strict JSON, no preamble, no markdown fences):
{
  "categories": [
    {
      "name": "string",
      "subject_id": "string (must match one of the input subject ids)",
      "questions": [
        {
          "points": 100,
          "question_text": "string",
          "answer_text": "string (declarative, not 'What is X?')",
          "source_respondents": ["string array of display names whose answers informed this"]
        }
      ]
    }
  ],
  "final_jeopardy": {
    "category": "string",
    "question_text": "string",
    "answer_text": "string (declarative)"
  }
}

You must return EXACTLY 5 categories total — the per-subject counts MUST exactly match the host's category_count. Each category has EXACTLY 5 questions at point values 100/200/300/400/500. Plus exactly one final_jeopardy.`;

export interface GenerateGameInput {
  event: Event;
  respondents: Respondent[];
  responses: Response[];
}

function formatPromptBody(input: GenerateGameInput): string {
  const { event, respondents, responses } = input;
  const subjects: Subject[] = event.subjects || [];

  // Group responses by subject_id
  const respondentNameById = new Map<string, string>();
  for (const r of respondents) {
    respondentNameById.set(r.id, r.display_name || 'Anonymous');
  }

  const blocksBySubjectId = new Map<string, string[]>();
  for (const r of responses) {
    if (!r.answer_text || !r.answer_text.trim()) continue;
    const sid = r.subject_id || 'unassigned';
    if (!blocksBySubjectId.has(sid)) blocksBySubjectId.set(sid, []);
    const respondentName = respondentNameById.get(r.respondent_id) || 'Anonymous';
    blocksBySubjectId.get(sid)!.push(
      `  [from ${respondentName}]\n  Q: ${r.question_text}\n  A: ${r.answer_text}`
    );
  }

  const subjectBlocks: string[] = [];
  for (const s of subjects) {
    const ansBlocks = blocksBySubjectId.get(s.id) || [];
    subjectBlocks.push(
      `=== SUBJECT: ${s.name} (${s.relationship}) — category_count: ${s.category_count}, id: ${s.id} ===\n${
        ansBlocks.length > 0
          ? ansBlocks.join('\n\n')
          : '(no responses collected for this subject — keep questions generic but still personal-feeling, drawing on the subject name + relationship)'
      }`
    );
  }

  return `EVENT DETAILS:
- Event name: ${event.event_name}
- Event type: ${event.event_type}
- Tone (match this exactly): ${event.tone}

SUBJECTS (${subjects.length}) and their category counts (sum must equal 5):
${subjects.map((s) => `  - ${s.name} (${s.relationship}): ${s.category_count} category(ies), id=${s.id}`).join('\n')}

RESPONSES grouped by subject:

${subjectBlocks.join('\n\n')}

Now generate the board as strict JSON per the system prompt. Honor each subject's category_count exactly. Tag each category with subject_id. Answers must be DECLARATIVE STATEMENTS, never "What is X?" questions.`;
}

function stripJSONFences(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  }
  return t.trim();
}

function extractJSON(text: string): string {
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

export async function generateGame(input: GenerateGameInput): Promise<GameData> {
  const client = getClient();
  const body = formatPromptBody(input);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: GAME_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: body }],
  });

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

// All TypeScript types for the Knowsy app.

export type Tone = 'wholesome' | 'spicy' | 'wild';
export type EventStatus = 'collecting' | 'generated' | 'played' | 'archived';

/**
 * A "subject" is a person (or group) the host has chosen to feature on the
 * board, plus how many of the 5 categories they get. Sum of category_count
 * across all subjects must equal 5.
 */
export interface Subject {
  id: string;            // stable id within the event (e.g. crypto.randomUUID())
  name: string;          // display name shown to respondents + AI
  relationship: string;  // freeform: "bride" | "groom" | "partner" | "squad" | "parents" | "friends" | …
  category_count: number; // 1–5
}

export interface Event {
  id: string;
  event_name: string;
  bride_name: string;
  groom_name: string | null;
  event_type: string;
  event_date: string | null;
  tone: Tone;
  creator_email: string | null;
  stripe_payment_id: string | null;
  status: EventStatus;
  subjects: Subject[];   // v2 — host-configured category mix
  created_at: string;
  generated_at: string | null;
}

export interface Respondent {
  id: string;
  event_id: string;
  role: string | null;   // v2 — optional metadata only
  display_name: string | null;
  token: string;
  submitted_at: string | null;
  created_at: string;
}

export interface Response {
  id: string;
  respondent_id: string;
  subject_id: string | null;  // v2 — which subject this answer is about
  question_key: string;
  question_text: string | null;
  answer_text: string | null;
  created_at: string;
}

// Open-ended questionnaire prompt
export interface SubjectPrompt {
  key: string;
  template: string; // contains [NAME] placeholder
}

// Generated game shape (output from Claude) — unchanged
export interface GameQuestion {
  points: number;
  question_text: string;
  answer_text: string;
  source_respondents: string[];
}

export interface GameCategory {
  name: string;
  subject_id?: string; // v2 — which subject this category belongs to
  questions: GameQuestion[];
}

export interface FinalJeopardy {
  category: string;
  question_text: string;
  answer_text: string;
}

export interface GameData {
  categories: GameCategory[];
  final_jeopardy: FinalJeopardy;
}

export interface TeamScores {
  [teamId: string]: number;
}

export interface PlayedQuestion {
  category_index: number;
  question_index: number;
  awarded_team?: string;
  points_awarded?: number;
}

export interface GameState {
  played_questions: PlayedQuestion[];
  team_scores: TeamScores;
  team_names?: { [teamId: string]: string };
  final_played?: boolean;
  final_wagers?: { [teamId: string]: number };
  final_results?: { [teamId: string]: boolean };
}

export interface Game {
  id: string;
  event_id: string;
  token: string;
  game_data: GameData;
  game_state: GameState;
  generated_at: string;
  prompt_version: number;
}

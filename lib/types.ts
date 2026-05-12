// All TypeScript types for the PartyJeopardy app.

export type Tone = 'wholesome' | 'spicy' | 'wild';
export type EventStatus = 'collecting' | 'generated' | 'played' | 'archived';
export type RespondentRole = 'bride' | 'groom' | 'bridesmaid' | 'parent' | 'friend';

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
  created_at: string;
  generated_at: string | null;
}

export interface Respondent {
  id: string;
  event_id: string;
  role: RespondentRole;
  display_name: string | null;
  token: string;
  submitted_at: string | null;
  created_at: string;
}

export interface Response {
  id: string;
  respondent_id: string;
  question_key: string;
  question_text: string | null;
  answer_text: string | null;
  created_at: string;
}

// Question bank types
export type QuestionInputType = 'text' | 'longtext' | 'multiselect' | 'select';

export interface QuestionDef {
  key: string;
  text: string;
  type: QuestionInputType;
  options?: string[];
  optional?: boolean;
  spicyOnly?: boolean;
}

// Generated game shape (output from Claude)
export interface GameQuestion {
  points: number;
  question_text: string;
  answer_text: string;
  source_respondents: string[];
}

export interface GameCategory {
  name: string;
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

// Game state (mutable during play)
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

// Question banks for each respondent role.
// [BRIDE] and [GROOM] tokens are replaced with the actual names from the
// event when the form is rendered.

import type { QuestionDef, RespondentRole } from './types';

export const BRIDESMAID_QUESTIONS: QuestionDef[] = [
  { key: 'how_long_known', text: 'How long have you known [BRIDE]?', type: 'text' },
  { key: 'funniest_memory', text: "Tell us your funniest specific memory with [BRIDE]. Give us the story — names, place, what happened.", type: 'longtext' },
  { key: 'inside_joke', text: "What's an inside joke or running bit between you and [BRIDE]?", type: 'longtext' },
  { key: 'embarrassing_moment', text: "What's [BRIDE]'s most embarrassing moment that's safe to share at a party?", type: 'longtext' },
  { key: 'most_likely_to', text: '[BRIDE] is most likely to...', type: 'multiselect', options: [
    'Cry at a Pixar movie',
    'Lose her phone before midnight',
    'Be the first one on the dance floor',
    'Talk to strangers at the bar',
    'Order the spiciest thing on the menu',
    'Fall asleep before 10pm',
    'Pick the restaurant',
    'Send a 3am voice memo',
    'Forget where she parked',
    'Quote a movie no one else has seen',
  ] },
  { key: 'spirit_animal', text: 'If [BRIDE] were an animal, what would she be and why?', type: 'longtext' },
  { key: 'most_used_emoji', text: "What's [BRIDE]'s most-used emoji?", type: 'text' },
  { key: 'drink_order', text: "What's [BRIDE]'s drink order?", type: 'text' },
  { key: 'karaoke_song', text: 'What song will [BRIDE] ALWAYS pull up at karaoke?', type: 'text' },
  { key: 'thinks_good_at', text: "What's something [BRIDE] thinks she's good at but isn't?", type: 'longtext' },
  { key: 'actually_amazing_at', text: "What's something [BRIDE] is actually amazing at?", type: 'longtext' },
  { key: 'only_bride_would', text: 'Finish this sentence: "Only [BRIDE] would..."', type: 'longtext' },
  { key: 'signature_move', text: "What's [BRIDE]'s signature move at a party (in one word)?", type: 'text' },
  { key: 'wild_story_optional', text: "(OPTIONAL - SPICY) What's the wildest thing you've ever done with [BRIDE]? Be specific.", type: 'longtext', optional: true, spicyOnly: true },
];

export const BRIDE_QUESTIONS: QuestionDef[] = [
  { key: 'self_describe_three_words', text: 'Describe yourself in three words.', type: 'text' },
  { key: 'meeting_story', text: 'How did you and [GROOM] meet? Give us the unedited version.', type: 'longtext' },
  { key: 'first_impression_groom', text: 'What was your honest first impression of [GROOM]?', type: 'longtext' },
  { key: 'first_kiss', text: 'Where was your first kiss with [GROOM]?', type: 'text' },
  { key: 'groom_proposal', text: 'How did [GROOM] propose? Were you surprised?', type: 'longtext' },
  { key: 'pet_name_for_groom', text: 'What pet name do you call [GROOM] in private?', type: 'text' },
  { key: 'groom_worst_habit', text: "What's [GROOM]'s worst habit?", type: 'text' },
  { key: 'groom_best_quality', text: "What's [GROOM]'s best quality?", type: 'text' },
  { key: 'argue_about', text: 'What do you and [GROOM] argue about most?', type: 'text' },
  { key: 'fav_date', text: 'Most memorable date you and [GROOM] have had together?', type: 'longtext' },
  { key: 'song_that_describes_us', text: 'What song describes your relationship with [GROOM]?', type: 'text' },
  { key: 'guilty_pleasure', text: "What's your biggest guilty pleasure?", type: 'text' },
  { key: 'fav_drink', text: "What's your go-to drink order?", type: 'text' },
  { key: 'karaoke_song_self', text: 'Your go-to karaoke song?', type: 'text' },
  { key: 'travel_dream', text: "What's the next place you and [GROOM] want to travel to?", type: 'text' },
];

export const GROOM_QUESTIONS: QuestionDef[] = [
  { key: 'self_describe_three_words', text: 'Describe yourself in three words.', type: 'text' },
  { key: 'meeting_story', text: 'How did you and [BRIDE] meet? Tell it your way.', type: 'longtext' },
  { key: 'first_impression_bride', text: 'What was your honest first impression of [BRIDE]?', type: 'longtext' },
  { key: 'moment_knew', text: 'When did you know [BRIDE] was the one?', type: 'longtext' },
  { key: 'proposal_plan', text: 'Walk us through how you proposed.', type: 'longtext' },
  { key: 'pet_name_for_bride', text: 'What pet name do you call [BRIDE] in private?', type: 'text' },
  { key: 'bride_worst_habit', text: "What's [BRIDE]'s worst habit?", type: 'text' },
  { key: 'bride_best_quality', text: "What's [BRIDE]'s best quality?", type: 'text' },
  { key: 'thing_bride_corrects', text: "What's something [BRIDE] always corrects you on?", type: 'text' },
  { key: 'fav_thing_about_bride', text: "Your favorite thing about [BRIDE]?", type: 'longtext' },
  { key: 'argue_about', text: 'What do you and [BRIDE] argue about most?', type: 'text' },
  { key: 'fav_date', text: 'Most memorable date with [BRIDE]?', type: 'longtext' },
  { key: 'fav_drink', text: 'Your go-to drink order?', type: 'text' },
  { key: 'karaoke_song_self', text: 'Your go-to karaoke song?', type: 'text' },
  { key: 'something_bride_doesnt_know', text: "What's one thing [BRIDE] doesn't know about you yet?", type: 'longtext' },
];

export const PARENT_QUESTIONS: QuestionDef[] = [
  { key: 'relation', text: 'What is your relationship to [BRIDE]?', type: 'text' },
  { key: 'first_word', text: "What was [BRIDE]'s first word?", type: 'text' },
  { key: 'childhood_nickname', text: "What did you call [BRIDE] growing up?", type: 'text' },
  { key: 'first_obsession', text: "What was [BRIDE]'s first big obsession (toy, show, hobby, person)?", type: 'longtext' },
  { key: 'biggest_kid_misadventure', text: "Tell us a story about [BRIDE]'s biggest childhood misadventure.", type: 'longtext' },
  { key: 'thing_caused_trouble', text: "What did [BRIDE] do that got her in the most trouble as a kid?", type: 'longtext' },
  { key: 'kid_dream_job', text: 'What did [BRIDE] want to be when she grew up?', type: 'text' },
  { key: 'first_heartbreak', text: 'When was [BRIDE]\'s first heartbreak (puppy love counts)?', type: 'longtext' },
  { key: 'embarrassing_kid_moment', text: "What's [BRIDE]'s most embarrassing childhood moment?", type: 'longtext' },
  { key: 'family_trait', text: 'What family trait does [BRIDE] have the most of?', type: 'text' },
  { key: 'proud_moment', text: 'A moment [BRIDE] made you really proud?', type: 'longtext' },
  { key: 'kid_food', text: "What was [BRIDE]'s favorite meal as a kid?", type: 'text' },
  { key: 'kid_phase', text: 'What was the weirdest phase [BRIDE] went through?', type: 'longtext' },
  { key: 'what_you_wish_groom_knew', text: 'One thing you wish [GROOM] knew about [BRIDE]?', type: 'longtext' },
];

export const FRIEND_QUESTIONS: QuestionDef[] = [
  { key: 'how_long_known', text: 'How long have you known [BRIDE]?', type: 'text' },
  { key: 'how_you_met', text: 'How did you and [BRIDE] meet?', type: 'longtext' },
  { key: 'best_story', text: "What's your single best story with [BRIDE]? Be specific.", type: 'longtext' },
  { key: 'inside_joke', text: "What's an inside joke between you and [BRIDE]?", type: 'longtext' },
  { key: 'best_quality', text: "What's [BRIDE]'s best quality as a friend?", type: 'text' },
  { key: 'one_word_describe', text: 'Describe [BRIDE] in one word.', type: 'text' },
  { key: 'drink_order', text: "[BRIDE]'s drink order?", type: 'text' },
  { key: 'karaoke_song', text: '[BRIDE]\'s go-to karaoke song?', type: 'text' },
  { key: 'most_likely_to', text: '[BRIDE] is most likely to...', type: 'multiselect', options: [
    'Text back instantly',
    'Take 3 days to text back',
    'Be late to her own wedding',
    'Order tequila',
    'Get us all kicked out',
    'Cry happy tears',
    'Lose her phone',
    'Make us food at 2am',
  ] },
  { key: 'unfiltered_quote', text: "What's a quintessential [BRIDE] quote?", type: 'longtext' },
  { key: 'thing_you_admire', text: 'One thing you genuinely admire about [BRIDE]?', type: 'longtext' },
  { key: 'wildest_thing', text: "(OPTIONAL) What's the wildest thing you've ever done with [BRIDE]?", type: 'longtext', optional: true, spicyOnly: true },
];

export function getQuestionsForRole(role: RespondentRole): QuestionDef[] {
  switch (role) {
    case 'bride': return BRIDE_QUESTIONS;
    case 'groom': return GROOM_QUESTIONS;
    case 'bridesmaid': return BRIDESMAID_QUESTIONS;
    case 'parent': return PARENT_QUESTIONS;
    case 'friend': return FRIEND_QUESTIONS;
  }
}

export function renderQuestionText(text: string, brideName: string, groomName?: string | null): string {
  return text
    .replaceAll('[BRIDE]', brideName)
    .replaceAll('[GROOM]', groomName || 'her partner');
}

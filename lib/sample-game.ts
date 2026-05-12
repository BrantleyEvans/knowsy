// Hard-coded sample game data. Used by /api/generate-game as a fallback when
// no ANTHROPIC_API_KEY is configured (preview / demo mode) or as a stub for
// local development. The bride/groom names get swapped in dynamically.

import type { GameData, Event } from './types';

export function sampleGame(event: Event): GameData {
  const bride = event.bride_name || 'The Bride';
  const groom = event.groom_name || 'The Partner';

  return {
    categories: [
      {
        name: `${bride}'s Greatest Hits`,
        questions: [
          {
            points: 100,
            question_text: `What's ${bride}'s go-to drink order?`,
            answer_text: 'An espresso martini, no foam, two limes.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 200,
            question_text: `${bride} is most likely to do this at any wedding.`,
            answer_text: 'Be the first one on the dance floor.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 300,
            question_text: `${bride}'s signature karaoke song is...`,
            answer_text: 'Wagon Wheel by Old Crow Medicine Show.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 400,
            question_text: `Name the city where ${bride} got the tattoo she swears she doesn't regret.`,
            answer_text: 'Nashville.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 500,
            question_text: `${bride}'s exact age the first time she ordered a tequila shot.`,
            answer_text: '21 years and three days old.',
            source_respondents: ['Demo Respondent'],
          },
        ],
      },
      {
        name: `How ${bride} & ${groom} Met`,
        questions: [
          {
            points: 100,
            question_text: `What city did ${bride} and ${groom} meet in?`,
            answer_text: 'Charleston, SC.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 200,
            question_text: `Who introduced ${bride} to ${groom}?`,
            answer_text: 'A mutual friend at a backyard cookout.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 300,
            question_text: `What did ${groom} say about ${bride} the first time he saw her?`,
            answer_text: '"That girl is trouble — in the best way."',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 400,
            question_text: `Where was their first date?`,
            answer_text: 'A rooftop bar that they never went back to.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 500,
            question_text: `The exact phrase ${groom} used when he asked ${bride} to be his girlfriend.`,
            answer_text: '"You wanna make this official, or what?"',
            source_respondents: ['Demo Respondent'],
          },
        ],
      },
      {
        name: 'Bridesmaid Lore',
        questions: [
          {
            points: 100,
            question_text: `How many bridesmaids are in the wedding?`,
            answer_text: 'Seven.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 200,
            question_text: `Which bridesmaid has known ${bride} the longest?`,
            answer_text: 'The one from middle school.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 300,
            question_text: `What is the running group-chat inside joke?`,
            answer_text: '"It\'s giving lunch."',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 400,
            question_text: `Name the bachelorette destination that got vetoed first.`,
            answer_text: 'Las Vegas.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 500,
            question_text: `Which bridesmaid lost her phone the night of the engagement party?`,
            answer_text: 'Allegedly the maid of honor.',
            source_respondents: ['Demo Respondent'],
          },
        ],
      },
      {
        name: `${bride} Through The Years`,
        questions: [
          {
            points: 100,
            question_text: `${bride}'s childhood nickname.`,
            answer_text: 'Bug.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 200,
            question_text: `What did ${bride} want to be when she grew up?`,
            answer_text: 'A marine biologist.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 300,
            question_text: `Name the sport ${bride} got cut from in 7th grade.`,
            answer_text: 'Volleyball.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 400,
            question_text: `Where was ${bride}'s first kiss?`,
            answer_text: 'The Friday-night football game bleachers.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 500,
            question_text: `The college major ${bride} declared, dropped, and re-declared.`,
            answer_text: 'Marketing.',
            source_respondents: ['Demo Respondent'],
          },
        ],
      },
      {
        name: 'Most Likely To',
        questions: [
          {
            points: 100,
            question_text: `Who texts back the slowest in the group?`,
            answer_text: bride,
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 200,
            question_text: `Who's the designated mom of the friend group?`,
            answer_text: bride,
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 300,
            question_text: `Who cries first at the wedding?`,
            answer_text: groom,
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 400,
            question_text: `Who will have the wildest toast?`,
            answer_text: 'The maid of honor.',
            source_respondents: ['Demo Respondent'],
          },
          {
            points: 500,
            question_text: `Who's most likely to be at the after-after party?`,
            answer_text: `${bride}, obviously.`,
            source_respondents: ['Demo Respondent'],
          },
        ],
      },
    ],
    final_jeopardy: {
      category: `What ${groom} Wrote In His Vows`,
      question_text: `Complete the sentence: "${bride}, the moment I knew was when you..."`,
      answer_text: '"...laughed so hard at your own joke that you snorted, and I realized I never wanted to miss a single one."',
    },
  };
}

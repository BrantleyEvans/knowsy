// v2 model: open-ended prompts asked per subject the host has configured.
// Respondents see one section per subject, each with these 4 optional textareas.

import type { SubjectPrompt } from './types';

export const SUBJECT_PROMPTS: SubjectPrompt[] = [
  {
    key: 'funny_stories',
    template: 'Funny stories about [NAME]? Be specific — names, places, what happened.',
  },
  {
    key: 'quotes',
    template: 'Quotable quotes from [NAME]? The lines you and your friends still repeat.',
  },
  {
    key: 'fun_facts',
    template: 'Fun facts about [NAME]? Things only the inner circle knows.',
  },
  {
    key: 'anything_else',
    template: 'Anything else funny, embarrassing, or memorable about [NAME]?',
  },
];

export function renderPromptText(template: string, subjectName: string): string {
  return template.replaceAll('[NAME]', subjectName);
}

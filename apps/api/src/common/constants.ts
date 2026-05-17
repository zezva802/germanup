export const A1_TOPICS = [
  'praesens',
  'noun-gender',
  'cases',
  'personal-pronouns',
  'possessive-pronouns',
  'modal-verbs',
  'dativ-prepositions',
  'akkusativ-prepositions',
  'two-way-prepositions',
  'imperative',
  'separable-verbs',
  'future-werden',
  'numbers-dates-time',
] as const;

export type A1Topic = (typeof A1_TOPICS)[number];

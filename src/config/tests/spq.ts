import { TestConfig } from './types';

const yesNoOptions = [
  { value: 1, label: 'Да' },
  { value: 0, label: 'Нет' }
];

export const spqTest: TestConfig = {
  id: 'schizotypy',
  name: 'SPQ-B',
  title: 'Краткий опросник шизотипии',
  description: 'Скрининговый инструмент для выявления шизотипических черт личности.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Люди иногда считают меня странным или эксцентричным.', type: 'single', options: yesNoOptions },
    { id: 2, text: 'Иногда я чувствую, что должен быть начеку даже с друзьями.', type: 'single', options: yesNoOptions },
    { id: 3, text: 'У меня мало друзей и знакомых.', type: 'single', options: yesNoOptions },
    { id: 4, text: 'Люди иногда говорят, что мои разговоры странные или что я говорю о странных вещах.', type: 'single', options: yesNoOptions },
    { id: 5, text: 'Мне трудно выражать свои чувства.', type: 'single', options: yesNoOptions },
    { id: 6, text: 'Я часто чувствую себя неловко в социальных ситуациях.', type: 'single', options: yesNoOptions },
    { id: 7, text: 'Я иногда думаю, что другие люди могут читать мои мысли.', type: 'single', options: yesNoOptions },
    { id: 8, text: 'Я часто чувствую, что меня обсуждают или наблюдают за мной.', type: 'single', options: yesNoOptions },
    { id: 9, text: 'Мне трудно доверять людям.', type: 'single', options: yesNoOptions },
    { id: 10, text: 'У меня бывают необычные восприятия или переживания.', type: 'single', options: yesNoOptions },
    { id: 11, text: 'Я верю в телепатию или «шестое чувство».', type: 'single', options: yesNoOptions },
    { id: 12, text: 'Люди говорят, что у меня странный внешний вид или манера одеваться.', type: 'single', options: yesNoOptions },
    { id: 13, text: 'Я чувствую себя отстранённым от других людей.', type: 'single', options: yesNoOptions },
    { id: 14, text: 'Иногда я вижу особый смысл в обычных вещах или событиях.', type: 'single', options: yesNoOptions },
    { id: 15, text: 'Мне трудно начать разговор с незнакомыми людьми.', type: 'single', options: yesNoOptions },
    { id: 16, text: 'Я предпочитаю быть один.', type: 'single', options: yesNoOptions },
    { id: 17, text: 'У меня бывают странные мысли или убеждения, которые другие считают необычными.', type: 'single', options: yesNoOptions },
    { id: 18, text: 'Мне трудно быть эмоционально близким с другими людьми.', type: 'single', options: yesNoOptions },
    { id: 19, text: 'Иногда у меня бывают переживания, которые трудно объяснить.', type: 'single', options: yesNoOptions },
    { id: 20, text: 'Я часто чувствую тревогу в присутствии незнакомых людей.', type: 'single', options: yesNoOptions },
    { id: 21, text: 'Другие люди считают меня холодным или отстранённым.', type: 'single', options: yesNoOptions },
    { id: 22, text: 'Мне кажется, что события имеют скрытый смысл, относящийся лично ко мне.', type: 'single', options: yesNoOptions }
  ],
  interpretations: [
    { min: 0, max: 5, label: 'Норма', severity: 'low', description: 'Шизотипические черты не выражены или минимальны.' },
    { min: 6, max: 11, label: 'Лёгкая выраженность', severity: 'moderate', description: 'Присутствуют некоторые шизотипические черты. Рекомендуется самонаблюдение.' },
    { min: 12, max: 16, label: 'Умеренная выраженность', severity: 'high', description: 'Умеренно выраженные шизотипические черты. Рекомендуется консультация специалиста.' },
    { min: 17, max: 22, label: 'Выраженные черты', severity: 'critical', description: 'Значительно выраженные шизотипические черты. Рекомендуется обследование у психиатра.' }
  ],
  source: {
    name: 'Schizotypal Personality Questionnaire Brief (SPQ-B)',
    url: 'https://psytests.org/diag/spq.html'
  }
};

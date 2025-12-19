import { TestConfig } from './types';

export const spqTest: TestConfig = {
  id: 'schizotypy',
  name: 'SPQ-74',
  title: 'Опросник шизотипических черт личности',
  description: 'Инструмент для диагностики признаков шизотипического расстройства.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Бывает ли, что вы чувствуете, будто люди следят за вами или говорят о вас?', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] }
  ],
  interpretations: [
    { min: 0, max: 20, label: 'Норма', severity: 'low', description: 'Шизотипические черты не выражены.' },
    { min: 21, max: 40, label: 'Средний уровень', severity: 'moderate', description: 'У вас наблюдаются умеренно выраженные шизотипические черты.' },
    { min: 41, max: 74, label: 'Высокий уровень', severity: 'high', description: 'Высокая выраженность шизотипических черт. Рекомендуется консультация психиатра.' }
  ],
  source: {
    name: 'Schizotypal Personality Questionnaire (SPQ)',
    url: 'https://psytests.org/diag/spq.html'
  }
};


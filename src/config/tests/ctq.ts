import { TestConfig } from './types';

export const ctqTest: TestConfig = {
  id: 'childhood_trauma',
  name: 'CTQ-SF',
  title: 'Опросник детских травм',
  description: 'Краткая форма опросника для выявления неблагоприятного опыта в детстве.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Когда я был маленьким, в моей семье мне не хватало еды или чистой одежды.', type: 'single', options: [{ value: 1, label: 'Никогда' }, { value: 2, label: 'Редко' }, { value: 3, label: 'Иногда' }, { value: 4, label: 'Часто' }, { value: 5, label: 'Очень часто' }] }
  ],
  interpretations: [
    { min: 5, max: 10, label: 'Низкий уровень травматизации', severity: 'low', description: 'Значимого травматического опыта не выявлено.' },
    { min: 11, max: 25, label: 'Высокий уровень травматизации', severity: 'high', description: 'Ваши ответы указывают на наличие травматического опыта в детстве. Рекомендуется проработка с психологом.' }
  ],
  source: {
    name: 'Childhood Trauma Questionnaire (CTQ)',
    url: 'https://psytests.org/trauma/ctq.html'
  }
};


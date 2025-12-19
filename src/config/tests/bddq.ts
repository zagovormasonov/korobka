import { TestConfig } from './types';

export const bddqTest: TestConfig = {
  id: 'body_dysmorphia',
  name: 'BDDQ',
  title: 'Опросник дисморфофобии',
  description: 'Скрининг чрезмерной озабоченности своей внешностью (телесное дисморфическое расстройство).',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Беспокоит ли Вас внешний вид какой-либо части Вашего тела?', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 2, text: 'Считаете ли Вы этот дефект крайне уродливым?', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] }
  ],
  interpretations: [
    { min: 0, max: 0, label: 'Риск дисморфофобии низкий', severity: 'low', description: 'Ваше отношение к внешности в пределах нормы.' },
    { min: 1, max: 2, label: 'Есть риск ТДР', severity: 'high', description: 'Ваши ответы указывают на наличие признаков телесного дисморфического расстройства. Рекомендуется консультация специалиста.' }
  ],
  source: {
    name: 'Body Dysmorphic Disorder Questionnaire (BDDQ)',
    url: 'https://psytests.org/beauty/bddq.html'
  }
};


import { TestConfig } from './types';

export const aqTest: TestConfig = {
  id: 'autism',
  name: 'AQ',
  title: 'Тест на расстройство аутистического спектра',
  description: 'Опросник для выявления аутичных черт у взрослых с нормальным интеллектом.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Я предпочитаю делать вещи вместе с другими людьми, а не в одиночку.', type: 'single', options: [{ value: 0, label: 'Полностью согласен' }, { value: 0, label: 'Скорее согласен' }, { value: 1, label: 'Скорее не согласен' }, { value: 1, label: 'Полностью не согласен' }] },
    { id: 2, text: 'Я предпочитаю делать вещи одним и тем же способом снова и снова.', type: 'single', options: [{ value: 1, label: 'Полностью согласен' }, { value: 1, label: 'Скорее согласен' }, { value: 0, label: 'Скорее не согласен' }, { value: 0, label: 'Полностью не согласен' }] }
  ],
  interpretations: [
    { min: 0, max: 25, label: 'Низкая вероятность РАС', severity: 'low', description: 'Количество аутичных черт в пределах нормы.' },
    { min: 26, max: 50, label: 'Высокая вероятность РАС', severity: 'high', description: 'Ваши ответы указывают на наличие значимого количества аутичных черт. Рекомендуется консультация специалиста.' }
  ],
  source: {
    name: 'Autism-Spectrum Quotient (AQ)',
    url: 'https://psytests.org/arc/aq.html'
  }
};


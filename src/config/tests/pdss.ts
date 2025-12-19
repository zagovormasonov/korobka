import { TestConfig } from './types';

export const pdssTest: TestConfig = {
  id: 'panic_disorder',
  name: 'PDSS',
  title: 'Шкала тяжести панического расстройства',
  description: 'Инструмент для измерения выраженности панических атак и связанной с ними тревоги.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Как часто у вас были панические атаки за последнюю неделю?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: '1-2 раза' }, { value: 2, label: '3-4 раза' }, { value: 3, label: 'Более 4 раз' }, { value: 4, label: 'Постоянно' }] }
  ],
  interpretations: [
    { min: 0, max: 3, label: 'Норма', severity: 'low', description: 'Признаки панического расстройства не выражены.' },
    { min: 4, max: 10, label: 'Легкое расстройство', severity: 'moderate', description: 'У вас наблюдаются признаки панического расстройства.' },
    { min: 11, max: 28, label: 'Выраженное расстройство', severity: 'high', description: 'Рекомендуется медицинская помощь.' }
  ],
  source: {
    name: 'Panic Disorder Severity Scale (PDSS)',
    url: 'https://psytests.org/psyclinical/pdss.html'
  }
};


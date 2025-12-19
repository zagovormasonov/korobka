import { TestConfig } from './types';

export const osrTest: TestConfig = {
  id: 'suicidal_risk',
  name: 'ОСР',
  title: 'Опросник суицидального риска',
  description: 'Методика для выявления уровня суицидальных намерений и мыслей.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'В последнее время я часто думаю о том, что жизнь не имеет смысла.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] }
  ],
  interpretations: [
    { min: 0, max: 0, label: 'Риск низкий', severity: 'low', description: 'Суицидальный риск не выявлен.' },
    { min: 1, max: 1, label: 'Риск повышенный', severity: 'critical', description: 'ВНИМАНИЕ: Выявлены суицидальные тенденции. Пожалуйста, обратитесь за экстренной психологической помощью или позвоните на горячую линию.' }
  ],
  source: {
    name: 'Опросник суицидального риска (ОСР)',
    url: 'https://psytests.org/psyclinical/osr.html'
  }
};


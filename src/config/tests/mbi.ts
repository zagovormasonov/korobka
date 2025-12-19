import { TestConfig } from './types';

export const mbiTest: TestConfig = {
  id: 'burnout',
  name: 'MBI',
  title: 'Опросник выгорания Маслач',
  description: 'Инструмент для оценки уровня профессионального выгорания по трем шкалам.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Я чувствую себя эмоционально опустошенным своей работой.', type: 'single', options: [{ value: 0, label: 'Никогда' }, { value: 1, label: 'Очень редко' }, { value: 2, label: 'Редко' }, { value: 3, label: 'Иногда' }, { value: 4, label: 'Часто' }, { value: 5, label: 'Очень часто' }, { value: 6, label: 'Ежедневно' }] }
  ],
  interpretations: [
    { min: 0, max: 15, label: 'Низкий уровень выгорания', severity: 'low', description: 'Ваше состояние стабильно.' },
    { min: 16, max: 30, label: 'Средний уровень выгорания', severity: 'moderate', description: 'У вас наблюдаются признаки выгорания. Рекомендуется отдых.' },
    { min: 31, max: 54, label: 'Высокий уровень выгорания', severity: 'high', description: 'Критический уровень выгорания. Рекомендуется смена обстановки или помощь специалиста.' }
  ],
  source: {
    name: 'Maslach Burnout Inventory (MBI)',
    url: 'https://psytests.org/stress/maslach.html'
  }
};


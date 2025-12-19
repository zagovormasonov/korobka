import { TestConfig } from './types';

export const ybocsTest: TestConfig = {
  id: 'ocd',
  name: 'Y-BOCS',
  title: 'Шкала Йеля-Брауна (ОКР)',
  description: 'Шкала для оценки выраженности обсессивно-компульсивного расстройства.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Сколько времени у вас занимают навязчивые мысли (обсессии)?', type: 'single', options: [{ value: 0, label: 'Нет' }, { value: 1, label: 'Менее 1 часа в день' }, { value: 2, label: '1-3 часа в день' }, { value: 3, label: '3-8 часов в день' }, { value: 4, label: 'Более 8 часов в день' }] },
    { id: 2, text: 'Насколько навязчивые мысли мешают вашей социальной жизни или работе?', type: 'single', options: [{ value: 0, label: 'Не мешают' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Крайне сильно' }] },
    { id: 3, text: 'Сколько времени вы тратите на выполнение навязчивых действий (компульсий)?', type: 'single', options: [{ value: 0, label: 'Нет' }, { value: 1, label: 'Менее 1 часа в день' }, { value: 2, label: '1-3 часа в день' }, { value: 3, label: '3-8 часов в день' }, { value: 4, label: 'Более 8 часов в день' }] },
    { id: 4, text: 'Насколько компульсии мешают вашей жизни?', type: 'single', options: [{ value: 0, label: 'Не мешают' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Крайне сильно' }] },
    { id: 5, text: 'Насколько трудно вам сопротивляться компульсиям?', type: 'single', options: [{ value: 0, label: 'Всегда удается' }, { value: 1, label: 'Обычно удается' }, { value: 2, label: 'Иногда удается' }, { value: 3, label: 'Редко удается' }, { value: 4, label: 'Никогда не удается' }] }
  ],
  interpretations: [
    { min: 0, max: 7, label: 'Субклиническое состояние', severity: 'low', description: 'Симптомы ОКР не выражены.' },
    { min: 8, max: 15, label: 'Легкая степень ОКР', severity: 'moderate', description: 'У вас наблюдаются легкие признаки ОКР.' },
    { min: 16, max: 23, label: 'Средняя степень ОКР', severity: 'high', description: 'Умеренно выраженное ОКР. Рекомендуется консультация психолога.' },
    { min: 24, max: 40, label: 'Тяжелая степень ОКР', severity: 'critical', description: 'Тяжело выраженное ОКР. Рекомендуется медицинская помощь.' }
  ],
  source: {
    name: 'Yale-Brown Obsessive Compulsive Scale (Y-BOCS)',
    url: 'https://psytests.org/psyclinical/ybocs.html'
  }
};


import { TestConfig } from './types';

const likertOptions = [
  { value: 0, label: 'Совсем нет' },
  { value: 1, label: 'Несколько дней' },
  { value: 2, label: 'Более половины дней' },
  { value: 3, label: 'Почти каждый день' }
];

export const gad7Test: TestConfig = {
  id: 'anxiety',
  name: 'GAD-7',
  title: 'Шкала генерализованного тревожного расстройства',
  description: 'Валидированный скрининговый инструмент для оценки выраженности симптомов тревоги за последние 2 недели.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Нервозность, тревога или ощущение взвинченности', type: 'single', options: likertOptions },
    { id: 2, text: 'Неспособность прекратить беспокоиться или контролировать беспокойство', type: 'single', options: likertOptions },
    { id: 3, text: 'Чрезмерное беспокойство по разным поводам', type: 'single', options: likertOptions },
    { id: 4, text: 'Трудности с расслаблением', type: 'single', options: likertOptions },
    { id: 5, text: 'Беспокойство настолько сильное, что трудно усидеть на месте', type: 'single', options: likertOptions },
    { id: 6, text: 'Легко возникающая раздражительность или досада', type: 'single', options: likertOptions },
    { id: 7, text: 'Ощущение, что может случиться что-то ужасное', type: 'single', options: likertOptions }
  ],
  interpretations: [
    { min: 0, max: 4, label: 'Минимальная тревога', severity: 'low', description: 'Уровень тревоги в пределах нормы. Симптомы не требуют специального лечения.' },
    { min: 5, max: 9, label: 'Лёгкая тревога', severity: 'moderate', description: 'Присутствуют лёгкие симптомы тревоги. Рекомендуется мониторинг состояния и техники релаксации.' },
    { min: 10, max: 14, label: 'Умеренная тревога', severity: 'high', description: 'Умеренно выраженные симптомы тревоги. Рекомендуется консультация специалиста.' },
    { min: 15, max: 21, label: 'Выраженная тревога', severity: 'critical', description: 'Значительно выраженные симптомы тревоги. Настоятельно рекомендуется обращение к психотерапевту или психиатру.' }
  ],
  source: {
    name: 'GAD-7 (Spitzer et al., 2006)',
    url: 'https://psytests.org/anxiety/gad7.html'
  }
};

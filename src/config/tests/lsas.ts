import { TestConfig } from './types';

export const lsasTest: TestConfig = {
  id: 'social_anxiety',
  name: 'LSAS',
  title: 'Шкала социальной тревожности Либовича',
  description: 'Инструмент для оценки страха и избегания в различных социальных ситуациях.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Разговор по телефону в общественном месте.', type: 'single', options: [{ value: 0, label: 'Нет страха' }, { value: 1, label: 'Слабый' }, { value: 2, label: 'Умеренный' }, { value: 3, label: 'Сильный' }] },
    { id: 2, text: 'Участие в небольшой группе.', type: 'single', options: [{ value: 0, label: 'Нет страха' }, { value: 1, label: 'Слабый' }, { value: 2, label: 'Умеренный' }, { value: 3, label: 'Сильный' }] }
  ],
  interpretations: [
    { min: 0, max: 29, label: 'Нет социальной тревожности', severity: 'low', description: 'Уровень социальной тревожности в пределах нормы.' },
    { min: 30, max: 59, label: 'Легкая социальная тревожность', severity: 'moderate', description: 'У вас наблюдаются признаки социальной тревожности.' },
    { min: 60, max: 90, label: 'Выраженная социальная тревожность', severity: 'high', description: 'Рекомендуется консультация психолога.' }
  ],
  source: {
    name: 'Liebowitz Social Anxiety Scale (LSAS)',
    url: 'https://psytests.org/anxiety/lsas.html'
  }
};


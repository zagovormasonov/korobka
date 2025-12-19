import { TestConfig } from './types';

// LSAS практически не имеет гендерно-специфичных текстов
const fearOptions = [
  { value: 0, label: 'Нет страха' },
  { value: 1, label: 'Слабый страх' },
  { value: 2, label: 'Умеренный страх' },
  { value: 3, label: 'Сильный страх' }
];

export const lsasTest: TestConfig = {
  id: 'social_anxiety',
  name: 'LSAS',
  title: 'Шкала социальной тревожности Либовица',
  description: 'Инструмент для оценки страха и избегания в различных социальных ситуациях.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Разговор по телефону в общественном месте.', type: 'single', options: fearOptions },
    { id: 2, text: 'Участие в небольшой группе людей.', type: 'single', options: fearOptions },
    { id: 3, text: 'Приём пищи в общественном месте.', type: 'single', options: fearOptions },
    { id: 4, text: 'Выпить напиток вместе с другими людьми.', type: 'single', options: fearOptions },
    { id: 5, text: 'Разговор с человеком, обладающим властью.', type: 'single', options: fearOptions },
    { id: 6, text: 'Выступление перед аудиторией.', type: 'single', options: fearOptions },
    { id: 7, text: 'Поход на вечеринку.', type: 'single', options: fearOptions },
    { id: 8, text: 'Работа под наблюдением.', type: 'single', options: fearOptions },
    { id: 9, text: 'Письмо под наблюдением.', type: 'single', options: fearOptions },
    { id: 10, text: 'Звонок незнакомому человеку.', type: 'single', options: fearOptions },
    { id: 11, text: 'Разговор с незнакомыми людьми.', type: 'single', options: fearOptions },
    { id: 12, text: 'Встреча с незнакомцами.', type: 'single', options: fearOptions },
    { id: 13, text: 'Пользование общественным туалетом.', type: 'single', options: fearOptions },
    { id: 14, text: 'Вход в помещение, когда другие уже сидят.', type: 'single', options: fearOptions },
    { id: 15, text: 'Быть в центре внимания.', type: 'single', options: fearOptions },
    { id: 16, text: 'Выступление на собрании.', type: 'single', options: fearOptions },
    { id: 17, text: 'Сдача экзамена.', type: 'single', options: fearOptions },
    { id: 18, text: 'Выражение несогласия или неодобрения знакомому человеку.', type: 'single', options: fearOptions },
    { id: 19, text: 'Взгляд в глаза незнакомому человеку.', type: 'single', options: fearOptions },
    { id: 20, text: 'Доклад перед группой.', type: 'single', options: fearOptions },
    { id: 21, text: 'Попытка познакомиться с кем-то для романтических отношений.', type: 'single', options: fearOptions },
    { id: 22, text: 'Возврат товара в магазин для получения возмещения.', type: 'single', options: fearOptions },
    { id: 23, text: 'Организация вечеринки.', type: 'single', options: fearOptions },
    { id: 24, text: 'Сопротивление настойчивому продавцу.', type: 'single', options: fearOptions }
  ],
  interpretations: [
    { min: 0, max: 29, label: 'Нет социальной тревожности', severity: 'low', description: 'Уровень социальной тревожности в пределах нормы.' },
    { min: 30, max: 49, label: 'Лёгкая социальная тревожность', severity: 'moderate', description: 'Присутствуют лёгкие признаки социальной тревожности. Рекомендуется мониторинг состояния.' },
    { min: 50, max: 64, label: 'Умеренная социальная тревожность', severity: 'high', description: 'Умеренно выраженная социальная тревожность. Рекомендуется консультация психолога.' },
    { min: 65, max: 72, label: 'Выраженная социальная тревожность', severity: 'critical', description: 'Значительно выраженная социальная тревожность. Рекомендуется обращение к специалисту.' }
  ],
  source: {
    name: 'Liebowitz Social Anxiety Scale (LSAS)',
    url: 'https://psytests.org/anxiety/lsas.html'
  }
};

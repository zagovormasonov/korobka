import { TestConfig, GenderedText } from './types';

// Хелпер для создания гендерных текстов
const g = (male: string, female: string): GenderedText => ({ male, female });

const frequencyOptions = [
  { value: 0, label: 'Никогда' },
  { value: 1, label: 'Очень редко' },
  { value: 2, label: 'Редко' },
  { value: 3, label: 'Иногда' },
  { value: 4, label: 'Часто' },
  { value: 5, label: 'Очень часто' },
  { value: 6, label: 'Ежедневно' }
];

export const mbiTest: TestConfig = {
  id: 'burnout',
  name: 'MBI',
  title: 'Опросник выгорания Маслач',
  description: 'Инструмент для оценки уровня профессионального выгорания по трём шкалам: эмоциональное истощение, деперсонализация и редукция профессиональных достижений. Отвечайте, основываясь на вашем опыте работы за последние несколько месяцев.',
  scoringStrategy: 'sum',
  questions: [
    // Эмоциональное истощение (1-9)
    { id: 1, text: g('Я чувствую себя эмоционально опустошённым своей работой.', 'Я чувствую себя эмоционально опустошённой своей работой.'), type: 'single', options: frequencyOptions },
    { id: 2, text: 'В конце рабочего дня я чувствую себя как выжатый лимон.', type: 'single', options: frequencyOptions },
    { id: 3, text: 'Я чувствую усталость, когда встаю утром и должен идти на работу.', type: 'single', options: frequencyOptions },
    { id: 4, text: 'Я легко могу понять, что чувствуют мои клиенты/коллеги.', type: 'single', options: frequencyOptions },
    { id: 5, text: 'Я чувствую, что обращаюсь с некоторыми клиентами/коллегами как с безличными объектами.', type: 'single', options: frequencyOptions },
    { id: 6, text: 'Работа с людьми целый день — это для меня большое напряжение.', type: 'single', options: frequencyOptions },
    { id: 7, text: 'Я успешно справляюсь с проблемами моих клиентов/коллег.', type: 'single', options: frequencyOptions },
    { id: 8, text: g('Я чувствую себя выгоревшим из-за работы.', 'Я чувствую себя выгоревшей из-за работы.'), type: 'single', options: frequencyOptions },
    { id: 9, text: 'Я положительно влияю на жизнь других людей благодаря своей работе.', type: 'single', options: frequencyOptions },
    // Деперсонализация и редукция (10-22)
    { id: 10, text: g('Я стал более бессердечным к людям с тех пор, как устроился на эту работу.', 'Я стала более бессердечной к людям с тех пор, как устроилась на эту работу.'), type: 'single', options: frequencyOptions },
    { id: 11, text: g('Я беспокоюсь, что эта работа делает меня эмоционально чёрствым.', 'Я беспокоюсь, что эта работа делает меня эмоционально чёрствой.'), type: 'single', options: frequencyOptions },
    { id: 12, text: g('Я чувствую себя очень энергичным.', 'Я чувствую себя очень энергичной.'), type: 'single', options: frequencyOptions },
    { id: 13, text: 'Я чувствую разочарование из-за своей работы.', type: 'single', options: frequencyOptions },
    { id: 14, text: 'Я чувствую, что работаю слишком много.', type: 'single', options: frequencyOptions },
    { id: 15, text: 'Меня не очень интересует, что происходит с некоторыми клиентами/коллегами.', type: 'single', options: frequencyOptions },
    { id: 16, text: 'Работа с людьми напрямую вызывает у меня сильный стресс.', type: 'single', options: frequencyOptions },
    { id: 17, text: 'Я легко могу создать расслабленную атмосферу с моими клиентами/коллегами.', type: 'single', options: frequencyOptions },
    { id: 18, text: 'Я чувствую воодушевление после работы с клиентами/коллегами.', type: 'single', options: frequencyOptions },
    { id: 19, text: g('Я достиг многого ценного в этой работе.', 'Я достигла многого ценного в этой работе.'), type: 'single', options: frequencyOptions },
    { id: 20, text: 'Я чувствую, что нахожусь на пределе своих возможностей.', type: 'single', options: frequencyOptions },
    { id: 21, text: 'На работе я спокойно справляюсь с эмоциональными проблемами.', type: 'single', options: frequencyOptions },
    { id: 22, text: 'Я чувствую, что клиенты/коллеги винят меня в своих проблемах.', type: 'single', options: frequencyOptions }
  ],
  interpretations: [
    { min: 0, max: 36, label: 'Низкий уровень выгорания', severity: 'low', description: 'Ваше состояние стабильно. Признаки профессионального выгорания минимальны.' },
    { min: 37, max: 72, label: 'Средний уровень выгорания', severity: 'moderate', description: 'У вас наблюдаются признаки выгорания. Рекомендуется отдых, смена деятельности и профилактика стресса.' },
    { min: 73, max: 108, label: 'Высокий уровень выгорания', severity: 'high', description: 'Выраженное профессиональное выгорание. Рекомендуется обратиться к психологу и пересмотреть рабочую нагрузку.' },
    { min: 109, max: 132, label: 'Критический уровень выгорания', severity: 'critical', description: 'Критическое профессиональное выгорание. Необходима помощь специалиста и, возможно, длительный отдых.' }
  ],
  source: {
    name: 'Maslach Burnout Inventory (MBI)',
    url: 'https://psytests.org/stress/maslach.html'
  }
};

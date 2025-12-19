import { TestConfig } from './types';

export const gad7Test: TestConfig = {
  id: 'anxiety',
  name: 'GAD-7',
  title: 'Тест на генерализованную тревогу',
  description: 'Шкала для оценки уровня тревожности и беспокойства.',
  scoringStrategy: 'sum',
  questions: [
    {
      id: 1,
      text: 'Чувство нервозности, беспокойства или нахождения «на грани»',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 2,
      text: 'Неспособность прекратить беспокоиться или контролировать беспокойство',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 3,
      text: 'Чрезмерное беспокойство по разным поводам',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 4,
      text: 'Трудности с расслаблением',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 5,
      text: 'Такая сильная неусидчивость, что трудно усидеть на месте',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 6,
      text: 'Легко возникающая раздражительность или вспыльчивость',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    },
    {
      id: 7,
      text: 'Чувство страха, как будто может случиться что-то ужасное',
      type: 'single',
      options: [
        { value: 0, label: 'Совсем нет' },
        { value: 1, label: 'Несколько дней' },
        { value: 2, label: 'Больше половины дней' },
        { value: 3, label: 'Почти каждый день' }
      ]
    }
  ],
  interpretations: [
    { min: 0, max: 4, label: 'Минимальная тревога', severity: 'low', description: 'Уровень тревоги в пределах нормы.' },
    { min: 5, max: 9, label: 'Легкая тревога', severity: 'moderate', description: 'У вас наблюдается легкий уровень тревоги. Попробуйте техники релаксации.' },
    { min: 10, max: 14, label: 'Умеренная тревога', severity: 'high', description: 'Уровень тревоги повышен. Рекомендуется обратить внимание на источники стресса и рассмотреть консультацию психолога.' },
    { min: 15, max: 21, label: 'Выраженная тревога', severity: 'critical', description: 'Высокий уровень тревожности. Рекомендуется обратиться к специалисту (психотерапевту или психиатру).' }
  ],
  source: {
    name: 'GAD-7',
    url: 'https://psytests.org/anxiety/gad7.html'
  }
};


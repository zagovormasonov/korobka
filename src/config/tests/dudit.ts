import { TestConfig } from './types';

// DUDIT практически не имеет гендерно-специфичных текстов
export const duditTest: TestConfig = {
  id: 'substance_use',
  name: 'DUDIT',
  title: 'Тест на употребление наркотиков',
  description: 'Скрининговый инструмент для выявления проблемного употребления психоактивных веществ.',
  scoringStrategy: 'sum',
  questions: [
    {
      id: 1,
      text: 'Как часто вы употребляете наркотики (кроме алкоголя)?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Раз в месяц или реже' },
        { value: 2, label: '2-4 раза в месяц' },
        { value: 3, label: '2-3 раза в неделю' },
        { value: 4, label: '4 раза в неделю или чаще' }
      ]
    },
    {
      id: 2,
      text: 'Употребляете ли вы более одного вида наркотиков одновременно?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Раз в месяц или реже' },
        { value: 2, label: '2-4 раза в месяц' },
        { value: 3, label: '2-3 раза в неделю' },
        { value: 4, label: '4 раза в неделю или чаще' }
      ]
    },
    {
      id: 3,
      text: 'Сколько раз вы употребляете наркотики за типичный день, когда употребляете?',
      type: 'single',
      options: [
        { value: 0, label: '0' },
        { value: 1, label: '1-2' },
        { value: 2, label: '3-4' },
        { value: 3, label: '5-6' },
        { value: 4, label: '7 или более' }
      ]
    },
    {
      id: 4,
      text: 'Как часто вы находитесь под сильным влиянием наркотиков?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 5,
      text: 'За последний год как часто вы чувствовали сильное желание употребить наркотики?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 6,
      text: 'За последний год как часто вы не могли остановиться, начав употреблять?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 7,
      text: 'За последний год как часто вы пренебрегали делами из-за наркотиков?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 8,
      text: 'За последний год как часто вам нужно было употребить с утра, чтобы прийти в себя?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 9,
      text: 'За последний год как часто вы испытывали чувство вины после употребления?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Реже, чем раз в месяц' },
        { value: 2, label: 'Каждый месяц' },
        { value: 3, label: 'Каждую неделю' },
        { value: 4, label: 'Ежедневно или почти ежедневно' }
      ]
    },
    {
      id: 10,
      text: 'Получали ли вы или кто-то другой травмы из-за вашего употребления наркотиков?',
      type: 'single',
      options: [
        { value: 0, label: 'Нет' },
        { value: 2, label: 'Да, но не в последний год' },
        { value: 4, label: 'Да, в течение последнего года' }
      ]
    },
    {
      id: 11,
      text: 'Выражал ли кто-либо (родственник, друг, врач) обеспокоенность вашим употреблением или советовал прекратить?',
      type: 'single',
      options: [
        { value: 0, label: 'Нет' },
        { value: 2, label: 'Да, но не в последний год' },
        { value: 4, label: 'Да, в течение последнего года' }
      ]
    }
  ],
  interpretations: [
    { min: 0, max: 5, label: 'Низкий риск', severity: 'low', description: 'Проблемное употребление маловероятно.' },
    { min: 6, max: 24, label: 'Умеренный риск', severity: 'high', description: 'Возможно проблемное употребление. Рекомендуется консультация специалиста.' },
    { min: 25, max: 44, label: 'Высокий риск зависимости', severity: 'critical', description: 'Вероятна зависимость от психоактивных веществ. Необходима помощь нарколога.' }
  ],
  source: {
    name: 'Drug Use Disorders Identification Test (DUDIT)',
    url: 'https://www.samopomo.ch/proversja/test-po-vyjavleniju-rasstroistv-svjazannykh-s-upotrebleniem-narkotikov-dudit'
  }
};

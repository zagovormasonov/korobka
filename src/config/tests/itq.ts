import { TestConfig } from './types';

export const itqTest: TestConfig = {
  id: 'cptsd',
  name: 'ITQ',
  title: 'Тест на комплексное ПТСР',
  description: 'Международный опросник травмы для оценки симптомов ПТСР и нарушений самоорганизации (DSO).',
  scoringStrategy: 'sum',
  questions: [
    // ПТСР симптомы
    { id: 1, text: 'Повторяющиеся навязчивые воспоминания о травматическом событии?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 2, text: 'Ночные кошмары, связанные с травмой?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 3, text: 'Избегание мыслей или чувств, связанных с событием?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 4, text: 'Избегание мест или людей, напоминающих о событии?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 5, text: 'Повышенная бдительность или настороженность?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 6, text: 'Преувеличенная реакция на испуг?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    // DSO симптомы (нарушение самоорганизации)
    { id: 7, text: 'Трудности с управлением своими эмоциями?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 8, text: 'Чувство вины или стыда за то, что произошло?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] },
    { id: 9, text: 'Трудности в поддержании близких отношений?', type: 'single', options: [{ value: 0, label: 'Совсем нет' }, { value: 1, label: 'Немного' }, { value: 2, label: 'Умеренно' }, { value: 3, label: 'Сильно' }, { value: 4, label: 'Очень сильно' }] }
  ],
  interpretations: [
    { min: 0, max: 12, label: 'Низкая вероятность кПТСР', severity: 'low', description: 'Симптомы выражены слабо.' },
    { min: 13, max: 36, label: 'Высокая вероятность кПТСР', severity: 'high', description: 'Ваши ответы указывают на наличие симптомов комплексного ПТСР. Рекомендуется консультация специалиста по травме.' }
  ],
  source: {
    name: 'International Trauma Questionnaire (ITQ)',
    url: 'https://psytests.org/trauma/itq.html'
  }
};


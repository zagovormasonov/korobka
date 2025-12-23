import { TestConfig, GenderedText } from './types';

// Хелпер для создания гендерных текстов
const g = (male: string, female: string): GenderedText => ({ male, female });

export const pdq4Test: TestConfig = {
  id: 'bpd',
  name: 'PDQ-4',
  title: 'Тест на пограничное расстройство личности (ПРЛ)',
  description: 'Опросник для скрининга симптомов ПРЛ по критериям DSM-IV. Отвечайте, основываясь на вашем опыте за последние несколько лет.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'За последние несколько лет я часто предпринимал(а) отчаянные попытки избежать реального или воображаемого одиночества.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 2, text: 'У меня есть склонность к нестабильным и напряженным отношениям с людьми.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 3, text: 'В отношениях я часто перехожу от идеализации человека к его полному обесцениванию.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 4, text: 'За последние несколько лет у меня часто менялось представление о себе, своих целях или ценностях.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 5, text: 'Я часто совершаю импульсивные поступки, которые могут быть опасны (трата денег, секс, ПАВ, вождение, еда).', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 6, text: 'У меня бывали случаи самоповреждения или суицидальные мысли/угрозы.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 7, text: 'Мое настроение крайне нестабильно (сильная грусть, раздражительность или тревога, длящиеся несколько часов).', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 8, text: 'Я часто чувствую внутреннюю пустоту.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 9, text: 'Я часто испытываю неадекватный сильный гнев или мне трудно его контролировать.', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] }
  ],
  interpretations: [
    { min: 0, max: 4, label: 'Низкая вероятность ПРЛ', severity: 'low', description: 'Количество совпадений недостаточно для подозрения на ПРЛ.' },
    { min: 5, max: 9, label: 'Высокая вероятность ПРЛ', severity: 'high', description: 'У вас наблюдается 5 и более критериев ПРЛ. Рекомендуется обратиться к психотерапевту для диагностики.' }
  ],
  source: {
    name: 'PDQ-4 (DSM-IV)',
    url: 'https://testometrika.com/diagnosis-of-abnormalities/do-you-have-a-border-disorder-of-personality/'
  }
};

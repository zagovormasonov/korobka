import { TestConfig, GenderedText } from './types';

// Хелпер для создания гендерных текстов
const g = (male: string, female: string): GenderedText => ({ male, female });

// Для AQ: "Полностью согласен" и "Скорее согласен" = 1 балл для прямых вопросов
// "Полностью не согласен" и "Скорее не согласен" = 1 балл для обратных вопросов
const agreeOptions = [
  { value: 1, label: g('Полностью согласен', 'Полностью согласна') },
  { value: 1, label: g('Скорее согласен', 'Скорее согласна') },
  { value: 0, label: g('Скорее не согласен', 'Скорее не согласна') },
  { value: 0, label: g('Полностью не согласен', 'Полностью не согласна') }
];

const disagreeOptions = [
  { value: 0, label: g('Полностью согласен', 'Полностью согласна') },
  { value: 0, label: g('Скорее согласен', 'Скорее согласна') },
  { value: 1, label: g('Скорее не согласен', 'Скорее не согласна') },
  { value: 1, label: g('Полностью не согласен', 'Полностью не согласна') }
];

export const aqTest: TestConfig = {
  id: 'autism',
  name: 'AQ-10',
  title: 'Краткий тест на расстройство аутистического спектра',
  description: 'Скрининговый опросник для выявления аутичных черт у взрослых с нормальным интеллектом.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Мне часто трудно понять, что другие думают или чувствуют, глядя им в лицо.', type: 'single', options: agreeOptions },
    { id: 2, text: 'Мне трудно понять намёки в разговоре.', type: 'single', options: agreeOptions },
    { id: 3, text: 'Мне сложно делать несколько дел одновременно.', type: 'single', options: agreeOptions },
    { id: 4, text: 'Если меня прерывают во время какого-то занятия, мне легко вернуться к нему.', type: 'single', options: disagreeOptions },
    { id: 5, text: 'Мне нравится делать вещи спонтанно.', type: 'single', options: disagreeOptions },
    { id: 6, text: 'Мне легко понять, когда кто-то хочет сменить тему разговора.', type: 'single', options: disagreeOptions },
    { id: 7, text: 'В социальных ситуациях мне легко понять, что говорить или делать.', type: 'single', options: disagreeOptions },
    { id: 8, text: 'Я быстро замечаю изменения в чьём-то настроении.', type: 'single', options: disagreeOptions },
    { id: 9, text: 'Мне трудно представить, каково это — быть другим человеком.', type: 'single', options: agreeOptions },
    { id: 10, text: 'Я предпочитаю делать вещи одним и тем же способом снова и снова.', type: 'single', options: agreeOptions },
    { id: 11, text: 'Мне легко даётся светская беседа.', type: 'single', options: disagreeOptions },
    { id: 12, text: 'В группе людей я легко отслеживаю несколько разговоров одновременно.', type: 'single', options: disagreeOptions },
    { id: 13, text: 'Я предпочитаю иметь чёткий распорядок дня.', type: 'single', options: agreeOptions },
    { id: 14, text: 'Мне легко понять, когда человек скучает или теряет интерес к разговору.', type: 'single', options: disagreeOptions },
    { id: 15, text: 'Я замечаю маленькие детали, которые другие не замечают.', type: 'single', options: agreeOptions },
    { id: 16, text: 'Меня привлекают числа, даты и закономерности.', type: 'single', options: agreeOptions },
    { id: 17, text: 'Мне трудно понять намерения персонажей в фильмах или книгах.', type: 'single', options: agreeOptions },
    { id: 18, text: 'Я легко завожу новых друзей.', type: 'single', options: disagreeOptions },
    { id: 19, text: 'Мне нравится собирать информацию о категориях вещей.', type: 'single', options: agreeOptions },
    { id: 20, text: 'Мне трудно понять правила социального поведения.', type: 'single', options: agreeOptions }
  ],
  interpretations: [
    { min: 0, max: 5, label: 'Низкая вероятность РАС', severity: 'low', description: 'Количество аутичных черт в пределах нормы.' },
    { min: 6, max: 10, label: 'Пограничный результат', severity: 'moderate', description: 'Присутствуют некоторые аутичные черты. При необходимости можно обратиться к специалисту.' },
    { min: 11, max: 15, label: 'Умеренная вероятность РАС', severity: 'high', description: 'Выявлено значительное количество аутичных черт. Рекомендуется консультация специалиста.' },
    { min: 16, max: 20, label: 'Высокая вероятность РАС', severity: 'critical', description: 'Ваши ответы указывают на высокую вероятность расстройства аутистического спектра. Рекомендуется обследование у специалиста.' }
  ],
  source: {
    name: 'Autism-Spectrum Quotient (AQ)',
    url: 'https://psytests.org/arc/aq.html'
  }
};

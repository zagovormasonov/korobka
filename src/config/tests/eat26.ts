import { TestConfig } from './types';

const frequencyOptions = [
  { value: 0, label: 'Никогда' },
  { value: 0, label: 'Редко' },
  { value: 0, label: 'Иногда' },
  { value: 1, label: 'Часто' },
  { value: 2, label: 'Очень часто' },
  { value: 3, label: 'Всегда' }
];

const frequencyOptionsReverse = [
  { value: 3, label: 'Никогда' },
  { value: 2, label: 'Редко' },
  { value: 1, label: 'Иногда' },
  { value: 0, label: 'Часто' },
  { value: 0, label: 'Очень часто' },
  { value: 0, label: 'Всегда' }
];

export const eat26Test: TestConfig = {
  id: 'eating_disorder',
  name: 'EAT-26',
  title: 'Тест отношения к приёму пищи',
  description: 'Скрининговый инструмент для выявления симптомов расстройств пищевого поведения.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Я боюсь располнеть.', type: 'single', options: frequencyOptions },
    { id: 2, text: 'Я избегаю есть, когда голодна.', type: 'single', options: frequencyOptions },
    { id: 3, text: 'Я замечаю, что поглощена мыслями о еде.', type: 'single', options: frequencyOptions },
    { id: 4, text: 'У меня бывают приступы бесконтрольного поглощения пищи, во время которых я не могу себя остановить.', type: 'single', options: frequencyOptions },
    { id: 5, text: 'Я режу свою пищу на мелкие куски.', type: 'single', options: frequencyOptions },
    { id: 6, text: 'Я знаю, сколько калорий в пище, которую ем.', type: 'single', options: frequencyOptions },
    { id: 7, text: 'Я избегаю пищи с высоким содержанием углеводов (хлеб, рис, картофель).', type: 'single', options: frequencyOptions },
    { id: 8, text: 'Мне кажется, что другие хотели бы, чтобы я ела больше.', type: 'single', options: frequencyOptions },
    { id: 9, text: 'У меня бывает рвота после еды.', type: 'single', options: frequencyOptions },
    { id: 10, text: 'После еды я испытываю сильное чувство вины.', type: 'single', options: frequencyOptions },
    { id: 11, text: 'Меня поглощает желание быть стройнее.', type: 'single', options: frequencyOptions },
    { id: 12, text: 'Я думаю о сжигании калорий во время физических упражнений.', type: 'single', options: frequencyOptions },
    { id: 13, text: 'Другие считают, что я слишком худая.', type: 'single', options: frequencyOptions },
    { id: 14, text: 'Меня поглощает мысль о том, что на моём теле есть жир.', type: 'single', options: frequencyOptions },
    { id: 15, text: 'На приём пищи у меня уходит больше времени, чем у других людей.', type: 'single', options: frequencyOptions },
    { id: 16, text: 'Я избегаю пищи, содержащей сахар.', type: 'single', options: frequencyOptions },
    { id: 17, text: 'Я ем диетические продукты.', type: 'single', options: frequencyOptions },
    { id: 18, text: 'Мне кажется, что пища контролирует мою жизнь.', type: 'single', options: frequencyOptions },
    { id: 19, text: 'Я проявляю самоконтроль в отношении еды.', type: 'single', options: frequencyOptions },
    { id: 20, text: 'Мне кажется, что другие давят на меня, чтобы я ела.', type: 'single', options: frequencyOptions },
    { id: 21, text: 'Я трачу слишком много времени на мысли о еде.', type: 'single', options: frequencyOptions },
    { id: 22, text: 'Я испытываю дискомфорт после того, как поем сладкого.', type: 'single', options: frequencyOptions },
    { id: 23, text: 'Я соблюдаю диету.', type: 'single', options: frequencyOptions },
    { id: 24, text: 'Мне нравится ощущение пустого желудка.', type: 'single', options: frequencyOptions },
    { id: 25, text: 'После еды у меня появляется импульс вызвать рвоту.', type: 'single', options: frequencyOptions },
    { id: 26, text: 'Мне нравится пробовать новые высококалорийные блюда.', type: 'single', options: frequencyOptionsReverse }
  ],
  interpretations: [
    { min: 0, max: 19, label: 'Норма', severity: 'low', description: 'Ваше отношение к еде в пределах нормы. Признаки расстройства пищевого поведения не выявлены.' },
    { min: 20, max: 78, label: 'Риск РПП', severity: 'critical', description: 'Ваши ответы указывают на возможное расстройство пищевого поведения. Настоятельно рекомендуется консультация специалиста (психолога, психиатра или диетолога).' }
  ],
  source: {
    name: 'Eating Attitudes Test (EAT-26)',
    url: 'https://psytests.org/food/eat26.html'
  }
};

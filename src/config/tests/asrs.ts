import { TestConfig } from './types';

// ASRS практически не имеет гендерно-специфичных текстов
const frequencyOptions = [
  { value: 0, label: 'Никогда' },
  { value: 1, label: 'Редко' },
  { value: 2, label: 'Иногда' },
  { value: 3, label: 'Часто' },
  { value: 4, label: 'Очень часто' }
];

export const asrsTest: TestConfig = {
  id: 'adhd',
  name: 'ASRS',
  title: 'Шкала самооценки СДВГ у взрослых',
  description: 'Скрининговый инструмент для выявления синдрома дефицита внимания и гиперактивности у взрослых.',
  scoringStrategy: 'sum',
  questions: [
    // Часть А - скрининг (вопросы 1-6)
    { id: 1, text: 'Как часто вам трудно завершить последние детали проекта, после того как сделана основная работа?', type: 'single', options: frequencyOptions },
    { id: 2, text: 'Как часто вам трудно привести дела в порядок, когда нужно выполнить задачу, требующую организованности?', type: 'single', options: frequencyOptions },
    { id: 3, text: 'Как часто вы забываете о назначенных встречах и обязательствах?', type: 'single', options: frequencyOptions },
    { id: 4, text: 'Как часто вы откладываете начало дел, которые требуют много обдумывания?', type: 'single', options: frequencyOptions },
    { id: 5, text: 'Как часто вы ерзаете или крутитесь на месте, когда приходится долго сидеть?', type: 'single', options: frequencyOptions },
    { id: 6, text: 'Как часто вы чувствуете себя чрезмерно активным, словно вас что-то подгоняет?', type: 'single', options: frequencyOptions },
    // Часть Б - дополнительные вопросы (7-18)
    { id: 7, text: 'Как часто вы делаете ошибки по невнимательности при скучной или сложной работе?', type: 'single', options: frequencyOptions },
    { id: 8, text: 'Как часто вам трудно удерживать внимание при выполнении скучной или монотонной работы?', type: 'single', options: frequencyOptions },
    { id: 9, text: 'Как часто вам трудно сосредоточиться на том, что говорит собеседник, даже когда он обращается непосредственно к вам?', type: 'single', options: frequencyOptions },
    { id: 10, text: 'Как часто вы кладёте вещи не на место или вам трудно их найти дома или на работе?', type: 'single', options: frequencyOptions },
    { id: 11, text: 'Как часто вас отвлекает активность или шум вокруг?', type: 'single', options: frequencyOptions },
    { id: 12, text: 'Как часто вы встаёте со своего места на собраниях или в других ситуациях, когда нужно сидеть?', type: 'single', options: frequencyOptions },
    { id: 13, text: 'Как часто вы чувствуете беспокойство или неугомонность?', type: 'single', options: frequencyOptions },
    { id: 14, text: 'Как часто вам трудно расслабиться в свободное время?', type: 'single', options: frequencyOptions },
    { id: 15, text: 'Как часто вы обнаруживаете, что слишком много разговариваете в социальных ситуациях?', type: 'single', options: frequencyOptions },
    { id: 16, text: 'Как часто вы заканчиваете предложения за собеседников, не дожидаясь конца их реплики?', type: 'single', options: frequencyOptions },
    { id: 17, text: 'Как часто вам трудно ждать своей очереди, когда это необходимо?', type: 'single', options: frequencyOptions },
    { id: 18, text: 'Как часто вы перебиваете других, когда они заняты?', type: 'single', options: frequencyOptions }
  ],
  interpretations: [
    { min: 0, max: 16, label: 'СДВГ маловероятен', severity: 'low', description: 'Ваши ответы не указывают на наличие СДВГ.' },
    { min: 17, max: 23, label: 'Возможен СДВГ', severity: 'moderate', description: 'Присутствуют некоторые симптомы, характерные для СДВГ. Рекомендуется консультация специалиста.' },
    { min: 24, max: 72, label: 'Вероятен СДВГ', severity: 'high', description: 'Ваши ответы указывают на высокую вероятность СДВГ. Настоятельно рекомендуется обратиться к психиатру для диагностики.' }
  ],
  source: {
    name: 'Adult ADHD Self-Report Scale (ASRS-v1.1)',
    url: 'https://psytests.org/diag/asrs.html'
  }
};

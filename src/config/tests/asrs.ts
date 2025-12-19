import { TestConfig } from './types';

export const asrsTest: TestConfig = {
  id: 'adhd',
  name: 'ASRS v1.1',
  title: 'Тест на СДВГ у взрослых',
  description: 'Шкала самоотчета для взрослых, разработанная ВОЗ для оценки симптомов невнимательности и гиперактивности.',
  scoringStrategy: 'sum',
  questions: [
    {
      id: 1,
      text: 'Как часто у Вас возникают трудности с завершением последних этапов работы над проектом после того, как его основные части уже выполнены?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    },
    {
      id: 2,
      text: 'Как часто у Вас возникают трудности с организацией дел, когда требуется выполнение упорядоченных действий?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    },
    {
      id: 3,
      text: 'Как часто у Вас возникают проблемы с запоминанием встреч или обязанностей?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    },
    {
      id: 4,
      text: 'Когда у Вас есть дело, требующее много раздумий, как часто Вы избегаете или откладываете начало работы над ним?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    },
    {
      id: 5,
      text: 'Как часто Вы ерзаете или совершаете беспокойные движения руками или ногами, когда Вам приходится долго сидеть на месте?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    },
    {
      id: 6,
      text: 'Как часто Вы чувствуете себя чрезмерно активным и вынужденным совершать какие-либо действия, как будто заведенный мотор?',
      type: 'single',
      options: [
        { value: 0, label: 'Никогда' },
        { value: 1, label: 'Редко' },
        { value: 2, label: 'Иногда' },
        { value: 3, label: 'Часто' },
        { value: 4, label: 'Очень часто' }
      ]
    }
  ],
  interpretations: [
    { min: 0, max: 3, label: 'Низкая вероятность СДВГ', severity: 'low', description: 'Ваши ответы указывают на отсутствие значимых симптомов СДВГ.' },
    { min: 4, max: 24, label: 'Высокая вероятность СДВГ', severity: 'high', description: 'Ваши ответы указывают на наличие симптомов, характерных для СДВГ у взрослых. Рекомендуется обратиться к психиатру для более глубокой диагностики.' }
  ],
  source: {
    name: 'ASRS v1.1',
    url: 'https://psytests.org/diag/asrs.html'
  }
};


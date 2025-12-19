import { TestConfig } from './types';

export const eat26Test: TestConfig = {
  id: 'eating_disorders',
  name: 'EAT-26',
  title: 'Тест на расстройства пищевого поведения',
  description: 'Опросник отношения к приему пищи для выявления склонности к анорексии или булимии.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Я паникую, если чувствую, что поправился.', type: 'single', options: [{ value: 3, label: 'Всегда' }, { value: 2, label: 'Очень часто' }, { value: 1, label: 'Часто' }, { value: 0, label: 'Иногда' }, { value: 0, label: 'Редко' }, { value: 0, label: 'Никогда' }] },
    { id: 2, text: 'Я стараюсь не есть, когда голоден.', type: 'single', options: [{ value: 3, label: 'Всегда' }, { value: 2, label: 'Очень часто' }, { value: 1, label: 'Часто' }, { value: 0, label: 'Иногда' }, { value: 0, label: 'Редко' }, { value: 0, label: 'Никогда' }] },
    { id: 3, text: 'Я слишком много времени думаю о еде.', type: 'single', options: [{ value: 3, label: 'Всегда' }, { value: 2, label: 'Очень часто' }, { value: 1, label: 'Часто' }, { value: 0, label: 'Иногда' }, { value: 0, label: 'Редко' }, { value: 0, label: 'Никогда' }] },
    { id: 4, text: 'У меня бывают приступы переедания, когда я не могу остановиться.', type: 'single', options: [{ value: 3, label: 'Всегда' }, { value: 2, label: 'Очень часто' }, { value: 1, label: 'Часто' }, { value: 0, label: 'Иногда' }, { value: 0, label: 'Редко' }, { value: 0, label: 'Никогда' }] },
    { id: 5, text: 'Я делю пищу на очень маленькие кусочки.', type: 'single', options: [{ value: 3, label: 'Всегда' }, { value: 2, label: 'Очень часто' }, { value: 1, label: 'Часто' }, { value: 0, label: 'Иногда' }, { value: 0, label: 'Редко' }, { value: 0, label: 'Никогда' }] }
  ],
  interpretations: [
    { min: 0, max: 19, label: 'Низкий риск РПП', severity: 'low', description: 'Ваше отношение к еде находится в пределах нормы.' },
    { min: 20, max: 78, label: 'Высокий риск РПП', severity: 'high', description: 'Ваши ответы указывают на наличие значимых проблем с пищевым поведением. Рекомендуется консультация специалиста.' }
  ],
  source: {
    name: 'Eating Attitudes Test (EAT-26)',
    url: 'https://psytests.org/food/eat26.html'
  }
};


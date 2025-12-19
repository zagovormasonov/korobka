import { TestConfig } from './types';

const frequencyOptions = [
  { value: 1, label: 'Никогда' },
  { value: 2, label: 'Редко' },
  { value: 3, label: 'Иногда' },
  { value: 4, label: 'Часто' },
  { value: 5, label: 'Очень часто' }
];

export const ctqTest: TestConfig = {
  id: 'childhood_trauma',
  name: 'CTQ-SF',
  title: 'Опросник детских травм',
  description: 'Краткая форма опросника для выявления неблагоприятного опыта в детстве по пяти шкалам: эмоциональное насилие, физическое насилие, сексуальное насилие, эмоциональное пренебрежение, физическое пренебрежение.',
  scoringStrategy: 'sum',
  questions: [
    // Эмоциональное насилие
    { id: 1, text: 'Когда я рос(ла), члены моей семьи называли меня «глупым», «ленивым» или «уродливым».', type: 'single', options: frequencyOptions },
    { id: 2, text: 'Когда я рос(ла), я думал(а), что мои родители хотели бы, чтобы я не родился(ась).', type: 'single', options: frequencyOptions },
    { id: 3, text: 'Когда я рос(ла), члены моей семьи говорили обидные вещи.', type: 'single', options: frequencyOptions },
    { id: 4, text: 'Когда я рос(ла), я чувствовал(а), что меня ненавидят члены моей семьи.', type: 'single', options: frequencyOptions },
    { id: 5, text: 'Когда я рос(ла), люди в моей семье говорили мне, что я никчёмный(ая).', type: 'single', options: frequencyOptions },
    // Физическое насилие
    { id: 6, text: 'Когда я рос(ла), меня били так сильно, что оставались синяки или отметины.', type: 'single', options: frequencyOptions },
    { id: 7, text: 'Когда я рос(ла), меня наказывали ремнём, палкой или другими предметами.', type: 'single', options: frequencyOptions },
    { id: 8, text: 'Когда я рос(ла), меня били или избивали члены моей семьи.', type: 'single', options: frequencyOptions },
    { id: 9, text: 'Когда я рос(ла), я думал(а), что меня физически травмируют.', type: 'single', options: frequencyOptions },
    { id: 10, text: 'Когда я рос(ла), меня били так сильно, что это заметил врач или учитель.', type: 'single', options: frequencyOptions },
    // Сексуальное насилие
    { id: 11, text: 'Когда я рос(ла), кто-то трогал меня сексуально или заставлял прикасаться к нему.', type: 'single', options: frequencyOptions },
    { id: 12, text: 'Когда я рос(ла), кто-то угрожал мне, чтобы я совершил(а) сексуальные действия.', type: 'single', options: frequencyOptions },
    { id: 13, text: 'Когда я рос(ла), кто-то пытался заставить меня совершить сексуальные действия.', type: 'single', options: frequencyOptions },
    { id: 14, text: 'Когда я рос(ла), кто-то прикасался ко мне сексуально.', type: 'single', options: frequencyOptions },
    { id: 15, text: 'Когда я рос(ла), я подвергался(ась) сексуальному насилию.', type: 'single', options: frequencyOptions },
    // Эмоциональное пренебрежение
    { id: 16, text: 'Когда я рос(ла), я чувствовал(а), что меня любят.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 17, text: 'Когда я рос(ла), люди в моей семье заботились друг о друге.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 18, text: 'Когда я рос(ла), люди в моей семье были близки друг к другу.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 19, text: 'Когда я рос(ла), моя семья была источником силы и поддержки.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 20, text: 'Когда я рос(ла), я чувствовал(а) себя особенным(ой).', type: 'single', options: frequencyOptions, reverse: true },
    // Физическое пренебрежение
    { id: 21, text: 'Когда я рос(ла), мне не хватало еды.', type: 'single', options: frequencyOptions },
    { id: 22, text: 'Когда я рос(ла), я знал(а), что есть кто-то, кто позаботится обо мне и защитит.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 23, text: 'Когда я рос(ла), мои родители были слишком пьяны или под наркотиками, чтобы заботиться о семье.', type: 'single', options: frequencyOptions },
    { id: 24, text: 'Когда я рос(ла), мне приходилось носить грязную одежду.', type: 'single', options: frequencyOptions },
    { id: 25, text: 'Когда я рос(ла), кто-то отводил меня к врачу, когда это было нужно.', type: 'single', options: frequencyOptions, reverse: true },
    // Дополнительные вопросы
    { id: 26, text: 'Когда я рос(ла), я верил(а), что со мной всё будет хорошо.', type: 'single', options: frequencyOptions, reverse: true },
    { id: 27, text: 'Когда я рос(ла), я хотел(а) никогда не рождаться.', type: 'single', options: frequencyOptions },
    { id: 28, text: 'Когда я рос(ла), я чувствовал(а) себя в безопасности дома.', type: 'single', options: frequencyOptions, reverse: true }
  ],
  interpretations: [
    { min: 28, max: 40, label: 'Минимальная травматизация', severity: 'low', description: 'Значимого травматического опыта в детстве не выявлено.' },
    { min: 41, max: 70, label: 'Низкая травматизация', severity: 'moderate', description: 'Присутствует некоторый негативный опыт детства. При необходимости можно обратиться к психологу.' },
    { min: 71, max: 100, label: 'Умеренная травматизация', severity: 'high', description: 'Выявлен значимый травматический опыт в детстве. Рекомендуется работа с психологом или психотерапевтом.' },
    { min: 101, max: 140, label: 'Выраженная травматизация', severity: 'critical', description: 'Выявлен серьёзный травматический опыт в детстве. Настоятельно рекомендуется психотерапия.' }
  ],
  source: {
    name: 'Childhood Trauma Questionnaire (CTQ)',
    url: 'https://psytests.org/trauma/ctq.html'
  }
};

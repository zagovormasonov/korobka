import { TestConfig } from './types';

// PCL-5 практически не имеет гендерно-специфичных текстов
const severityOptions = [
  { value: 0, label: 'Совсем нет' },
  { value: 1, label: 'Немного' },
  { value: 2, label: 'Умеренно' },
  { value: 3, label: 'Сильно' },
  { value: 4, label: 'Очень сильно' }
];

export const pcl5Test: TestConfig = {
  id: 'ptsd',
  name: 'PCL-5',
  title: 'Тест на ПТСР',
  description: 'Опросник для оценки симптомов посттравматического стрессового расстройства за последний месяц.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Повторяющиеся, нежелательные и беспокоящие воспоминания о стрессовом событии?', type: 'single', options: severityOptions },
    { id: 2, text: 'Повторяющиеся, беспокоящие сны о стрессовом событии?', type: 'single', options: severityOptions },
    { id: 3, text: 'Внезапное чувство или действия, как будто стрессовое событие происходит снова (как будто вы переживаете его заново)?', type: 'single', options: severityOptions },
    { id: 4, text: 'Сильное душевное расстройство при напоминании о стрессовом событии?', type: 'single', options: severityOptions },
    { id: 5, text: 'Сильные физические реакции при напоминании о стрессовом событии (например, сердцебиение, тяжелое дыхание, потливость)?', type: 'single', options: severityOptions },
    { id: 6, text: 'Избегание воспоминаний, мыслей или чувств, связанных со стрессовым событием?', type: 'single', options: severityOptions },
    { id: 7, text: 'Избегание внешних напоминаний о стрессовом событии (например, людей, мест, разговоров, предметов, ситуаций)?', type: 'single', options: severityOptions },
    { id: 8, text: 'Трудности с запоминанием важных частей стрессового события?', type: 'single', options: severityOptions },
    { id: 9, text: 'Сильные отрицательные убеждения о себе, других или мире (например, "Я плохой", "Со мной что-то не так", "Никому нельзя доверять", "Мир абсолютно опасен")?', type: 'single', options: severityOptions },
    { id: 10, text: 'Обвинение себя или кого-то другого в стрессовом событии или в том, что произошло после него?', type: 'single', options: severityOptions },
    { id: 11, text: 'Постоянные сильные отрицательные чувства, такие как страх, ужас, гнев, вина или стыд?', type: 'single', options: severityOptions },
    { id: 12, text: 'Потеря интереса к занятиям, которые раньше приносили удовольствие?', type: 'single', options: severityOptions },
    { id: 13, text: 'Чувство отстраненности или отчужденности от других людей?', type: 'single', options: severityOptions },
    { id: 14, text: 'Трудности с переживанием положительных чувств (например, неспособность чувствовать счастье или любовь к близким)?', type: 'single', options: severityOptions },
    { id: 15, text: 'Раздражительность, вспышки гнева или агрессивное поведение?', type: 'single', options: severityOptions },
    { id: 16, text: 'Рискованное или саморазрушительное поведение?', type: 'single', options: severityOptions },
    { id: 17, text: 'Повышенная бдительность, настороженность или чувство опасности?', type: 'single', options: severityOptions },
    { id: 18, text: 'Пугливость или сильные реакции на неожиданные звуки или движения?', type: 'single', options: severityOptions },
    { id: 19, text: 'Трудности с концентрацией внимания?', type: 'single', options: severityOptions },
    { id: 20, text: 'Трудности со сном (засыпанием или прерывистым сном)?', type: 'single', options: severityOptions }
  ],
  interpretations: [
    { min: 0, max: 30, label: 'Низкая вероятность ПТСР', severity: 'low', description: 'Выраженность симптомов ПТСР находится в пределах нормы.' },
    { min: 31, max: 80, label: 'Высокая вероятность ПТСР', severity: 'high', description: 'Набранный балл выше порогового (31-33). Это указывает на наличие значимых симптомов ПТСР. Рекомендуется консультация психотерапевта.' }
  ],
  source: {
    name: 'PCL-5',
    url: 'https://psytests.org/trauma/pcl5.html'
  }
};

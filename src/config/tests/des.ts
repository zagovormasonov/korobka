import { TestConfig } from './types';

export const desTest: TestConfig = {
  id: 'dissociation',
  name: 'DES',
  title: 'Шкала диссоциативного опыта',
  description: 'Шкала для оценки степени выраженности диссоциации (чувства отстраненности от себя или мира).',
  scoringStrategy: 'average',
  questions: [
    { id: 1, text: 'Бывает ли, что вы обнаруживаете себя в каком-то месте и не понимаете, как там оказались?', type: 'single', options: [{ value: 0, label: '0%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }, { value: 30, label: '30%' }, { value: 40, label: '40%' }, { value: 50, label: '50%' }, { value: 60, label: '60%' }, { value: 70, label: '70%' }, { value: 80, label: '80%' }, { value: 90, label: '90%' }, { value: 100, label: '100%' }] },
    { id: 2, text: 'Бывает ли, что вы разговариваете с людьми и вдруг осознаете, что не слышали часть разговора?', type: 'single', options: [{ value: 0, label: '0%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }, { value: 30, label: '30%' }, { value: 40, label: '40%' }, { value: 50, label: '50%' }, { value: 60, label: '60%' }, { value: 70, label: '70%' }, { value: 80, label: '80%' }, { value: 90, label: '90%' }, { value: 100, label: '100%' }] }
  ],
  interpretations: [
    { min: 0, max: 15, label: 'Нормальный уровень', severity: 'low', description: 'Диссоциативный опыт находится в пределах возрастной нормы.' },
    { min: 16, max: 30, label: 'Повышенный уровень', severity: 'moderate', description: 'У вас наблюдается повышенный уровень диссоциации. Это часто встречается при ПТСР.' },
    { min: 31, max: 100, label: 'Высокий уровень', severity: 'high', description: 'Высокая степень диссоциации. Рекомендуется обратиться к психотерапевту.' }
  ],
  source: {
    name: 'Dissociative Experiences Scale (DES)',
    url: 'https://psytests.org/diag/des.html'
  }
};


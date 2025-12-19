import { TestConfig, GenderedText } from './types';

// Хелпер для создания гендерных текстов
const g = (male: string, female: string): GenderedText => ({ male, female });

export const hcl32Test: TestConfig = {
  id: 'bipolar',
  name: 'HCL-32',
  title: 'Опросник гипомании',
  description: 'Инструмент для выявления гипоманиакальных состояний и признаков биполярного расстройства.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Мне нужно меньше сна', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 2, text: 'У меня больше энергии и выносливости', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 3, text: g('Я более уверен в себе', 'Я более уверена в себе'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 4, text: 'Я больше получаю удовольствия от работы', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 5, text: g('Я более общителен (больше звоню, больше выхожу в свет)', 'Я более общительна (больше звоню, больше выхожу в свет)'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 6, text: 'Я больше путешествую', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 7, text: 'Я вожу машину быстрее или рискованнее', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 8, text: 'Я трачу больше денег / слишком много денег', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 9, text: 'Я иду на большие риски в повседневной жизни', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 10, text: g('Я более физически активен (спорт и т.д.)', 'Я более физически активна (спорт и т.д.)'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 11, text: 'Я планирую больше дел или проектов', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 12, text: 'У меня больше творческих идей', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 13, text: g('Я менее застенчив или скован', 'Я менее застенчива или скована'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 14, text: 'Я ношу более яркую или кричащую одежду', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 15, text: g('Я более сексуально активен / у меня повышенное либидо', 'Я более сексуально активна / у меня повышенное либидо'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 16, text: 'Я веду себя более фамильярно или развязно', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 17, text: 'Я больше говорю', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 18, text: 'Я думаю быстрее', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 19, text: 'Я чаще шучу или каламбурю', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 20, text: 'Я легче отвлекаюсь', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 21, text: 'Я занимаюсь множеством новых дел', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 22, text: 'Мои мысли перескакивают с одной темы на другую', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 23, text: 'Я делаю всё быстрее', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 24, text: g('Я более нетерпелив или легче раздражаюсь', 'Я более нетерпелива или легче раздражаюсь'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 25, text: g('Я могу быть изматывающим или раздражающим для других', 'Я могу быть изматывающей или раздражающей для других'), type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 26, text: 'Я чаще вступаю в споры', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 27, text: 'Моё настроение приподнятое или более оптимистичное', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 28, text: 'Я пью больше кофе или чая', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 29, text: 'Я курю больше сигарет', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 30, text: 'Я пью больше алкоголя', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 31, text: 'Я принимаю больше лекарств (успокоительных, стимулирующих)', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] },
    { id: 32, text: 'Я чаще чувствую себя "на высоте"', type: 'single', options: [{ value: 1, label: 'Да' }, { value: 0, label: 'Нет' }] }
  ],
  interpretations: [
    { min: 0, max: 13, label: 'Низкая вероятность БАР', severity: 'low', description: 'Ваши ответы не указывают на выраженные признаки гипомании.' },
    { min: 14, max: 32, label: 'Высокая вероятность БАР II', severity: 'high', description: 'Количество набранных баллов выше порогового (14). Это может указывать на наличие биполярного аффективного расстройства II типа. Рекомендуется обратиться к психиатру для уточнения диагноза.' }
  ],
  source: {
    name: 'HCL-32',
    url: 'https://psytests.org/diag/hcl32.html'
  }
};

import { TestConfig } from './types';

export const duditTest: TestConfig = {
  id: 'substance_abuse',
  name: 'DUDIT',
  title: 'Тест на зависимость от психоактивных веществ',
  description: 'Опросник для выявления проблемного употребления наркотиков.',
  scoringStrategy: 'sum',
  questions: [
    { id: 1, text: 'Как часто Вы употребляете наркотики (кроме алкоголя)?', type: 'single', options: [{ value: 0, label: 'Никогда' }, { value: 1, label: 'Раз в месяц или реже' }, { value: 2, label: '2-4 раза в месяц' }, { value: 3, label: '2-3 раза в неделю' }, { value: 4, label: '4 раза в неделю или чаще' }] },
    { id: 2, text: 'Бывает ли, что Вы употребляете более одного вида наркотиков за один раз?', type: 'single', options: [{ value: 0, label: 'Никогда' }, { value: 1, label: 'Редко' }, { value: 2, label: 'Иногда' }, { value: 3, label: 'Часто' }, { value: 4, label: 'Очень часто' }] }
  ],
  interpretations: [
    { min: 0, max: 1, label: 'Нет проблем с ПАВ', severity: 'low', description: 'Риск зависимости отсутствует.' },
    { min: 2, max: 24, label: 'Риск зависимости', severity: 'high', description: 'Ваши ответы указывают на наличие проблемного употребления. Рекомендуется обратиться к наркологу.' }
  ],
  source: {
    name: 'Drug Use Disorders Identification Test (DUDIT)',
    url: 'https://www.samopomo.ch/proversja/test-po-vyjavleniju-rasstroistv-svjazannykh-s-upotrebleniem-narkotikov-dudit'
  }
};


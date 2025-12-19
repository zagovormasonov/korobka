// Типы для поддержки гендерных текстов
export type Gender = 'male' | 'female';

// Текст может быть строкой или объектом с вариантами для мужского/женского рода
export type GenderedText = string | {
  male: string;
  female: string;
};

// Функция для получения текста с учётом пола
export function getText(text: GenderedText, gender: Gender = 'male'): string {
  if (typeof text === 'string') {
    return text;
  }
  return text[gender] || text.male;
}

export interface TestOption {
  value: number;
  label: GenderedText;
}

export interface TestQuestion {
  id: number;
  text: GenderedText;
  type: 'single' | 'multiple' | 'slider';
  options: TestOption[];
  min?: number;
  max?: number;
  step?: number;
  reverse?: boolean; // Для обратной оценки
}

export interface TestInterpretation {
  min: number;
  max: number;
  label: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: GenderedText;
}

export interface TestSource {
  name: string;
  url: string;
}

export interface TestConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  scoringStrategy: 'sum' | 'average' | 'custom';
  questions: TestQuestion[];
  interpretations: TestInterpretation[];
  source?: TestSource;
}


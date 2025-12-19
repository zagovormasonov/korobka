// Типы для конфигурации тестов

export interface TestOption {
  value: number;
  label: string;
}

export interface TestQuestion {
  id: number;
  text: string;
  type: 'single' | 'multiple';
  options: TestOption[];
}

export interface TestInterpretation {
  min: number;
  max: number;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
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

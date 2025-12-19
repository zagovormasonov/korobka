import { TestConfig } from './types';
import { gad7Config } from './gad7';

export const testsConfig: Record<string, TestConfig> = {
  [gad7Config.id]: gad7Config,
};

export const getTestConfig = (id: string): TestConfig | undefined => {
  return testsConfig[id];
};

export * from './types';


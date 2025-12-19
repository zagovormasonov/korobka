import { TestConfig } from './types';
import { bdiTest } from './bdi';
import { gad7Test } from './gad7';
import { hcl32Test } from './hcl32';
import { pcl5Test } from './pcl5';
import { asrsTest } from './asrs';
import { pdq4Test } from './pdq4';
import { itqTest } from './itq';
import { ybocsTest } from './ybocs';
import { eat26Test } from './eat26';
import { duditTest } from './dudit';
import { desTest } from './des';
import { aqTest } from './aq';
import { lsasTest } from './lsas';
import { pdssTest } from './pdss';
import { bddqTest } from './bddq';
import { osrTest } from './osr';
import { ctqTest } from './ctq';
import { spqTest } from './spq';
import { mbiTest } from './mbi';

export const additionalTests: TestConfig[] = [
  bdiTest,
  gad7Test,
  hcl32Test,
  pcl5Test,
  asrsTest,
  pdq4Test,
  itqTest,
  ybocsTest,
  eat26Test,
  duditTest,
  desTest,
  aqTest,
  lsasTest,
  pdssTest,
  bddqTest,
  osrTest,
  ctqTest,
  spqTest,
  mbiTest
];

export function getTestConfig(idOrName: string): TestConfig | undefined {
  if (!idOrName) return undefined;
  
  const searchTerm = idOrName.toLowerCase();
  
  return additionalTests.find(test => 
    test.id.toLowerCase() === searchTerm || 
    test.name.toLowerCase() === searchTerm ||
    test.name.toLowerCase().includes(searchTerm) ||
    test.title.toLowerCase().includes(searchTerm)
  );
}

export type { TestConfig, TestQuestion, TestOption, TestInterpretation, TestSource, Gender, GenderedText } from './types';
export { getText } from './types';

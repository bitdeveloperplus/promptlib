import { createDefaultPreset, JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: '@quramy/jest-prisma-node/environment',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/$1',
    '^@utils/(.*)': '<rootDir>/utils/$1',
  },
  maxConcurrency: 1,
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  ...createDefaultPreset(),
};

export default jestConfig;


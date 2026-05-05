module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lambda', '<rootDir>/lib', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};

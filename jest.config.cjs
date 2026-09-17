module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/tests/styleMock.js',
    '^azure-devops-extension-sdk$': '<rootDir>/tests/__mocks__/azure-devops-extension-sdk.ts',
  },
  testMatch: ['**/tests/**/*.test.ts?(x)'],
};

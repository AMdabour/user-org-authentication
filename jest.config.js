module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
    setupFilesAfterEnv: ['./tests/setup.js'],
  };

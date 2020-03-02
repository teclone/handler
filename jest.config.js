module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testRegex: '\\.spec\\.ts',
  setupFiles: ['./tests/setup.ts'],
};

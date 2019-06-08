module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    transform: {
        '^.+\\.tsx?$': 'babel-jest'
    },
    testRegex: '\\.spec\\.ts',
    setupFiles: [
        './test.setup.js'
    ]
};
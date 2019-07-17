module.exports = (config) => {
  config.set({
    mutator: 'javascript',
    packageManager: 'npm',
    reporters: ['clear-text', 'progress', 'html'],
    htmlReporter: {
      baseDir: '.coverage/stryker',
    },
    testRunner: 'mocha',
    transpilers: [],
    testFramework: 'mocha',
    coverageAnalysis: 'all',
    mutate: [
      'middleware/**/*.js',
    ],
    mochaOptions: {
      spec: [
        'test/unit/**/*.test.js',
      ],
    },
    thresholds: {
      high: 80,
      low: 70,
      break: 60,
    },
  });
};

module.exports = {
  extends: '@dwp/commitlint-config-base',
  rules: {
    // Renovate has merged commits exceding the max 100
    'header-max-length': [1, 'always', 100],
  },
  ignores: [
    // Historical misformatting
    (message) => message.includes('fix(journey_context)'),
  ],
};

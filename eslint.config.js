const angular = require('angular-eslint');

const tsFiles = ['**/*.ts'];
const templateFiles = ['**/*.html'];

module.exports = [
  ...angular.configs.tsRecommended.map((config) => ({ ...config, files: tsFiles })),
  {
    files: tsFiles,
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
    },
  },
  ...angular.configs.templateRecommended.map((config) => ({ ...config, files: templateFiles })),
  {
    files: templateFiles,
    rules: {},
  },
];

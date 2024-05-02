/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
  globals: {
    shopify: "readonly",
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unknown-property": "off",
  },
};

/*
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended' // Make sure this is the last element in the array
  ],
  globals: {
    shopify: "readonly"
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'prettier' // This plugin runs Prettier as an ESLint rule
  ],
  rules: {
    'prettier/prettier': ['error', {
      endOfLine: 'auto',
      semi: false,
      singleQuote: true,
      jsxSingleQuote: true,
      trailingComma: 'none',
      bracketSpacing: true,
      jsxBracketSameLine: false,
      arrowParens: 'avoid',
      printWidth: 80
    }],
    'react/react-in-jsx-scope': 'off'
  }
};
*/

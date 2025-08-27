module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    // React rules
    'react/prop-types': 'off', // Disable for now
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/no-unescaped-entities': 'off', // Disable for now
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General rules - relaxed for build
    'no-console': 'off', // Allow console logs
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': 'warn', // Warning instead of error
    'no-undef': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-multiple-empty-lines': ['warn', { max: 2 }],
    'eol-last': 'warn',
    'no-trailing-spaces': 'warn',
    'indent': ['warn', 2],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
    'space-before-function-paren': ['warn', 'always'],
    'keyword-spacing': 'warn',
    'space-infix-ops': 'warn',
    'no-multi-spaces': 'warn',
    'no-mixed-spaces-and-tabs': 'error',
    'no-empty': 'warn', // Warning instead of error
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

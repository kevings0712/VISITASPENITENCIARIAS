const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  // ignora compilados y dependencias
  { ignores: ['dist/**', 'node_modules/**'] },

  // Reglas JS recomendadas
  js.configs.recommended,

  // Reglas TS sin type-checking (rápidas y suficientes para CI básico)
  ...tseslint.configs.recommended
];

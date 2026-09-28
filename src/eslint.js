/*
 * Copyright CIB software GmbH and/or licensed to CIB software GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. CIB software licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

// "CIB formatting rules" as used in cib-common-frontend, cib-bootstrap-components,
// cibseven-webclient(-ee) and cibseven-chat-ui. ESLint --fix replaces Prettier.
export const formattingRules = Object.freeze({
  'semi': ['error', 'never'],
  'quotes': ['error', 'single', { 'avoidEscape': true }],
  'space-before-function-paren': ['error', {
    'anonymous': 'never',
    'named': 'never',
    'asyncArrow': 'always'
  }],
  'object-shorthand': ['error', 'always'],
})

/**
 * Flat ESLint config for CIB Vue 3 projects. Spread it and append project-specific blocks:
 *
 *   export default [...cibEslintConfig(), { rules: { ... } }]
 *
 * @param {object} [options]
 * @param {boolean} [options.formatting=true] include the CIB formatting rules
 * @param {boolean} [options.a11y=true] include eslint-plugin-vuejs-accessibility
 * @param {string[]} [options.testFiles] globs that get the Vitest rules
 * @param {string[]} [options.ignores] additional ignore globs
 */
export function cibEslintConfig({
  formatting = true,
  a11y = true,
  testFiles = ['src/**/__tests__/**', '**/*.{test,spec}.js'],
  ignores = [],
} = {}) {
  const config = [
    {
      name: 'cib/files-to-lint',
      files: ['**/*.{js,mjs,jsx,vue}'],
    },
    {
      name: 'cib/files-to-ignore',
      ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/target/**', ...ignores],
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
      ...pluginVitest.configs.recommended,
      name: 'cib/vitest',
      files: testFiles,
    },
  ]

  if (a11y) {
    config.push(
      ...pluginVueA11y.configs['flat/recommended'],
      {
        name: 'cib/a11y',
        rules: {
          'vuejs-accessibility/label-has-for': ['error', { 'required': { 'every': ['id'] } }],
        },
      },
    )
  }

  if (formatting) {
    config.push({ name: 'cib/formatting', rules: { ...formattingRules } })
  }

  return config
}

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
import { configDefaults, mergeConfig } from 'vitest/config'

// Paths read by standardNPMPipeline / Maven Surefire-style result collection:
// testResultsPattern (ConstantsInternal.MAVEN_TEST_RESULTS), coverageCoberturaPattern, coverageLcovPattern
export const JUNIT_REPORT = 'target/vitest-reports/TEST-front-end.xml'
export const COVERAGE_DIR = './target/coverage'

export const testDefaults = Object.freeze({
  environment: 'jsdom',
  exclude: [...configDefaults.exclude, 'e2e/**'],
  reporters: ['default', 'junit'],
  outputFile: { junit: JUNIT_REPORT },
  coverage: {
    provider: 'istanbul',
    reporter: ['text', 'lcov', 'cobertura'],
    reportsDirectory: COVERAGE_DIR,
    include: ['src/**'],
    exclude: [
      'dist/**',
      'target/**',
      'node_modules/**',
      'src/main.js',
      'src/__tests__/**',
      '**/*.config.js',
      '\0*', // Vite virtual modules
    ],
    excludeNodeModules: true,
  },
})

/**
 * Returns the CIB default Vitest `test` block, deep-merged with project overrides.
 * Arrays are concatenated (e.g. extra `coverage.exclude` entries are appended),
 * objects are merged, scalars from `overrides` win.
 */
export function cibVitestConfig(overrides = {}) {
  // isRoot=false: this is a nested `test` block, not a full Vite config
  return mergeConfig(structuredClone(testDefaults), overrides, false)
}

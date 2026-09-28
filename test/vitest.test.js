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
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cibVitestConfig, COVERAGE_DIR, JUNIT_REPORT, testDefaults } from '../src/vitest.js'
import { defineCibConfig } from '../src/vite.js'

describe('cibVitestConfig', () => {
  it('writes reports where standardNPMPipeline reads them', () => {
    const config = cibVitestConfig()
    expect(config.outputFile.junit).toBe('target/vitest-reports/TEST-front-end.xml')
    expect(config.reporters).toEqual(['default', 'junit'])
    expect(config.coverage.reportsDirectory).toBe('./target/coverage')
    expect(config.coverage.reporter).toEqual(['text', 'lcov', 'cobertura'])
    expect(config.coverage.provider).toBe('istanbul')
    expect(JUNIT_REPORT).toBe(config.outputFile.junit)
    expect(COVERAGE_DIR).toBe(config.coverage.reportsDirectory)
  })

  it('appends arrays and overrides scalars', () => {
    const config = cibVitestConfig({
      environment: 'happy-dom',
      setupFiles: ['src/__tests__/setup.js'],
      coverage: { exclude: ['src/app.js'], thresholds: { lines: 50 } },
    })
    expect(config.environment).toBe('happy-dom')
    expect(config.setupFiles).toEqual(['src/__tests__/setup.js'])
    expect(config.coverage.exclude).toContain('src/app.js')
    expect(config.coverage.exclude).toContain('src/__tests__/**')
    expect(config.coverage.thresholds).toEqual({ lines: 50 })
    expect(config.coverage.provider).toBe('istanbul')
  })

  it('does not mutate the shared defaults', () => {
    cibVitestConfig({ coverage: { exclude: ['x/**'] } })
    expect(testDefaults.coverage.exclude).not.toContain('x/**')
  })
})

describe('defineCibConfig', () => {
  it('merges the test block and keeps the rest of the Vite config', () => {
    const config = defineCibConfig({ base: '/app/', test: { maxWorkers: 1 } })
    expect(config.base).toBe('/app/')
    expect(config.test.maxWorkers).toBe(1)
    expect(config.test.environment).toBe('jsdom')
  })

  it('supports function configs', async () => {
    const factory = defineCibConfig(({ mode }) => ({ base: mode === 'library' ? '/lib/' : '/' }))
    const config = await factory({ mode: 'library', command: 'build' })
    expect(config.base).toBe('/lib/')
    expect(config.test.outputFile.junit).toBe(JUNIT_REPORT)
  })
})

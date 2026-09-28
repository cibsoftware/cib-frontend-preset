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
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkPackage } from '../src/check.js'

const compliant = {
  name: 'demo',
  scripts: { 'lint': 'eslint .', 'test:unit': 'vitest run --coverage', 'build': 'vite build' },
  devDependencies: { '@cib/frontend-preset': '0.1.0', 'vite': '6.4.3' },
}
const messages = (pkg, options) => checkPackage(pkg, options).map((f) => f.message)

describe('checkPackage', () => {
  it('accepts a compliant package', () => {
    expect(checkPackage(compliant)).toEqual([])
  })

  it('reports missing required scripts', () => {
    expect(messages({ ...compliant, scripts: {} })).toEqual(expect.arrayContaining([
      'missing script "lint"', 'missing script "test:unit"', 'missing script "build"',
    ]))
  })

  it('rejects vitest watch mode in test:unit', () => {
    const pkg = { ...compliant, scripts: { ...compliant.scripts, 'test:unit': 'vitest' } }
    expect(messages(pkg)).toContain('"test:unit" runs vitest in watch mode; use "vitest run"')
  })

  it('rejects a mutating lint script', () => {
    const pkg = { ...compliant, scripts: { ...compliant.scripts, lint: 'eslint . --fix' } }
    expect(messages(pkg).join()).toMatch(/must not modify files/)
  })

  it('rejects Prettier', () => {
    const pkg = { ...compliant, scripts: { ...compliant.scripts, format: 'prettier --write .' } }
    expect(messages(pkg).join()).toMatch(/Prettier/)
  })

  it('rejects version ranges', () => {
    const pkg = { ...compliant, dependencies: { vue: '^3.5.0', lodash: '4.17.21' } }
    expect(messages(pkg)).toContain('version ranges instead of exact versions: vue@^3.5.0')
  })

  it('requires a lockfile', () => {
    expect(messages(compliant, { hasLockfile: false }).join()).toMatch(/package-lock.json/)
  })

  it('only warns when the preset is not used', () => {
    const devDependencies = { ...compliant.devDependencies }
    delete devDependencies['@cib/frontend-preset']
    const findings = checkPackage({ ...compliant, devDependencies })
    expect(findings).toEqual([{ level: 'warning', message: '@cib/frontend-preset is not a dependency' }])
  })
})

describe('cib-frontend check (CLI)', () => {
  const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url))
  const run = (dir) => {
    try {
      return { code: 0, out: execFileSync('node', [cli, 'check', dir, '--json'], { encoding: 'utf8' }) }
    } catch (e) {
      return { code: e.status, out: e.stdout }
    }
  }
  const project = (pkg) => {
    const dir = mkdtempSync(join(tmpdir(), 'cib-frontend-'))
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg))
    writeFileSync(join(dir, 'package-lock.json'), '{}')
    return dir
  }

  it('exits 0 for a compliant project', () => {
    const { code, out } = run(project(compliant))
    expect(code).toBe(0)
    expect(JSON.parse(out).compliant).toBe(true)
  })

  it('exits 1 for a non-compliant project', () => {
    const { code, out } = run(project({ ...compliant, scripts: {} }))
    expect(code).toBe(1)
    expect(JSON.parse(out).compliant).toBe(false)
  })
})

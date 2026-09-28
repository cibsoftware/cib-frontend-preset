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
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sbomCommands } from '../src/sbom.js'

describe('sbomCommands', () => {
  it('matches the cibseven-webclient Maven profile by default', () => {
    expect(sbomCommands()).toEqual([
      {
        format: 'json',
        file: join('target', 'frontend-bom.json'),
        args: ['--output-file', join('target', 'frontend-bom.json'), '--output-format', 'JSON', '--omit', 'dev'],
      },
      {
        format: 'xml',
        file: join('target', 'frontend-bom.xml'),
        args: ['--output-file', join('target', 'frontend-bom.xml'), '--output-format', 'XML', '--omit', 'dev'],
      },
    ])
  })

  it('supports a single format, another name and dev dependencies', () => {
    const [command, ...others] = sbomCommands({ formats: ['xml'], name: 'bom', outputDir: 'out', omitDev: false })
    expect(others).toEqual([])
    expect(command.file).toBe(join('out', 'bom.xml'))
    expect(command.args).not.toContain('--omit')
  })

  it('rejects unknown formats', () => {
    expect(() => sbomCommands({ formats: ['spdx'] })).toThrow('unsupported SBOM format "spdx"')
  })
})

describe('cib-frontend sbom (CLI)', () => {
  const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url))
  const root = fileURLToPath(new URL('..', import.meta.url))

  it('writes a CycloneDX SBOM of production dependencies', () => {
    const out = mkdtempSync(join(tmpdir(), 'cib-sbom-'))
    execFileSync('node', [cli, 'sbom', root, '--output-dir', out, '--format', 'json'], { stdio: 'pipe' })

    const bom = JSON.parse(readFileSync(join(out, 'frontend-bom.json'), 'utf8'))
    const names = bom.components.map((c) => c.name)
    expect(bom.bomFormat).toBe('CycloneDX')
    expect(bom.metadata.component.name).toBe('frontend-preset')
    expect(names).toContain('eslint')
    // devDependency of the preset, omitted with --omit dev
    expect(names).not.toContain('@vue/test-utils')
  }, 60_000)

  it('rejects an option without value', () => {
    expect(() => execFileSync('node', [cli, 'sbom', '--format'], { stdio: 'pipe' })).toThrow(/--format needs a value/)
  })
})

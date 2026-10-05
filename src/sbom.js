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
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

// Same output as the "generate-frontend-sbom" Maven profile in cibseven-webclient:
// target/frontend-bom.{json,xml}, production dependencies only.
export const SBOM_DEFAULTS = Object.freeze({
  outputDir: 'target',
  name: 'frontend-bom',
  formats: ['json', 'xml'],
  omitDev: true,
})

const FORMATS = ['json', 'xml']

/**
 * Builds one cyclonedx-npm invocation per requested format.
 * Returns `[{ format, file, args }]`; `file` is relative to the project directory.
 */
export function sbomCommands(options = {}) {
  const { outputDir, name, formats, omitDev } = { ...SBOM_DEFAULTS, ...options }
  for (const format of formats) {
    if (!FORMATS.includes(format)) throw new Error(`unsupported SBOM format "${format}" (use ${FORMATS.join(', ')})`)
  }
  return formats.map((format) => {
    const file = join(outputDir, `${name}.${format}`)
    const args = ['--output-file', file, '--output-format', format.toUpperCase()]
    if (omitDev) args.push('--omit', 'dev')
    return { format, file, args }
  })
}

// The package only exports its API entry; the CLI lives next to it in bin/
function cyclonedxCli() {
  const entry = createRequire(import.meta.url).resolve('@cyclonedx/cyclonedx-npm')
  return join(dirname(entry), 'bin', 'cyclonedx-npm-cli.js')
}

/**
 * Generates the SBOM files for the project in `dir`. Returns the exit code of the
 * first failing cyclonedx-npm run, or 0.
 */
export function generateSbom(dir, options = {}) {
  const cwd = resolve(dir)
  const cli = cyclonedxCli()
  for (const { file, args } of sbomCommands(options)) {
    mkdirSync(dirname(resolve(cwd, file)), { recursive: true })
    // DEP0040: cyclonedx-npm's dependencies still load the deprecated 'punycode' module
    const { status, error } = spawnSync(process.execPath, ['--disable-warning=DEP0040', cli, ...args], { cwd, stdio: 'inherit' })
    if (error) throw error
    if (status !== 0) return status ?? 1
    console.log(`SBOM written to ${file}`)
  }
  return 0
}

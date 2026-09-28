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
// Script names called by standardNPMPipeline (lintCommand, testCommand, buildCommand defaults)
// and by frontend-maven-plugin executions in Maven + npm repositories.
export const REQUIRED_SCRIPTS = Object.freeze(['lint', 'test:unit', 'build'])

const RANGE = /[~^*<>=|]|^x$|\.x\b|^latest$/

/**
 * Checks a parsed package.json against the CIB frontend standard.
 * Returns a list of `{ level: 'error' | 'warning', message }`; empty means compliant.
 */
export function checkPackage(pkg, { hasLockfile = true } = {}) {
  const findings = []
  const error = (message) => findings.push({ level: 'error', message })
  const warning = (message) => findings.push({ level: 'warning', message })
  const scripts = pkg.scripts ?? {}

  for (const name of REQUIRED_SCRIPTS) {
    if (!scripts[name]) error(`missing script "${name}"`)
  }

  const testUnit = scripts['test:unit'] ?? ''
  if (/\bvitest\b/.test(testUnit) && !/\bvitest\s+run\b|--run\b/.test(testUnit)) {
    error('"test:unit" runs vitest in watch mode; use "vitest run"')
  }

  if (scripts.lint && /--fix\b/.test(scripts.lint)) {
    error('"lint" must not modify files; move --fix to "lint:fix"')
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.prettier || Object.values(scripts).some((s) => /\bprettier\b/.test(s))) {
    error('Prettier is not used at CIB; format with "eslint --fix"')
  }

  const ranged = Object.entries(deps).filter(([, version]) => RANGE.test(version))
  if (ranged.length) {
    error(`version ranges instead of exact versions: ${ranged.map(([n, v]) => `${n}@${v}`).join(', ')}`)
  }

  if (!hasLockfile) error('package-lock.json missing (standardNPMPipeline runs "npm ci")')

  if (!deps['@cib/frontend-preset'] && pkg.name !== '@cib/frontend-preset') {
    warning('@cib/frontend-preset is not a dependency')
  }

  return findings
}

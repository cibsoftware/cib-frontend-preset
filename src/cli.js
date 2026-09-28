#!/usr/bin/env node
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
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { checkPackage } from './check.js'

const USAGE = `Usage: cib-frontend check [dir] [--json]

  check   verify package.json in [dir] (default: current directory)
          against the CIB frontend standard; exits 1 on errors
  --json  print findings as JSON (for cross-repo inventories)`

function check(dir, json) {
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) {
    console.error(`No package.json in ${dir}`)
    return 2
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const findings = checkPackage(pkg, { hasLockfile: existsSync(join(dir, 'package-lock.json')) })
  const errors = findings.filter((f) => f.level === 'error')

  if (json) {
    console.log(JSON.stringify({ name: pkg.name, dir, compliant: errors.length === 0, findings }, null, 2))
  } else if (findings.length === 0) {
    console.log(`${pkg.name}: compliant`)
  } else {
    for (const f of findings) console.log(`${pkg.name}: ${f.level}: ${f.message}`)
  }
  return errors.length ? 1 : 0
}

const args = process.argv.slice(2)
const [command, ...rest] = args
const json = rest.includes('--json')
const dir = resolve(rest.find((a) => !a.startsWith('--')) ?? '.')

if (command === 'check') {
  process.exit(check(dir, json))
} else {
  console.log(USAGE)
  process.exit(command === undefined || command === '--help' ? 0 : 2)
}

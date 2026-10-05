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
import { generateSbom, SBOM_DEFAULTS } from './sbom.js'

const USAGE = `Usage: cib-frontend <command> [dir] [options]

Commands:
  check   verify package.json in [dir] (default: current directory)
          against the CIB frontend standard; exits 1 on errors
            --json              print findings as JSON (for cross-repo inventories)

  sbom    write a CycloneDX SBOM of [dir] with cyclonedx-npm
            --output-dir <dir>  default: ${SBOM_DEFAULTS.outputDir}
            --name <name>       file name without extension, default: ${SBOM_DEFAULTS.name}
            --format <list>     json, xml or json,xml (default: ${SBOM_DEFAULTS.formats.join(',')})
            --include-dev       include devDependencies (default: production only)`

const VALUE_OPTIONS = ['--output-dir', '--name', '--format']

function parseArgs(argv) {
  const [command, ...rest] = argv
  const options = {}
  const positional = []
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (VALUE_OPTIONS.includes(arg)) {
      if (rest[i + 1] === undefined) throw new Error(`${arg} needs a value`)
      options[arg.slice(2)] = rest[++i]
    } else if (arg.startsWith('--')) {
      options[arg.slice(2)] = true
    } else {
      positional.push(arg)
    }
  }
  return { command, dir: resolve(positional[0] ?? '.'), options }
}

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

function sbom(dir, options) {
  return generateSbom(dir, {
    ...(options['output-dir'] && { outputDir: options['output-dir'] }),
    ...(options.name && { name: options.name }),
    ...(options.format && { formats: options.format.split(',').map((f) => f.trim().toLowerCase()) }),
    ...(options['include-dev'] && { omitDev: false }),
  })
}

function main(argv) {
  const { command, dir, options } = parseArgs(argv)
  switch (command) {
    case 'check': return check(dir, options.json === true)
    case 'sbom': return sbom(dir, options)
    case undefined:
    case '--help':
      console.log(USAGE)
      return 0
    default:
      console.log(USAGE)
      return 2
  }
}

try {
  process.exit(main(process.argv.slice(2)))
} catch (e) {
  console.error(e.message)
  process.exit(2)
}

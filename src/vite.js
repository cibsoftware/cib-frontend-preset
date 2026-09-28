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
import { mergeConfig } from 'vite'
import { cibVitestConfig } from './vitest.js'

/**
 * Wraps a project's Vite config with the CIB defaults, so a single vite.config.js
 * also carries the Vitest setup (no separate vitest.config.js needed).
 *
 * Accepts a config object or a function `(env) => config`, like Vite's defineConfig.
 * A `test` block in the project config is merged over the CIB test defaults.
 */
export function defineCibConfig(userConfig = {}) {
  const apply = (config) => {
    const { test, ...rest } = config ?? {}
    return mergeConfig({ test: cibVitestConfig(test) }, rest)
  }
  if (typeof userConfig === 'function') {
    return async (env) => apply(await userConfig(env))
  }
  return apply(userConfig)
}

export { cibVitestConfig }

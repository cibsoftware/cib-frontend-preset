# @cib/frontend-preset

Shared Vite, Vitest and ESLint configuration for CIB Vue 3 frontends, plus a `cib-frontend` CLI:
`check` verifies a project follows the CIB npm script standard (DEVOPS-818), `sbom` writes a
CycloneDX SBOM of its production dependencies.

One devDependency replaces the copy-pasted `vitest.config.js`, `eslint.config.js` and the tool
versions in every project. Updating ESLint or Vitest becomes one version bump of this package.

## What it standardises

| Script | Called by | Output (read by CI) |
|---|---|---|
| `lint` | `standardNPMPipeline` (SAST), frontend-maven-plugin | exit code |
| `lint:ci` (optional) | `lintCommand: 'npm run lint:ci'` | `lint-results.xml` (JUnit) |
| `test:unit` | `standardNPMPipeline` (UNIT_TESTS), frontend-maven-plugin | `target/vitest-reports/TEST-front-end.xml`, `target/coverage/{cobertura-coverage.xml,lcov.info}` |
| `build` | `standardNPMPipeline`, frontend-maven-plugin | `dist/` |

The report paths are set by the preset, so `test:unit` is just `vitest run --coverage`.

Versions owned by the preset: eslint 10.8.1, @cyclonedx/cyclonedx-npm 6.0.1, @eslint/js 10.0.1, eslint-plugin-vue 10.10.0,
eslint-plugin-vuejs-accessibility 2.6.0, @vitest/eslint-plugin 1.6.27, vitest 4.1.11,
@vitest/coverage-istanbul 4.1.11, jsdom 29.1.0, eslint-formatter-junit 9.0.1.
`vite` stays a peer dependency (6, 7 or 8), so each project picks its Vite version.

## Usage

```bash
npm install --save-dev --save-exact @cib/frontend-preset
```

`vite.config.js` (replaces `vitest.config.js`, which can be deleted):

```js
import vue from '@vitejs/plugin-vue'
import { defineCibConfig } from '@cib/frontend-preset/vite'

export default defineCibConfig({
  plugins: [vue()],
  // Project-specific test settings are merged over the CIB defaults
  test: {
    setupFiles: ['src/__tests__/setup.js'],
    coverage: { exclude: ['src/app.js'], thresholds: { lines: 50 } },
  },
})
```

`defineCibConfig` also accepts a function `({ mode, command }) => config`, like Vite's `defineConfig`.
Only a `test` block is needed with an existing config: `cibVitestConfig(overrides)` from
`@cib/frontend-preset/vitest` returns the merged `test` block.

`eslint.config.js`:

```js
import { cibEslintConfig } from '@cib/frontend-preset/eslint'

export default [
  ...cibEslintConfig(),
  // project-specific blocks follow
  { rules: { 'vue/require-explicit-emits': 'error' } },
]
```

Options: `formatting` (CIB formatting rules, default `true`), `a11y` (vuejs-accessibility,
default `true`), `testFiles` (globs for the Vitest rules), `ignores` (extra ignore globs).
`dist`, `target` and `coverage` are always ignored.

`package.json`:

```json
"scripts": {
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "lint:ci": "eslint . --format junit --output-file lint-results.xml",
  "test:unit": "vitest run --coverage",
  "build": "vite build",
  "check": "cib-frontend check"
}
```

Then remove `eslint`, `@eslint/js`, the ESLint plugins, `vitest`, `@vitest/coverage-istanbul` and
`jsdom` from the project's own devDependencies.

## `cib-frontend check`

```bash
npx cib-frontend check [dir] [--json]
```

Exits 1 when:
- one of `lint`, `test:unit` or `build` is missing
- `test:unit` runs Vitest in watch mode (`vitest` without `run`)
- `lint` modifies files (`--fix`)
- Prettier is used (formatting is `eslint --fix`)
- a dependency uses a version range instead of an exact version
- `package-lock.json` is missing

Not using `@cib/frontend-preset` yet is only a warning. `--json` prints machine-readable findings
for a cross-repo inventory.

## `cib-frontend sbom`

```bash
npx cib-frontend sbom [dir] [--output-dir target] [--name frontend-bom] [--format json,xml] [--include-dev]
```

Writes a CycloneDX SBOM (spec 1.6) of the project's production dependencies with
[`@cyclonedx/cyclonedx-npm`](https://github.com/CycloneDX/cyclonedx-node-npm), pinned by the preset.
The defaults produce `target/frontend-bom.json` and `target/frontend-bom.xml`, the same files as the
`generate-frontend-sbom` Maven profile in cibseven-webclient. Run it after `npm ci`, because it reads
`node_modules`.

In a Maven + npm repository, add a script and let the profile call it instead of two
`npm exec --yes -- @cyclonedx/cyclonedx-npm@...` executions:

```json
"sbom": "cib-frontend sbom"
```

```xml
<execution>
  <id>generate-frontend-sbom</id>
  <goals><goal>npm</goal></goals>
  <phase>prepare-package</phase>
  <configuration>
    <arguments>run sbom</arguments>
  </configuration>
</execution>
```

This removes the download at build time, and the tool version gets the same Renovate and
`min-release-age` treatment as every other dependency. The `build-helper-maven-plugin` execution that
attaches the two files stays unchanged.

Standalone npm projects on `standardNPMPipeline` do not need this for Dependency-Track: the pipeline
already generates its own `bom.xml` in the SAST stage.

## Development

```bash
npm ci
npm run lint
npm run test:unit
npm run build   # npm pack into dist/
```

Released by `standardNPMPipeline` (see `Jenkinsfile`) to `artifacts.cibseven.org`.

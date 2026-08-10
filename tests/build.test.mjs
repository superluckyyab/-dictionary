import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const buildModule = join(root, 'scripts', 'build.mjs')

async function loadBuild() {
  assert.equal(existsSync(buildModule), true, 'scripts/build.mjs must exist')
  return import(pathToFileURL(buildModule))
}

test('build script exists', () => {
  assert.equal(existsSync(buildModule), true, 'scripts/build.mjs must exist')
})

test('requires both public Supabase keys', async () => {
  const { validateConfig } = await loadBuild()
  assert.throws(() => validateConfig({}), /SUPABASE_URL/)
  assert.throws(
    () => validateConfig({ SUPABASE_URL: 'https://example.supabase.co' }),
    /SUPABASE_PUBLISHABLE_KEY/
  )
})

test('renders browser runtime configuration', async () => {
  const { renderConfig } = await loadBuild()
  const output = renderConfig({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
  })

  assert.match(output, /window\.__DICTIONARY_CONFIG__/)
  assert.match(output, /https:\/\/example\.supabase\.co/)
  assert.match(output, /sb_publishable_test/)
})

test('copies deployable files and writes config', async () => {
  const { buildSite } = await loadBuild()
  const workspace = await mkdtemp(join(tmpdir(), 'dictionary-build-'))
  const source = join(workspace, 'source')
  const output = join(workspace, 'dist')
  await mkdir(source)
  await writeFile(join(source, 'index.html'), '<main>dictionary</main>')
  await writeFile(join(source, 'app.jsx'), 'window.app = true')

  await buildSite({
    source,
    output,
    env: {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    }
  })

  assert.equal(await readFile(join(output, 'index.html'), 'utf8'), '<main>dictionary</main>')
  assert.match(await readFile(join(output, 'config.js'), 'utf8'), /sb_publishable_test/)
})

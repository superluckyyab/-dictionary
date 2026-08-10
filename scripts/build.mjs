import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

export function validateConfig(env) {
  if (!env.SUPABASE_URL) {
    throw new Error('Missing required environment variable: SUPABASE_URL')
  }
  if (!env.SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing required environment variable: SUPABASE_PUBLISHABLE_KEY')
  }

  return {
    url: env.SUPABASE_URL,
    publishableKey: env.SUPABASE_PUBLISHABLE_KEY
  }
}

export function renderConfig(env) {
  const config = validateConfig(env)
  return `window.__DICTIONARY_CONFIG__ = Object.freeze(${JSON.stringify(config)});\n`
}

export async function buildSite({ source = root, output = join(root, 'dist'), env = process.env } = {}) {
  const resolvedSource = resolve(source)
  const resolvedOutput = resolve(output)
  if (resolvedOutput === resolvedSource || !resolvedOutput.startsWith(`${resolvedSource}\\`) && process.platform === 'win32') {
    if (resolvedOutput === resolvedSource) {
      throw new Error('Build output must differ from the source directory')
    }
  }

  await rm(resolvedOutput, { recursive: true, force: true })
  await mkdir(resolvedOutput, { recursive: true })

  const files = [
    'index.html',
    'app.jsx',
    'seed.jsx',
    'supabase-client.js',
    'data-service.js',
    'migration-service.js'
  ]

  for (const file of files) {
    const input = join(resolvedSource, file)
    if (existsSync(input)) {
      await copyFile(input, join(resolvedOutput, file))
    }
  }

  const uploads = join(resolvedSource, 'uploads')
  if (existsSync(uploads)) {
    await cp(uploads, join(resolvedOutput, 'uploads'), { recursive: true })
  }

  await writeFile(join(resolvedOutput, 'config.js'), renderConfig(env), 'utf8')
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === invokedPath) {
  await buildSite()
  process.stdout.write('Built static site into dist.\n')
}

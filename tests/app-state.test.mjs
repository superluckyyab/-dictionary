import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const modulePath = join(root, 'app-state.js')

async function loadModule() {
  assert.equal(existsSync(modulePath), true, 'app-state.js must exist')
  delete globalThis.DictionaryAppState
  await import(`${pathToFileURL(modulePath).href}?test=${Date.now()}-${Math.random()}`)
  return globalThis.DictionaryAppState
}

test('updates local words only after persistence succeeds', async () => {
  const { persistWordChange } = await loadModule()
  const words = [{ id: 'e1', word: 'able', fav: 0, ai: null }]
  let saved

  const next = await persistWordChange(
    words,
    'e1',
    (word) => ({ ...word, fav: word.fav + 1 }),
    async (word) => { saved = word }
  )

  assert.equal(saved.fav, 1)
  assert.equal(next[0].fav, 1)
  assert.equal(words[0].fav, 0)
})

test('keeps previous local words when persistence fails', async () => {
  const { persistWordChange } = await loadModule()
  const words = [{ id: 'e1', word: 'able', fav: 0, ai: null }]

  await assert.rejects(
    persistWordChange(
      words,
      'e1',
      (word) => ({ ...word, fav: 1 }),
      async () => { throw new Error('database unavailable') }
    ),
    /database unavailable/
  )

  assert.equal(words[0].fav, 0)
})

test('clears collected words only after persistence succeeds', async () => {
  const { persistClearCollected } = await loadModule()
  const words = [
    { id: 'e1', fav: 2 },
    { id: 'e2', fav: 0 }
  ]
  let saved = false

  const next = await persistClearCollected(words, async () => { saved = true })

  assert.equal(saved, true)
  assert.deepEqual(next.map((word) => word.fav), [0, 0])
})

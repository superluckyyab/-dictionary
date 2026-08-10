import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const modulePath = join(root, 'migration-service.js')

async function loadModule() {
  assert.equal(existsSync(modulePath), true, 'migration-service.js must exist')
  delete globalThis.DictionaryMigrationModule
  await import(`${pathToFileURL(modulePath).href}?test=${Date.now()}-${Math.random()}`)
  return globalThis.DictionaryMigrationModule
}

test('deduplicates local words by normalized word and part of speech', async () => {
  const { normalizeLocalWords } = await loadModule()
  const result = normalizeLocalWords([
    { word: 'Able', pos: 'Adjective', fav: 1, def: '' },
    { word: ' able ', pos: 'adjective', fav: 2, def: 'Capable of doing something.' }
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].word, 'able')
  assert.equal(result[0].pos, 'adjective')
  assert.equal(result[0].fav, 3)
  assert.equal(result[0].def, 'Capable of doing something.')
})

test('reports malformed local browser data', async () => {
  const { inspectLocalData } = await loadModule()
  const storage = { getItem() { return '{not-json' } }

  assert.throws(() => inspectLocalData(storage), /could not be read/)
})

test('refuses import for a non-owner account', async () => {
  const { importOwnerData } = await loadModule()
  let called = false
  const dataService = {
    async findEntry() { called = true }
  }

  await assert.rejects(
    importOwnerData({ app_metadata: {} }, dataService, [{ word: 'able', pos: 'adjective' }]),
    /owner account is required/
  )
  assert.equal(called, false)
})

test('imports missing entries and saves owner state without deleting local data', async () => {
  const { inspectLocalData, importOwnerData } = await loadModule()
  const stored = JSON.stringify([{
    word: 'serendipity',
    pos: 'noun',
    level: 'C2',
    fav: 4,
    ai: { meaning: 'a happy accidental discovery' }
  }])
  const storage = {
    getItem() { return stored },
    removeItem() { throw new Error('local recovery data must remain') }
  }
  const local = inspectLocalData(storage)
  const calls = []
  const dataService = {
    async findEntry() { return null },
    async createEntry(entry) {
      calls.push(['create', entry])
      return { id: 'e-new', ...entry, fav: 0, ai: null }
    },
    async saveWordState(userId, entryId, state) {
      calls.push(['state', userId, entryId, state])
    }
  }

  const summary = await importOwnerData(
    { id: 'owner-1', app_metadata: { role: 'owner' } },
    dataService,
    local.words
  )

  assert.deepEqual(summary, { imported: 1, skipped: 0, failed: 0 })
  assert.equal(calls[0][0], 'create')
  assert.deepEqual(calls[1], [
    'state',
    'owner-1',
    'e-new',
    { fav: 4, ai: { meaning: 'a happy accidental discovery' } }
  ])
  assert.equal(storage.getItem('lexicon.words.v1'), stored)
})

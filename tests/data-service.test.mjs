import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const modulePath = join(root, 'data-service.js')

async function loadModule() {
  assert.equal(existsSync(modulePath), true, 'data-service.js must exist')
  delete globalThis.DictionaryDataModule
  await import(`${pathToFileURL(modulePath).href}?test=${Date.now()}-${Math.random()}`)
  return globalThis.DictionaryDataModule
}

test('merges user state into catalog entries', async () => {
  const { mergeDictionaryRows } = await loadModule()
  const rows = mergeDictionaryRows(
    [{
      id: 'e1',
      word: 'able',
      part_of_speech: 'adjective',
      cefr_level: 'A2',
      definition: 'capable',
      definition_url: 'https://example.com/able',
      audio_url: 'https://example.com/able.ogg'
    }],
    [{ entry_id: 'e1', collect_count: 2, ai_explanation: { meaning: 'capable' } }]
  )

  assert.deepEqual(rows[0], {
    id: 'e1',
    word: 'able',
    pos: 'adjective',
    level: 'A2',
    def: 'capable',
    defUrl: 'https://example.com/able',
    audioUrl: 'https://example.com/able.ogg',
    fav: 2,
    ai: { meaning: 'capable' }
  })
})

test('detects owner only from app metadata', async () => {
  const { isOwner } = await loadModule()
  assert.equal(isOwner({ app_metadata: { role: 'owner' } }), true)
  assert.equal(isOwner({ user_metadata: { role: 'owner' } }), false)
  assert.equal(isOwner({ app_metadata: { role: 'guest' } }), false)
})

test('normalizes catalog payload for Postgres', async () => {
  const { normalizeEntryPayload } = await loadModule()
  assert.deepEqual(normalizeEntryPayload({
    word: ' Able ',
    pos: 'Adjective',
    level: 'a2',
    def: ' capable ',
    defUrl: ' https://example.com/able ',
    audioUrl: ''
  }), {
    word: 'able',
    part_of_speech: 'adjective',
    cefr_level: 'A2',
    definition: 'capable',
    definition_url: 'https://example.com/able',
    audio_url: ''
  })
})

test('starts an anonymous Supabase session', async () => {
  const { createDataService } = await loadModule()
  let called = 0
  const expected = { user: { id: 'guest-1', is_anonymous: true } }
  const service = createDataService({
    auth: {
      async signInAnonymously() {
        called += 1
        return { data: expected, error: null }
      }
    }
  })

  assert.equal(await service.signInAnonymously(), expected)
  assert.equal(called, 1)
})

test('upserts state using the composite conflict key', async () => {
  const { createDataService } = await loadModule()
  const calls = []
  const stateRow = {
    user_id: 'u1',
    entry_id: 'e1',
    collect_count: 3,
    ai_explanation: { meaning: 'capable' }
  }
  const query = {
    upsert(payload, options) {
      calls.push({ payload, options })
      return this
    },
    select() {
      return this
    },
    async single() {
      return { data: stateRow, error: null }
    }
  }
  const service = createDataService({
    auth: {},
    from(table) {
      assert.equal(table, 'user_word_state')
      return query
    }
  })

  const result = await service.saveWordState('u1', 'e1', {
    fav: 3,
    ai: { meaning: 'capable' }
  })

  assert.deepEqual(calls[0], {
    payload: {
      user_id: 'u1',
      entry_id: 'e1',
      collect_count: 3,
      ai_explanation: { meaning: 'capable' }
    },
    options: { onConflict: 'user_id,entry_id' }
  })
  assert.deepEqual(result, stateRow)
})

test('propagates Supabase errors with operation context', async () => {
  const { createDataService } = await loadModule()
  const service = createDataService({
    auth: {
      async getSession() {
        return { data: null, error: new Error('network unavailable') }
      }
    }
  })

  await assert.rejects(service.restoreSession(), /restore session: network unavailable/)
})

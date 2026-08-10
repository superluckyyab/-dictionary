(function initializeDictionaryMigration(root) {
  const STORE_KEY = 'lexicon.words.v1'

  function wordKey(word) {
    return `${String(word.word || '').trim().toLowerCase()}|${String(word.pos || 'word').trim().toLowerCase()}`
  }

  function normalizeLocalWords(words) {
    const entries = new Map()
    for (const source of Array.isArray(words) ? words : []) {
      const word = String(source.word || '').trim().toLowerCase()
      if (!word) continue
      const pos = String(source.pos || 'word').trim().toLowerCase()
      const normalized = {
        word,
        pos,
        level: String(source.level || 'UNKNOWN').trim().toUpperCase(),
        def: String(source.def || '').trim(),
        defUrl: String(source.defUrl || '').trim(),
        audioUrl: String(source.audioUrl || '').trim(),
        fav: Math.max(0, Number(source.fav) || 0),
        ai: source.ai || null
      }
      const key = wordKey(normalized)
      const existing = entries.get(key)
      if (!existing) {
        entries.set(key, normalized)
        continue
      }

      existing.fav += normalized.fav
      if (!existing.def && normalized.def) existing.def = normalized.def
      if (!existing.defUrl && normalized.defUrl) existing.defUrl = normalized.defUrl
      if (!existing.audioUrl && normalized.audioUrl) existing.audioUrl = normalized.audioUrl
      if (!existing.ai && normalized.ai) existing.ai = normalized.ai
      if (existing.level === 'UNKNOWN' && normalized.level !== 'UNKNOWN') {
        existing.level = normalized.level
      }
    }
    return [...entries.values()]
  }

  function inspectLocalData(storage) {
    const localStorage = storage || root.localStorage
    const raw = localStorage && localStorage.getItem(STORE_KEY)
    if (!raw) return { found: false, words: [] }

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('stored value is not a list')
      const words = normalizeLocalWords(parsed)
      return { found: words.length > 0, words }
    } catch (error) {
      throw new Error(`Local dictionary data could not be read: ${error.message}`)
    }
  }

  async function importOwnerData(user, dataService, words) {
    if (!user || !user.app_metadata || user.app_metadata.role !== 'owner') {
      throw new Error('A permanent owner account is required for import')
    }

    const summary = { imported: 0, skipped: 0, failed: 0 }
    for (const localWord of normalizeLocalWords(words)) {
      try {
        let entry = await dataService.findEntry(localWord.word, localWord.pos)
        let changed = false
        if (!entry) {
          entry = await dataService.createEntry(localWord)
          changed = true
        }
        if (localWord.fav > 0 || localWord.ai) {
          await dataService.saveWordState(user.id, entry.id, {
            fav: localWord.fav,
            ai: localWord.ai
          })
          changed = true
        }
        if (changed) summary.imported += 1
        else summary.skipped += 1
      } catch (error) {
        summary.failed += 1
      }
    }
    return summary
  }

  const api = { inspectLocalData, importOwnerData, normalizeLocalWords }
  root.DictionaryMigrationModule = api
  root.DictionaryMigration = api
})(typeof window === 'undefined' ? globalThis : window)

(function initializeDictionaryAppState(root) {
  async function persistWordChange(words, id, transform, persist) {
    const current = words.find((word) => word.id === id)
    if (!current) return words
    const changed = transform(current)
    await persist(changed)
    return words.map((word) => word.id === id ? changed : word)
  }

  async function persistClearCollected(words, persist) {
    await persist()
    return words.map((word) => word.fav > 0 ? { ...word, fav: 0 } : word)
  }

  root.DictionaryAppState = { persistClearCollected, persistWordChange }
})(typeof window === 'undefined' ? globalThis : window)

(function initializeDictionarySupabase(root) {
  try {
    const config = root.__DICTIONARY_CONFIG__
    if (!config || !config.url || !config.publishableKey) {
      throw new Error('Supabase public configuration is missing')
    }
    if (!root.supabase || typeof root.supabase.createClient !== 'function') {
      throw new Error('Supabase browser client failed to load')
    }

    root.DictionarySupabase = {
      client: root.supabase.createClient(config.url, config.publishableKey),
      error: null
    }
  } catch (error) {
    root.DictionarySupabase = { client: null, error }
  }
})(window)

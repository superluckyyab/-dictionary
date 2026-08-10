(function initializeDictionaryData(root) {
  function contextualError(operation, error) {
    const message = error && error.message ? error.message : String(error || 'unknown error')
    return new Error(`${operation}: ${message}`)
  }

  function ensureResult(operation, result) {
    if (result && result.error) {
      throw contextualError(operation, result.error)
    }
    return result ? result.data : null
  }

  function isOwner(user) {
    return Boolean(user && user.app_metadata && user.app_metadata.role === 'owner')
  }

  function normalizeLevel(level) {
    const normalized = String(level || 'UNKNOWN').trim().toUpperCase()
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(normalized)
      ? normalized
      : 'UNKNOWN'
  }

  function normalizeEntryPayload(entry) {
    return {
      word: String(entry.word || '').trim().toLowerCase(),
      part_of_speech: String(entry.pos || entry.part_of_speech || 'word').trim().toLowerCase(),
      cefr_level: normalizeLevel(entry.level || entry.cefr_level),
      definition: String(entry.def || entry.definition || '').trim(),
      definition_url: String(entry.defUrl || entry.definition_url || '').trim(),
      audio_url: String(entry.audioUrl || entry.audio_url || '').trim()
    }
  }

  function mapEntry(row, state) {
    return {
      id: row.id,
      word: row.word,
      pos: row.part_of_speech,
      level: row.cefr_level,
      def: row.definition,
      defUrl: row.definition_url,
      audioUrl: row.audio_url,
      fav: state ? state.collect_count : 0,
      ai: state ? state.ai_explanation : null
    }
  }

  function mergeDictionaryRows(entries, states) {
    const stateByEntry = new Map((states || []).map((state) => [state.entry_id, state]))
    return (entries || []).map((entry) => mapEntry(entry, stateByEntry.get(entry.id)))
  }

  function createDataService(client) {
    if (!client) {
      throw new Error('Supabase client is required')
    }

    return {
      async restoreSession() {
        const result = await client.auth.getSession()
        const data = ensureResult('restore session', result)
        return data ? data.session : null
      },

      async signInAnonymously() {
        return ensureResult('anonymous sign in', await client.auth.signInAnonymously())
      },

      async signInWithEmail(email, redirectTo) {
        const normalizedEmail = String(email || '').trim().toLowerCase()
        if (!normalizedEmail) {
          throw new Error('email sign in: email is required')
        }
        return ensureResult('email sign in', await client.auth.signInWithOtp({
          email: normalizedEmail,
          options: { emailRedirectTo: redirectTo }
        }))
      },

      async signOut() {
        ensureResult('sign out', await client.auth.signOut())
      },

      onAuthStateChange(callback) {
        return client.auth.onAuthStateChange(callback)
      },

      async loadDictionary(userId) {
        const [entriesResult, statesResult] = await Promise.all([
          client
            .from('dictionary_entries')
            .select('*')
            .order('word', { ascending: true })
            .order('part_of_speech', { ascending: true }),
          client
            .from('user_word_state')
            .select('entry_id, collect_count, ai_explanation')
            .eq('user_id', userId)
        ])

        const entries = ensureResult('load dictionary entries', entriesResult)
        const states = ensureResult('load word state', statesResult)
        return mergeDictionaryRows(entries, states)
      },

      async findEntry(word, partOfSpeech) {
        const result = await client
          .from('dictionary_entries')
          .select('*')
          .ilike('word', String(word || '').trim().toLowerCase())
          .ilike('part_of_speech', String(partOfSpeech || 'word').trim().toLowerCase())
          .maybeSingle()
        const row = ensureResult('find dictionary entry', result)
        return row ? mapEntry(row, null) : null
      },

      async createEntry(entry) {
        const result = await client
          .from('dictionary_entries')
          .insert(normalizeEntryPayload(entry))
          .select('*')
          .single()
        return mapEntry(ensureResult('create dictionary entry', result), null)
      },

      async updateEntry(id, entry) {
        const result = await client
          .from('dictionary_entries')
          .update(normalizeEntryPayload(entry))
          .eq('id', id)
          .select('*')
          .single()
        return mapEntry(ensureResult('update dictionary entry', result), null)
      },

      async deleteEntry(id) {
        const result = await client
          .from('dictionary_entries')
          .delete()
          .eq('id', id)
        ensureResult('delete dictionary entry', result)
        return id
      },

      async saveWordState(userId, entryId, state) {
        const result = await client
          .from('user_word_state')
          .upsert({
            user_id: userId,
            entry_id: entryId,
            collect_count: Math.max(0, Number(state.fav) || 0),
            ai_explanation: state.ai || null
          }, { onConflict: 'user_id,entry_id' })
          .select('*')
          .single()
        return ensureResult('save word state', result)
      },

      async clearCollected(userId) {
        const result = await client
          .from('user_word_state')
          .update({ collect_count: 0 })
          .eq('user_id', userId)
          .gt('collect_count', 0)
        ensureResult('clear collected words', result)
      }
    }
  }

  const api = {
    createDataService,
    isOwner,
    mapEntry,
    mergeDictionaryRows,
    normalizeEntryPayload
  }

  root.DictionaryDataModule = api
  if (root.DictionarySupabase && root.DictionarySupabase.client) {
    root.DictionaryData = createDataService(root.DictionarySupabase.client)
  }
})(typeof window === 'undefined' ? globalThis : window)

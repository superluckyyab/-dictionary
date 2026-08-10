create index user_word_state_entry_id_idx
on public.user_word_state (entry_id);

drop policy dictionary_entries_insert_owner
on public.dictionary_entries;

drop policy dictionary_entries_update_owner
on public.dictionary_entries;

drop policy dictionary_entries_delete_owner
on public.dictionary_entries;

create policy dictionary_entries_insert_owner
on public.dictionary_entries
for insert
to authenticated
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'owner'
);

create policy dictionary_entries_update_owner
on public.dictionary_entries
for update
to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') = 'owner'
)
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'owner'
);

create policy dictionary_entries_delete_owner
on public.dictionary_entries
for delete
to authenticated
using (
  ((select auth.jwt())->'app_metadata'->>'role') = 'owner'
);

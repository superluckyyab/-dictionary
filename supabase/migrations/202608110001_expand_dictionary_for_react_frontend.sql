alter table public.dictionary_entries
  add column if not exists phonetic text,
  add column if not exists definitions jsonb not null default '[]'::jsonb;

update public.dictionary_entries
set
  word = lower(trim(word)),
  part_of_speech = lower(trim(part_of_speech)),
  definitions = case
    when jsonb_array_length(definitions) > 0 then definitions
    when definition <> '' then jsonb_build_array(
      jsonb_build_object('sense', definition, 'example', null)
    )
    else '[]'::jsonb
  end;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.dictionary_entries'::regclass
      and conname = 'dictionary_entries_definitions_array_check'
  ) then
    alter table public.dictionary_entries
      add constraint dictionary_entries_definitions_array_check
      check (jsonb_typeof(definitions) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.dictionary_entries'::regclass
      and conname = 'dictionary_entries_word_part_of_speech_key'
  ) then
    alter table public.dictionary_entries
      add constraint dictionary_entries_word_part_of_speech_key
      unique (word, part_of_speech);
  end if;
end
$$;

grant select on public.dictionary_entries to authenticated;
grant insert, update, delete on public.dictionary_entries to authenticated;
grant select, insert, update, delete on public.user_word_state to authenticated;

alter table public.dictionary_entries enable row level security;
alter table public.user_word_state enable row level security;

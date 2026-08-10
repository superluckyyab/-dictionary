-- Run with a privileged SQL connection after the migration.

select to_regclass('public.dictionary_entries') is not null
  as dictionary_entries_exists;

select to_regclass('public.user_word_state') is not null
  as user_word_state_exists;

select c.relname, c.relrowsecurity
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('dictionary_entries', 'user_word_state')
order by c.relname;

select count(*) > 0 as seed_rows_exist
from public.dictionary_entries;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('dictionary_entries', 'user_word_state')
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('dictionary_entries', 'user_word_state')
order by tablename, policyname;

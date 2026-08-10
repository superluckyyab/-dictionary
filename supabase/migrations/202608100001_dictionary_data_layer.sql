create table public.dictionary_entries (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  part_of_speech text not null,
  cefr_level text not null default 'UNKNOWN'
    check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'UNKNOWN')),
  definition text not null default '',
  definition_url text not null default '',
  audio_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index dictionary_entries_word_pos_key
on public.dictionary_entries (lower(word), lower(part_of_speech));

create table public.user_word_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.dictionary_entries(id) on delete cascade,
  collect_count integer not null default 0 check (collect_count >= 0),
  ai_explanation jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dictionary_entries_set_updated_at
before update on public.dictionary_entries
for each row execute function public.set_updated_at();

create trigger user_word_state_set_updated_at
before update on public.user_word_state
for each row execute function public.set_updated_at();

alter table public.dictionary_entries enable row level security;
alter table public.user_word_state enable row level security;

revoke all on table public.dictionary_entries from anon, authenticated;
revoke all on table public.user_word_state from anon, authenticated;

grant select, insert, update, delete
on table public.dictionary_entries
to authenticated;

grant select, insert, update, delete
on table public.user_word_state
to authenticated;

create policy dictionary_entries_select_authenticated
on public.dictionary_entries
for select
to authenticated
using (true);

create policy dictionary_entries_insert_owner
on public.dictionary_entries
for insert
to authenticated
with check ((select auth.jwt()->'app_metadata'->>'role') = 'owner');

create policy dictionary_entries_update_owner
on public.dictionary_entries
for update
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'owner')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'owner');

create policy dictionary_entries_delete_owner
on public.dictionary_entries
for delete
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'owner');

create policy user_word_state_select_own
on public.user_word_state
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_word_state_insert_own
on public.user_word_state
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy user_word_state_update_own
on public.user_word_state
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy user_word_state_delete_own
on public.user_word_state
for delete
to authenticated
using ((select auth.uid()) = user_id);

with seed as (
  select *
  from jsonb_to_recordset($seed$[{"word":"abandon","level":"B2","pos":"verb","def":"To leave somebody, especially somebody you are responsible for, with no intention of returning.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/abandon_1","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg"},{"word":"ability","level":"A2","pos":"noun","def":"The fact that somebody or something is able to do something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/ability_1","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abi/abili/ability__us_4.ogg"},{"word":"able","level":"A2","pos":"adjective","def":"Having the skill, strength, time, knowledge, etc. needed to do something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/able_1","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abl/able_/able__us_2.ogg"},{"word":"abolish","level":"C1","pos":"verb","def":"To officially end a law, a system or an institution.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/abolish","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/aboli/abolish__us_1.ogg"},{"word":"abortion","level":"C1","pos":"noun","def":"The deliberate ending of a pregnancy at an early stage.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/abortion","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/abort/abortion__us_1.ogg"},{"word":"about","level":"A1","pos":"adverb","def":"A little more or less than a particular number, amount, etc.; approximately.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/about_2","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg"},{"word":"about","level":"A1","pos":"preposition","def":"On the subject of somebody or something; in connection with somebody or something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/about_1","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg"},{"word":"above","level":"A1","pos":"adverb","def":"At or to a higher place or position than something else.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/above_2","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/above/above__us_2.ogg"},{"word":"accept","level":"A2","pos":"verb","def":"To agree to take something that is offered or given.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/accept","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/acc/accep/accept__us_1.ogg"},{"word":"access","level":"B1","pos":"noun","def":"The opportunity or right to use something or to see somebody or something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/access","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/acc/acces/access__us_1.ogg"},{"word":"accident","level":"A2","pos":"noun","def":"An unpleasant event that happens unexpectedly and causes injury or damage.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/accident","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/acc/accid/accident__us_1.ogg"},{"word":"accommodate","level":"C1","pos":"verb","def":"To provide somebody with a place to live or stay, or with the space they need.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/accommodate","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/acc/accom/accommodate__us_1.ogg"},{"word":"achieve","level":"B1","pos":"verb","def":"To succeed in reaching a particular goal by effort, skill or courage.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/achieve","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ach/achie/achieve__us_1.ogg"},{"word":"acid","level":"B2","pos":"noun","def":"A chemical, usually a liquid, that contains hydrogen and can dissolve some metals.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/acid","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aci/acid_/acid__us_1.ogg"},{"word":"across","level":"A1","pos":"preposition","def":"From one side to the other side of something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/across","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/acr/acros/across__us_1.ogg"},{"word":"active","level":"A2","pos":"adjective","def":"Always busy doing things, especially physical activities.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/active","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/act/activ/active__us_1.ogg"},{"word":"actual","level":"B1","pos":"adjective","def":"Used to emphasize that something is real or exact rather than imagined or guessed.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/actual","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/act/actua/actual__us_1.ogg"},{"word":"adapt","level":"B2","pos":"verb","def":"To change your behaviour in order to deal more successfully with a new situation.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/adapt","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ada/adapt/adapt__us_1.ogg"},{"word":"address","level":"A1","pos":"noun","def":"The details of where somebody lives or works and where letters can be sent.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/address","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/add/addre/address__us_1.ogg"},{"word":"admire","level":"B1","pos":"verb","def":"To respect somebody for what they are or for what they have done.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/admire","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/adm/admir/admire__us_1.ogg"},{"word":"adult","level":"A2","pos":"noun","def":"A fully grown person who is legally responsible for their actions.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/adult","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/adu/adult/adult__us_1.ogg"},{"word":"advantage","level":"A2","pos":"noun","def":"Something that helps you to be better or more successful than other people.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/advantage","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/adv/advan/advantage__us_1.ogg"},{"word":"adventure","level":"A2","pos":"noun","def":"An unusual, exciting or dangerous experience or journey.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/adventure","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/adv/adven/adventure__us_1.ogg"},{"word":"advice","level":"A1","pos":"noun","def":"An opinion or suggestion about what somebody should do in a situation.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/advice","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/adv/advic/advice__us_1.ogg"},{"word":"afford","level":"A2","pos":"verb","def":"To have enough money or time to be able to buy or to do something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/afford","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aff/affor/afford__us_1.ogg"},{"word":"afraid","level":"A1","pos":"adjective","def":"Feeling fear; frightened because you think you might be hurt or harmed.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/afraid","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/afr/afrai/afraid__us_1.ogg"},{"word":"against","level":"A2","pos":"preposition","def":"Opposed to or in disagreement with somebody or something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/against","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aga/again/against__us_1.ogg"},{"word":"agency","level":"B2","pos":"noun","def":"A business that provides a particular service for people or organizations.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/agency","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/age/agenc/agency__us_1.ogg"},{"word":"agenda","level":"B2","pos":"noun","def":"A list of items to be discussed at a meeting.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/agenda","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/age/agend/agenda__us_1.ogg"},{"word":"aggressive","level":"B2","pos":"adjective","def":"Behaving in an angry, threatening way, as if wanting to attack somebody.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/aggressive","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/agg/aggre/aggressive__us_1.ogg"},{"word":"agree","level":"A1","pos":"verb","def":"To have the same opinion as somebody; to say yes to a suggestion or request.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/agree","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/agr/agree/agree__us_1.ogg"},{"word":"ahead","level":"B1","pos":"adverb","def":"Further forward in space or time; in front of somebody or something.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/ahead","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ahe/ahead/ahead__us_1.ogg"},{"word":"aim","level":"B1","pos":"noun","def":"The purpose of doing something; what somebody is trying to achieve.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/aim","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aim/aim__/aim__us_1.ogg"},{"word":"alarm","level":"A2","pos":"noun","def":"A warning of danger, or a device that gives such a warning.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/alarm","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ala/alarm/alarm__us_1.ogg"},{"word":"alcohol","level":"A2","pos":"noun","def":"Drinks such as beer or wine that can make people drunk.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/alcohol","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/alc/alcoh/alcohol__us_1.ogg"},{"word":"alive","level":"A2","pos":"adjective","def":"Living; not dead.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/alive","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ali/alive/alive__us_1.ogg"},{"word":"ambiguous","level":"C1","pos":"adjective","def":"Having more than one possible meaning, so it is not clear which is intended.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/ambiguous","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/amb/ambig/ambiguous__us_1.ogg"},{"word":"anticipate","level":"C1","pos":"verb","def":"To expect something to happen and be ready for it in advance.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/anticipate","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/ant/antic/anticipate__us_1.ogg"},{"word":"benevolent","level":"C2","pos":"adjective","def":"Kind, helpful and generous towards other people.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/benevolent","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/b/ben/benev/benevolent__us_1.ogg"},{"word":"candid","level":"C1","pos":"adjective","def":"Saying what you think openly and honestly; not hiding your thoughts.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/candid","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/c/can/candi/candid__us_1.ogg"},{"word":"diligent","level":"C1","pos":"adjective","def":"Showing care and effort in your work or duties.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/diligent","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/d/dil/dilig/diligent__us_1.ogg"},{"word":"eloquent","level":"C2","pos":"adjective","def":"Able to use language and express your opinions well, especially in speaking.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/eloquent","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/e/elo/eloqu/eloquent__us_1.ogg"},{"word":"meticulous","level":"C2","pos":"adjective","def":"Paying careful attention to every small detail.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/meticulous","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/m/met/metic/meticulous__us_1.ogg"},{"word":"resilient","level":"C1","pos":"adjective","def":"Able to recover quickly after something difficult or unpleasant.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/resilient","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/r/res/resil/resilient__us_1.ogg"},{"word":"ubiquitous","level":"C2","pos":"adjective","def":"Seeming to be present, appearing, or found everywhere.","defUrl":"https://www.oxfordlearnersdictionaries.com/definition/english/ubiquitous","audioUrl":"https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/u/ubi/ubiqu/ubiquitous__us_1.ogg"}]$seed$::jsonb)
    as row_data(
      word text,
      level text,
      pos text,
      def text,
      "defUrl" text,
      "audioUrl" text
    )
)
insert into public.dictionary_entries (
  word,
  part_of_speech,
  cefr_level,
  definition,
  definition_url,
  audio_url
)
select
  word,
  pos,
  upper(level),
  coalesce(def, ''),
  coalesce("defUrl", ''),
  coalesce("audioUrl", '')
from seed
on conflict (lower(word), lower(part_of_speech))
do update set
  cefr_level = excluded.cefr_level,
  definition = excluded.definition,
  definition_url = excluded.definition_url,
  audio_url = excluded.audio_url;


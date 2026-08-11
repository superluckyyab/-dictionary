import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = execFileSync('git', ['show', 'HEAD:backend/app/seed.py'], {
  encoding: 'utf8',
});

const start = source.indexOf('SEED_WORDS = [');
const end = source.indexOf('\n]\n\n\ndef seed', start);

if (start === -1 || end === -1) {
  throw new Error('Could not locate SEED_WORDS in backend/app/seed.py');
}

const arraySource = source.slice(start + 'SEED_WORDS = '.length, end + 2);
const oxford = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
const audioBase = 'https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/';
const buildAudio = (word, number = 1) => {
  const normalized = word.toLowerCase().replaceAll('-', '').replaceAll(' ', '');
  const segment = (length) => `${normalized.slice(0, length)}_____`.slice(0, length);
  return `${audioBase}${normalized[0]}/${segment(3)}/${segment(5)}/${normalized}__us_${number}.ogg`;
};
const definitionUrl = (word, suffix = '') =>
  `${oxford}${word.toLowerCase().replaceAll(' ', '-')}${suffix}`;

const seedWords = Function(
  'OXFORD',
  'AUDIO_BASE',
  'build_audio',
  'def_url',
  `return ${arraySource}`,
)(oxford, audioBase, buildAudio, definitionUrl);

const quote = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;

const values = seedWords.map((item) => {
  const definitions = item.def ? [{ sense: item.def, example: null }] : [];
  return `  (${quote(item.word.toLowerCase())}, ${quote(item.pos.toLowerCase())}, ${quote(item.level || 'UNKNOWN')}, ${quote(item.def || '')}, ${quote(item.defUrl || '')}, ${quote(item.audioUrl || '')}, null, ${json(definitions)})`;
});

const sql = `begin;

insert into public.dictionary_entries (
  word,
  part_of_speech,
  cefr_level,
  definition,
  definition_url,
  audio_url,
  phonetic,
  definitions
)
values
${values.join(',\n')}
on conflict (word, part_of_speech) do update
set
  cefr_level = excluded.cefr_level,
  definition = excluded.definition,
  definition_url = excluded.definition_url,
  audio_url = excluded.audio_url,
  phonetic = coalesce(excluded.phonetic, public.dictionary_entries.phonetic),
  definitions = excluded.definitions,
  updated_at = now();

commit;
`;

const output = resolve('supabase/seed.sql');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sql, 'utf8');
console.log(`Generated ${output} with ${seedWords.length} entries.`);

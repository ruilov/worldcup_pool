// scripts/generate_matches_sql_from_csv.cjs
// Usage from root:
//   node scripts/generate_matches_sql_from_csv.cjs > supabase/seed_matches_from_csv.sql
//
// Then open supabase/seed_matches_from_csv.sql in an editor, copy, and run it
// in the Supabase SQL editor.
//
// Assumptions:
// - CSV header: match_number,team1_name,team2_name,kickoff_at
// - kickoff_at format: "6/11/26 15:00" (MM/DD/YY HH:MM) in US Eastern
// - World Cup 2026 runs June–July, so offset is always -04 (DST)

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'matches.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

function sqlString(str) {
  // Escape single quotes for SQL string literal
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Convert "6/11/26 15:00" (MM/DD/YY HH:MM) to "2026-06-11 15:00:00-04"
function toPostgresTimestamp(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const [datePart, timePart] = trimmed.split(/\s+/);
  if (!datePart || !timePart) {
    throw new Error(`Invalid kickoff_at format: "${raw}"`);
  }

  const [mmStr, ddStr, yyStr] = datePart.split(/[\/\-]/);
  const mm = parseInt(mmStr, 10);
  const dd = parseInt(ddStr, 10);
  const yy = parseInt(yyStr, 10);

  if (!mm || !dd || !yy) {
    throw new Error(`Invalid date part in kickoff_at: "${raw}"`);
  }

  const year = 2000 + yy; // "26" -> 2026
  const month = String(mm).padStart(2, '0');
  const day = String(dd).padStart(2, '0');

  // timePart is "HH:MM" in 24h format
  const time = timePart.trim(); // e.g. "15:00"

  // World Cup 2026 is June–July, which is always US Eastern Daylight Time (-04)
  // If you later need more precise offsets, adjust here.
  return `${year}-${month}-${day} ${time}:00-04`;
}

const contents = fs.readFileSync(csvPath, 'utf8');
const lines = contents.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

if (lines.length <= 1) {
  console.error('CSV appears to have no data rows.');
  process.exit(1);
}

// Remove header
const header = lines.shift();
// Optionally validate header columns here if you want

const rows = [];

for (const line of lines) {
  // Very simple CSV parsing: assumes no commas in team names.
  const parts = line.split(',').map((s) => s.trim());
  if (parts.length < 4) {
    console.warn(`Skipping malformed line: "${line}"`);
    continue;
  }

  const [matchNumberStr, team1Name, team2Name, kickoffRaw] = parts;

  const matchNumber = parseInt(matchNumberStr, 10);
  if (!matchNumber) {
    console.warn(`Skipping line with invalid match_number: "${line}"`);
    continue;
  }

  const ts = toPostgresTimestamp(kickoffRaw);

  rows.push({
    matchNumber,
    team1Name,
    team2Name,
    kickoffTs: ts,
  });
}

// Sort rows by match_number just to be deterministic
rows.sort((a, b) => a.matchNumber - b.matchNumber);

// Generate SQL
console.log('do $$');
console.log('declare');
console.log('  v_challenge_id uuid;');
console.log('begin');
console.log("  select id into v_challenge_id from public.challenges where code = 'default';");
console.log('  if v_challenge_id is null then');
console.log("    raise exception 'No challenge with code=default found';");
console.log('  end if;');
console.log('');
console.log('  -- Clear existing matches for this challenge');
console.log('  delete from public.matches where challenge_id = v_challenge_id;');
console.log('');
console.log('  -- Insert matches from CSV');
console.log('  insert into public.matches (');
console.log('    challenge_id,');
console.log('    team1_name,');
console.log('    team2_name,');
console.log('    kickoff_at,');
console.log('    status');
console.log('  ) values');

rows.forEach((row, idx) => {
  const isLast = idx === rows.length - 1;
  const valuesSql = [
    'v_challenge_id',
    sqlString(row.team1Name),
    sqlString(row.team2Name),
    row.kickoffTs ? sqlString(row.kickoffTs) + '::timestamptz' : 'null::timestamptz',
    "'scheduled'::match_status",
  ];

  console.log('    (' + valuesSql.join(', ') + ')' + (isLast ? ';' : ','));
});

console.log('');
console.log('end $$;');
console.log('$$;');

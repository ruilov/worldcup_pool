// scripts/generate_matches_sql_from_csv.cjs
// Usage from repo root:
//   node scripts/generate_matches_sql_from_csv.cjs
//
// This reads matches.csv and writes two files:
//   - supabase/seed_matches_from_csv.sql
//   - supabase/seed_contracts_from_csv.sql
//
// Then open the generated SQL files in an editor, copy, and run them
// in the Supabase SQL editor.
//
// Assumptions:
// - CSV header: match_number,team1_name,team2_name,kickoff_at
// - kickoff_at format: "6/11/26 15:00" (MM/DD/YY HH:MM) in US Eastern
// - World Cup 2026 runs June–July, so offset is always -04 (DST)

const fs = require('fs')
const path = require('path')

const csvPath = path.join(__dirname, '..', 'matches.csv')
const supabaseDir = path.join(__dirname, '..', 'supabase')
const matchesOutputPath = path.join(supabaseDir, 'seed_matches_from_csv.sql')
const contractsOutputPath = path.join(
  supabaseDir,
  'seed_contracts_from_csv.sql',
)

if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`)
  process.exit(1)
}

function sqlString(str) {
  // Escape single quotes for SQL string literal
  return "'" + String(str).replace(/'/g, "''") + "'"
}

// Convert "6/11/26 15:00" (MM/DD/YY HH:MM) to "2026-06-11 15:00:00-04"
function toPostgresTimestamp(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const [datePart, timePart] = trimmed.split(/\s+/)
  if (!datePart || !timePart) {
    throw new Error(`Invalid kickoff_at format: "${raw}"`)
  }

  const [mmStr, ddStr, yyStr] = datePart.split(/[\/\-]/)
  const mm = parseInt(mmStr, 10)
  const dd = parseInt(ddStr, 10)
  const yy = parseInt(yyStr, 10)

  if (!mm || !dd || !yy) {
    throw new Error(`Invalid date part in kickoff_at: "${raw}"`)
  }

  const year = 2000 + yy // "26" -> 2026
  const month = String(mm).padStart(2, '0')
  const day = String(dd).padStart(2, '0')

  // timePart is "HH:MM" in 24h format
  const time = timePart.trim() // e.g. "15:00"

  // World Cup 2026 is June–July, which is always US Eastern Daylight Time (-04)
  // If you later need more precise offsets, adjust here.
  return `${year}-${month}-${day} ${time}:00-04`
}

function parseCsvRows() {
  const contents = fs.readFileSync(csvPath, 'utf8')
  const lines = contents
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    throw new Error('CSV appears to have no data rows.')
  }

  // Remove header
  lines.shift()

  const rows = []

  for (const line of lines) {
    // Very simple CSV parsing: assumes no commas in team names.
    const parts = line.split(',').map(s => s.trim())
    if (parts.length < 4) {
      console.warn(`Skipping malformed line: "${line}"`)
      continue
    }

    const [matchNumberStr, team1Name, team2Name, kickoffRaw] = parts

    const matchNumber = parseInt(matchNumberStr, 10)
    if (!matchNumber) {
      console.warn(`Skipping line with invalid match_number: "${line}"`)
      continue
    }

    const ts = toPostgresTimestamp(kickoffRaw)

    rows.push({
      matchNumber,
      team1Name,
      team2Name,
      kickoffTs: ts,
    })
  }

  // Sort rows by match_number just to be deterministic
  rows.sort((a, b) => a.matchNumber - b.matchNumber)
  return rows
}

function buildMatchesSql(rows) {
  const lines = []
  lines.push('do $$')
  lines.push('declare')
  lines.push('  v_challenge_id uuid;')
  lines.push('begin')
  lines.push("  select id into v_challenge_id from public.challenges where code = 'default';")
  lines.push('  if v_challenge_id is null then')
  lines.push("    raise exception 'No challenge with code=default found';")
  lines.push('  end if;')
  lines.push('')
  lines.push('  -- Clear existing matches for this challenge')
  lines.push('  delete from public.matches where challenge_id = v_challenge_id;')
  lines.push('')
  lines.push('  -- Insert matches from CSV')
  lines.push('  insert into public.matches (')
  lines.push('    challenge_id,')
  lines.push('    match_number,')
  lines.push('    team1_name,')
  lines.push('    team2_name,')
  lines.push('    kickoff_at,')
  lines.push('    status')
  lines.push('  ) values')

  rows.forEach((row, idx) => {
    const isLast = idx === rows.length - 1
    const valuesSql = [
      'v_challenge_id',
      row.matchNumber,
      sqlString(row.team1Name),
      sqlString(row.team2Name),
      row.kickoffTs
        ? sqlString(row.kickoffTs) + '::timestamptz'
        : 'null::timestamptz',
      "'scheduled'::match_status",
    ]

    lines.push('    (' + valuesSql.join(', ') + ')' + (isLast ? ';' : ','))
  })

  lines.push('')
  lines.push('end;')
  lines.push('$$;')
  return lines.join('\n')
}

function buildContractsSql(rows) {
  const lines = []
  const values = rows
    .map(row => {
      const kickoffSql = row.kickoffTs
        ? sqlString(row.kickoffTs) + '::timestamptz'
        : 'null::timestamptz'
      return [
        `(${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'winner', 10)`,
        `(${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'goal_difference', 30)`,
        `(${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'score', 50)`,
      ].join(',\n    ')
    })
    .join(',\n    ')

  const cte = `with match_refs(team1_name, team2_name, kickoff_at, contract_type, blind) as (\n    values\n    ${values}\n  )`

  lines.push('do $$')
  lines.push('declare')
  lines.push('  v_challenge_id uuid;')
  lines.push('begin')
  lines.push("  select id into v_challenge_id from public.challenges where code = 'default';")
  lines.push('  if v_challenge_id is null then')
  lines.push("    raise exception 'No challenge with code=default found';")
  lines.push('  end if;')
  lines.push('')
  lines.push('  -- Clear existing contracts for these matches')
  lines.push(`  ${cte}`)
  lines.push('  delete from public.contracts c')
  lines.push('  using public.matches m')
  lines.push('  where c.match_id = m.id')
  lines.push('    and m.challenge_id = v_challenge_id')
  lines.push('    and exists (')
  lines.push('      select 1 from match_refs r')
  lines.push('      where r.team1_name = m.team1_name')
  lines.push('        and r.team2_name = m.team2_name')
  lines.push('        and m.kickoff_at is not distinct from r.kickoff_at')
  lines.push('    );')
  lines.push('')
  lines.push('  -- Insert default winner/goal_difference/score contracts for each match')
  lines.push(`  ${cte}`)
  lines.push('  insert into public.contracts (match_id, type, blind, status)')
  lines.push("  select m.id, r.contract_type::contract_type, r.blind, 'open'::contract_status")
  lines.push('  from public.matches m')
  lines.push('  join match_refs r')
  lines.push('    on r.team1_name = m.team1_name')
  lines.push('   and r.team2_name = m.team2_name')
  lines.push('   and m.kickoff_at is not distinct from r.kickoff_at')
  lines.push('  where m.challenge_id = v_challenge_id')
  lines.push('  order by m.kickoff_at;')
  lines.push('')
  lines.push('end;')
  lines.push('$$;')

  return lines.join('\n')
}

function main() {
  const rows = parseCsvRows()
  const matchesSql = buildMatchesSql(rows)
  const contractsSql = buildContractsSql(rows)

  fs.writeFileSync(matchesOutputPath, matchesSql + '\n', 'utf8')
  fs.writeFileSync(contractsOutputPath, contractsSql + '\n', 'utf8')

  console.log(`Wrote ${matchesOutputPath}`)
  console.log(`Wrote ${contractsOutputPath}`)
}

main()

// scripts/generate_matches_sql_from_csv.cjs
// Usage from repo root:
//   node scripts/generate_matches_sql_from_csv.cjs
//
// This reads matches.csv and writes two files:
//   - supabase/populate_matches.sql
//   - supabase/populate_contracts.sql
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
const matchesOutputPath = path.join(supabaseDir, 'populate_matches.sql')
const contractsOutputPath = path.join(supabaseDir, 'populate_contracts.sql')

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
  lines.push('begin')
  lines.push('  -- Clear existing matches')
  lines.push('  delete from public.matches;')
  lines.push('')
  lines.push('  -- Insert matches from CSV')
  lines.push('  insert into public.matches (')
  lines.push('    match_number,')
  lines.push('    team1_name,')
  lines.push('    team2_name,')
  lines.push('    kickoff_at')
  lines.push('  ) values')

  rows.forEach((row, idx) => {
    const isLast = idx === rows.length - 1
    const valuesSql = [
      row.matchNumber,
      sqlString(row.team1Name),
      sqlString(row.team2Name),
      row.kickoffTs ? sqlString(row.kickoffTs) + '::timestamptz' : 'null::timestamptz',
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
        `(${row.matchNumber}, ${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'winner', 10)`,
        `(${row.matchNumber}, ${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'goal_difference', 30)`,
        `(${row.matchNumber}, ${sqlString(row.team1Name)}, ${sqlString(row.team2Name)}, ${kickoffSql}, 'score', 50)`,
      ].join(',\n    ')
    })
    .join(',\n    ')

  const cte =
    `with match_refs(match_number, team1_name, team2_name, kickoff_at, contract_type, blind) as (\n    values\n    ${values}\n  )\n` +
    '  , target_matches as (\n' +
    '    select m.id as match_id, r.contract_type, r.blind\n' +
    '    from public.matches m\n' +
    '    join match_refs r on r.match_number = m.match_number\n' +
    '  )'

  lines.push('do $$')
  lines.push('declare')
  lines.push('  v_challenge_id uuid;')
  lines.push('begin')
  lines.push("  select id into v_challenge_id from public.challenges where code = 'default';")
  lines.push('  if v_challenge_id is null then')
  lines.push("    raise exception 'No challenge with code=default found';")
  lines.push('  end if;')
  lines.push('')
  lines.push('  -- Clear existing contracts (cascade removes contract_challenge_states)')
  lines.push('  delete from public.contracts;')
  lines.push('')
  lines.push('  -- Insert default winner/goal_difference/score contracts for each match')
  lines.push(`  ${cte}`)
  lines.push('  , inserted as (')
  lines.push('    insert into public.contracts (match_id, type)')
  lines.push('    select tm.match_id, tm.contract_type::contract_type')
  lines.push('    from target_matches tm')
  lines.push('    on conflict (match_id, type) do update set type = excluded.type')
  lines.push('    returning id as contract_id, match_id, type')
  lines.push('  )')
  lines.push('  insert into public.contract_challenge_states (contract_id, challenge_id, blind)')
  lines.push('  select i.contract_id, v_challenge_id, tm.blind')
  lines.push('  from inserted i')
  lines.push('  join target_matches tm on tm.match_id = i.match_id and tm.contract_type::contract_type = i.type')
  lines.push('  on conflict (contract_id, challenge_id) do update set blind = excluded.blind;')
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

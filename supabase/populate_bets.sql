-- supabase/seed_dummy_bets.sql
-- Seeds dummy users, challenge entries, and bets for the first 5 matches of the default challenge.
-- Run after matches/contracts are populated (e.g., via seed_matches_from_csv.sql and seed_contracts_from_csv.sql).

do $$
declare
  v_challenge_id uuid;
begin
  select id into v_challenge_id from public.challenges where code = 'default';
  if v_challenge_id is null then
    raise exception 'No challenge with code=default found';
  end if;

  -- Ensure users exist
  with names(display_name) as (
    values ('Alice'), ('Bob'), ('Charlie'), ('Dave'), ('Eve'), ('Frank')
  )
  insert into public.users (display_name)
  select n.display_name from names n
  on conflict (display_name) do nothing;

  -- Ensure challenge entries for these users in the default challenge
  with names(display_name) as (
    values ('Alice'), ('Bob'), ('Charlie'), ('Dave'), ('Eve'), ('Frank')
  ), user_ids as (
    select u.id, u.display_name from public.users u join names n on n.display_name = u.display_name
  )
  insert into public.challenge_entries (user_id, challenge_id, display_name)
  select u.id, v_challenge_id, u.display_name
  from user_ids u
  on conflict (challenge_id, user_id) do update set display_name = excluded.display_name;

  -- First 5 matches ordered by kickoff
  with first_matches as (
    select
      row_number() over (order by kickoff_at nulls last, created_at) as match_idx,
      m.id as match_id
    from public.matches m
    order by kickoff_at nulls last, created_at
    limit 5
  ),
  contract_map as (
    select fm.match_idx, c.id as contract_id, c.type
    from first_matches fm
    join public.contracts c on c.match_id = fm.match_id
  ),
  entry_map as (
    select display_name, id
    from public.challenge_entries
    where challenge_id = v_challenge_id
      and display_name in ('Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank')
  ),
  bet_rows as (
    select * from (values
      -- Match 1
      (1, 'winner',          'Alice',   'Mexico',                    20),
      (1, 'winner',          'Bob',     'South Africa',              15),
      (1, 'goal_difference', 'Charlie', '1',                         10),
      (1, 'score',           'Dave',    '2-1',                        5),
      -- Match 2
      (2, 'winner',          'Eve',     'South Korea',               12),
      (2, 'winner',          'Frank',   'UEFA playoff D winner',      8),
      (2, 'goal_difference', 'Alice',   '0',                          6),
      (2, 'score',           'Bob',     '1-1',                        4),
      -- Match 3
      (3, 'winner',          'Charlie', 'Canada',                    10),
      (3, 'goal_difference', 'Bob',     '1',                          7),
      (3, 'score',           'Eve',     '1-0',                        4),
      -- Match 4
      (4, 'winner',          'Frank',   'United States',             12),
      (4, 'winner',          'Alice',   'Paraguay',                   6),
      (4, 'goal_difference', 'Dave',    '0',                          5),
      (4, 'score',           'Charlie', '2-2',                        3),
      -- Match 5
      (5, 'winner',          'Bob',     'Qatar',                      9),
      (5, 'winner',          'Eve',     'Switzerland',               11),
      (5, 'goal_difference', 'Frank',   '-1',                         6),
      (5, 'score',           'Alice',   '0-1',                        5)
    ) as t(match_idx, contract_type, player_name, outcome, stake)
  )
  insert into public.bets (contract_id, challenge_entry_id, outcome, stake, status)
  select
    cm.contract_id,
    em.id,
    br.outcome,
    br.stake,
    'open'::bet_status
  from bet_rows br
  join contract_map cm
    on cm.match_idx = br.match_idx
   and cm.type = br.contract_type::contract_type
  join entry_map em
    on em.display_name = br.player_name;

end;
$$;

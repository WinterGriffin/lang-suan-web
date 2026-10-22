-- Read-only Staging QA for the Reports revenue-share amendment (3f71b17).
-- Run only through: npm run qa:staging:sql -- qa/sql/reports-revenue-share.sql
-- Uses existing Staging users and sales; writes nothing and ends in rollback.
-- Expected values are read directly from public.sales as the privileged role.
-- Observed values are public.sales_summary results under an existing user's
-- JWT claims and the authenticated role, exactly as the Reports page reads them.
-- Output is sanitized: check id, identity alias, status and aggregate detail.
begin;
set transaction read only;

-- 1. Identities. Any farm role grants Reports access (private.has_role).
-- user_a has the most active sales in the three selectable years; user_b is
-- an existing user whose farm permissions are disjoint from user_a.
with bounds as (
  select extract(year from now() at time zone 'Asia/Bangkok')::int as y
), active_sales as (
  select s.farm_id, count(*) as n
  from public.sales s, bounds b
  where s.deleted_at is null
    and s.sale_date >= make_date(b.y - 2, 1, 1)
    and s.sale_date < make_date(b.y + 1, 1, 1)
  group by s.farm_id
), members as (
  select r.user_id, array_agg(r.farm_id order by r.farm_id) as farms, coalesce(sum(a.n), 0) as sales_n
  from public.user_farm_roles r
  left join active_sales a on a.farm_id = r.farm_id
  group by r.user_id
), user_a as (
  select * from members order by sales_n desc, cardinality(farms) desc, user_id limit 1
), user_b as (
  select m.* from members m, user_a a
  where m.user_id <> a.user_id and not (m.farms && a.farms)
  order by m.sales_n desc, m.user_id limit 1
)
select
  set_config('qa.year', (select y::text from bounds), true),
  set_config('qa.user_a', coalesce((select user_id::text from user_a), ''), true),
  set_config('qa.user_b', coalesce((select user_id::text from user_b), ''), true),
  set_config('qa.farms_a', coalesce((select array_to_json(farms)::text from user_a), '[]'), true),
  set_config('qa.farms_b', coalesce((select array_to_json(farms)::text from user_b), '[]'), true),
  set_config('qa.target_for_a', coalesce((select s.farm_id::text from active_sales s, user_b b where s.farm_id = any(b.farms) order by s.n desc, s.farm_id limit 1), ''), true),
  set_config('qa.target_for_b', coalesce((select s.farm_id::text from active_sales s, user_a a where s.farm_id = any(a.farms) order by s.n desc, s.farm_id limit 1), ''), true);

-- 2. Expected aggregates from stored active sales, per farm and month,
-- over the three selectable years (Gregorian, start inclusive, end exclusive).
select
  set_config('qa.expected_a', (select coalesce(json_agg(e)::text, '[]') from (
    select s.farm_id, date_trunc('month', s.sale_date)::date as month_start,
      sum(s.total_amount) as total_amount, sum(s.owner_share) as owner_share,
      sum(s.worker_share) as worker_share, count(*) as sale_count
    from public.sales s
    where s.deleted_at is null
      and s.sale_date >= make_date(current_setting('qa.year')::int - 2, 1, 1)
      and s.sale_date < make_date(current_setting('qa.year')::int + 1, 1, 1)
      and s.farm_id in (select value::uuid from json_array_elements_text(current_setting('qa.farms_a')::json))
    group by 1, 2) e), true),
  set_config('qa.expected_b', (select coalesce(json_agg(e)::text, '[]') from (
    select s.farm_id, date_trunc('month', s.sale_date)::date as month_start,
      sum(s.total_amount) as total_amount, sum(s.owner_share) as owner_share,
      sum(s.worker_share) as worker_share, count(*) as sale_count
    from public.sales s
    where s.deleted_at is null
      and s.sale_date >= make_date(current_setting('qa.year')::int - 2, 1, 1)
      and s.sale_date < make_date(current_setting('qa.year')::int + 1, 1, 1)
      and s.farm_id in (select value::uuid from json_array_elements_text(current_setting('qa.farms_b')::json))
    group by 1, 2) e), true),
  set_config('qa.target_sales_for_a', (select count(*)::text from public.sales s where s.deleted_at is null
    and s.sale_date >= make_date(current_setting('qa.year')::int - 2, 1, 1)
    and s.sale_date < make_date(current_setting('qa.year')::int + 1, 1, 1)
    and s.farm_id = nullif(current_setting('qa.target_for_a'), '')::uuid), true),
  set_config('qa.target_sales_for_b', (select count(*)::text from public.sales s where s.deleted_at is null
    and s.sale_date >= make_date(current_setting('qa.year')::int - 2, 1, 1)
    and s.sale_date < make_date(current_setting('qa.year')::int + 1, 1, 1)
    and s.farm_id = nullif(current_setting('qa.target_for_b'), '')::uuid), true);

-- 3. Observed as user_a: one sales_summary call per selectable year, as the
-- Reports year filter does, plus an explicit filter on user_b's farm.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', coalesce(nullif(current_setting('qa.user_a'), ''), '00000000-0000-0000-0000-000000000000'), 'role', 'authenticated')::text, true);
select
  set_config('qa.observed_a', (select coalesce(json_agg(o)::text, '[]') from (
    select g.y, r.*
    from generate_series(current_setting('qa.year')::int - 2, current_setting('qa.year')::int) as g(y)
    cross join lateral public.sales_summary(make_date(g.y, 1, 1), make_date(g.y + 1, 1, 1), null) r) o), true),
  set_config('qa.foreign_rows_a', (select case when current_setting('qa.target_for_a') = '' then '' else (
    select count(*)::text from public.sales_summary(make_date(current_setting('qa.year')::int - 2, 1, 1),
      make_date(current_setting('qa.year')::int + 1, 1, 1), current_setting('qa.target_for_a')::uuid)) end), true);

-- 4. Observed as user_b, mirroring step 3.
select set_config('request.jwt.claims', json_build_object('sub', coalesce(nullif(current_setting('qa.user_b'), ''), '00000000-0000-0000-0000-000000000000'), 'role', 'authenticated')::text, true);
select
  set_config('qa.observed_b', (select coalesce(json_agg(o)::text, '[]') from (
    select g.y, r.*
    from generate_series(current_setting('qa.year')::int - 2, current_setting('qa.year')::int) as g(y)
    cross join lateral public.sales_summary(make_date(g.y, 1, 1), make_date(g.y + 1, 1, 1), null) r) o), true),
  set_config('qa.foreign_rows_b', (select case when current_setting('qa.target_for_b') = '' then '' else (
    select count(*)::text from public.sales_summary(make_date(current_setting('qa.year')::int - 2, 1, 1),
      make_date(current_setting('qa.year')::int + 1, 1, 1), current_setting('qa.target_for_b')::uuid)) end), true);
reset role;

-- 5. Sanitized report. No user, farm or sale identifiers leave the database.
with params as (
  select current_setting('qa.year')::int as y
), ids as (
  select * from (values
    ('user_a', current_setting('qa.user_a') <> '', current_setting('qa.farms_a')::json, current_setting('qa.expected_a')::json,
      current_setting('qa.observed_a')::json, current_setting('qa.foreign_rows_a'), current_setting('qa.target_sales_for_a')::bigint),
    ('user_b', current_setting('qa.user_b') <> '', current_setting('qa.farms_b')::json, current_setting('qa.expected_b')::json,
      current_setting('qa.observed_b')::json, current_setting('qa.foreign_rows_b'), current_setting('qa.target_sales_for_b')::bigint)
  ) as v(identity, present, farms, expected, observed, foreign_rows, target_sales)
), exp as (
  select i.identity, extract(year from e.month_start)::int as y, e.*
  from ids i cross join lateral json_to_recordset(i.expected)
    as e(farm_id uuid, month_start date, total_amount numeric, owner_share numeric, worker_share numeric, sale_count bigint)
), obs as (
  select i.identity, o.*
  from ids i cross join lateral json_to_recordset(i.observed)
    as o(y int, farm_id uuid, month_start date, total_amount numeric, owner_share numeric, worker_share numeric, sale_count bigint)
), years as (
  select i.identity, g.y from ids i cross join params p cross join generate_series(p.y - 2, p.y) as g(y)
), year_cmp as (
  select yr.identity, yr.y,
    coalesce((select sum(e.total_amount) from exp e where e.identity = yr.identity and e.y = yr.y), 0) as e_total,
    coalesce((select sum(o.total_amount) from obs o where o.identity = yr.identity and o.y = yr.y), 0) as o_total,
    coalesce((select sum(e.owner_share) from exp e where e.identity = yr.identity and e.y = yr.y), 0) as e_owner,
    coalesce((select sum(o.owner_share) from obs o where o.identity = yr.identity and o.y = yr.y), 0) as o_owner,
    coalesce((select sum(e.worker_share) from exp e where e.identity = yr.identity and e.y = yr.y), 0) as e_worker,
    coalesce((select sum(o.worker_share) from obs o where o.identity = yr.identity and o.y = yr.y), 0) as o_worker,
    coalesce((select sum(e.sale_count) from exp e where e.identity = yr.identity and e.y = yr.y), 0) as e_count,
    coalesce((select sum(o.sale_count) from obs o where o.identity = yr.identity and o.y = yr.y), 0) as o_count,
    (select count(*) from obs o where o.identity = yr.identity and o.y = yr.y
      and (o.month_start < make_date(yr.y, 1, 1) or o.month_start >= make_date(yr.y + 1, 1, 1))) as out_of_year
  from years yr
), cell_cmp as (
  select coalesce(e.identity, o.identity) as identity, count(*) as cells,
    count(*) filter (where e.farm_id is null or o.farm_id is null or e.total_amount <> o.total_amount
      or e.owner_share <> o.owner_share or e.worker_share <> o.worker_share or e.sale_count <> o.sale_count) as mismatches
  from exp e
  full join obs o on o.identity = e.identity and o.farm_id = e.farm_id and o.month_start = e.month_start and o.y = e.y
  group by 1
), exp_farm as (
  select identity, y, farm_id, sum(total_amount) as t, sum(owner_share) as ow, sum(worker_share) as wk from exp group by 1, 2, 3
), obs_farm as (
  select identity, y, farm_id, sum(total_amount) as t, sum(owner_share) as ow, sum(worker_share) as wk from obs group by 1, 2, 3
), farm_cmp as (
  select coalesce(e.identity, o.identity) as identity, count(*) as farm_years,
    count(*) filter (where e.farm_id is null or o.farm_id is null or e.t <> o.t or e.ow <> o.ow or e.wk <> o.wk) as mismatches
  from exp_farm e
  full join obs_farm o on o.identity = e.identity and o.y = e.y and o.farm_id = e.farm_id
  group by 1
), id_summary as (
  select i.identity, i.present, json_array_length(i.farms) as farm_count, i.foreign_rows, i.target_sales,
    (select coalesce(sum(c.e_count), 0) from year_cmp c where c.identity = i.identity) as sales_in_window,
    (select count(*) from obs o where o.identity = i.identity
      and o.farm_id not in (select value::uuid from json_array_elements_text(i.farms))) as unpermitted_rows,
    (select count(*) from obs o where o.identity = i.identity and o.owner_share + o.worker_share <> o.total_amount) as unbalanced_rows,
    coalesce((select c.cells from cell_cmp c where c.identity = i.identity), 0) as cells,
    coalesce((select c.mismatches from cell_cmp c where c.identity = i.identity), 0) as cell_mismatches,
    coalesce((select f.farm_years from farm_cmp f where f.identity = i.identity), 0) as farm_years,
    coalesce((select f.mismatches from farm_cmp f where f.identity = i.identity), 0) as farm_mismatches
  from ids i
), per_year as (
  select c.identity,
    string_agg(format('%s (BE %s): expected %s / observed %s', c.y, c.y + 543,
      to_char(c.e_total, 'FM999,999,999,990.00'), to_char(c.o_total, 'FM999,999,999,990.00')), '; ' order by c.y desc) as total_detail,
    string_agg(format('%s (BE %s): expected %s / observed %s', c.y, c.y + 543,
      to_char(c.e_owner, 'FM999,999,999,990.00'), to_char(c.o_owner, 'FM999,999,999,990.00')), '; ' order by c.y desc) as owner_detail,
    string_agg(format('%s (BE %s): expected %s / observed %s', c.y, c.y + 543,
      to_char(c.e_worker, 'FM999,999,999,990.00'), to_char(c.o_worker, 'FM999,999,999,990.00')), '; ' order by c.y desc) as worker_detail,
    string_agg(format('%s: expected %s sales / observed %s, rows outside year %s', c.y, c.e_count, c.o_count, c.out_of_year), '; ' order by c.y desc) as year_detail,
    bool_and(c.e_total = c.o_total) as total_ok, bool_and(c.e_owner = c.o_owner) as owner_ok,
    bool_and(c.e_worker = c.o_worker) as worker_ok, bool_and(c.e_count = c.o_count and c.out_of_year = 0) as year_ok
  from year_cmp c group by c.identity
), checks as (
  select 'QA-01' as check_id, s.identity, s.present, s.sales_in_window, p.total_ok as ok, p.total_detail as detail
  from id_summary s join per_year p using (identity)
  union all
  select 'QA-02', s.identity, s.present, s.sales_in_window, p.owner_ok and s.unbalanced_rows = 0,
    p.owner_detail || format('; rows where owner + worker <> total: %s', s.unbalanced_rows)
  from id_summary s join per_year p using (identity)
  union all
  select 'QA-03', s.identity, s.present, s.sales_in_window, p.worker_ok and s.unbalanced_rows = 0,
    p.worker_detail || format('; rows where owner + worker <> total: %s', s.unbalanced_rows)
  from id_summary s join per_year p using (identity)
  union all
  select 'QA-04', s.identity, s.present, s.sales_in_window, p.year_ok, p.year_detail
  from id_summary s join per_year p using (identity)
  union all
  select 'QA-05', s.identity, s.present, s.sales_in_window, s.cell_mismatches = 0,
    format('farm-month rows compared: %s; mismatches: %s', s.cells, s.cell_mismatches)
  from id_summary s
  union all
  select 'QA-06', s.identity, s.present, s.sales_in_window, s.farm_mismatches = 0,
    format('permitted farms: %s; farm-year totals compared: %s; mismatches: %s', s.farm_count, s.farm_years, s.farm_mismatches)
  from id_summary s
)
select c.check_id, c.identity,
  case when not c.present then 'BLOCKED'
       when c.sales_in_window = 0 then 'BLOCKED'
       when c.ok then 'PASS' else 'FAIL' end as status,
  case when not c.present and c.identity = 'user_a' then 'no existing user with a farm membership'
       when not c.present then 'no second existing user whose farm permissions are disjoint from user_a'
       when c.sales_in_window = 0 then 'no active sales in the permitted farms for the three selectable years'
       else c.detail end as detail
from checks c
union all
select 'QA-11', 'user_a+user_b',
  case when not a.present or not b.present then 'BLOCKED'
       when a.target_sales = 0 or b.target_sales = 0 or a.foreign_rows = '' or b.foreign_rows = '' then 'BLOCKED'
       when a.unpermitted_rows = 0 and b.unpermitted_rows = 0 and a.foreign_rows = '0' and b.foreign_rows = '0' then 'PASS'
       else 'FAIL' end,
  case when not a.present or not b.present then 'no two existing users with disjoint farm permissions'
       when a.target_sales = 0 or b.target_sales = 0 or a.foreign_rows = '' or b.foreign_rows = ''
         then 'each identity''s foreign farm must hold active sales in the window to demonstrate isolation'
       else format('user_a: %s permitted farms, unpermitted rows visible %s, explicit foreign-farm filter rows %s (foreign farm holds %s active sales); user_b: %s permitted farms, unpermitted rows visible %s, explicit foreign-farm filter rows %s (foreign farm holds %s active sales)',
         a.farm_count, a.unpermitted_rows, a.foreign_rows, a.target_sales, b.farm_count, b.unpermitted_rows, b.foreign_rows, b.target_sales) end
from id_summary a, id_summary b
where a.identity = 'user_a' and b.identity = 'user_b'
order by 1, 2;

rollback;

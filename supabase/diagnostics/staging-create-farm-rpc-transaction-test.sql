-- Diagnostic only: create through the real RPC, then roll the Farm, role and
-- audit records back. No data is retained.
begin;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', r.user_id, 'role', 'authenticated')::text,
  true
)
from (
  select user_id
  from public.user_farm_roles
  where role = 'ADMIN'
  order by farm_id, user_id
  limit 1
) r;
set local role authenticated;

select (public.create_farm(
  '00000000-0000-4000-8000-000000000099'::uuid,
  'Rollback diagnostic',
  'Rollback diagnostic',
  'OWNER'::public.share_input,
  false
)).id as created_farm_id;

rollback;

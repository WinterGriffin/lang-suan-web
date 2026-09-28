-- Diagnostic only: exercise the production RPC under an existing ADMIN JWT
-- context, then roll every write and audit entry back.
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

select (public.update_farm(
  f.id,
  f.version,
  f.name,
  f.produce_name,
  f.default_share_input,
  f.has_workers,
  f.is_active
)).version as returned_version
from public.farms f
join public.user_farm_roles r on r.farm_id = f.id and r.role = 'ADMIN'
order by f.id
limit 1;

rollback;

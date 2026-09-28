-- Read-only diagnostic for the Staging Farm RPC contract.
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments, p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('create_farm', 'update_farm')
order by p.proname;

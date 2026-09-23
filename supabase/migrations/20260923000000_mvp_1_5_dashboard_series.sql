-- MVP 1.5 dashboard chart series. RLS remains authoritative because this is
-- SECURITY INVOKER and reads only rows available to the calling user.
begin;

create function public.sales_daily_summary(p_start date, p_end date, p_farm_id uuid default null)
returns table(sale_date date, total_amount numeric, owner_share numeric, worker_share numeric, sale_count bigint)
language sql stable security invoker set search_path=''
as $$
  select s.sale_date, sum(s.total_amount), sum(s.owner_share), sum(s.worker_share), count(*)
  from public.sales s
  where s.sale_date >= p_start
    and s.sale_date < p_end
    and (p_farm_id is null or s.farm_id = p_farm_id)
  group by s.sale_date
  order by s.sale_date;
$$;

revoke all on function public.sales_daily_summary(date, date, uuid) from public, anon;
grant execute on function public.sales_daily_summary(date, date, uuid) to authenticated;
commit;

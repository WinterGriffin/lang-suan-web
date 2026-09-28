-- LangSuan MVP 1.6: reversible sale removal and worker-aware Farm defaults.
-- Existing Farms retain their current behaviour; existing Sales remain active.
begin;

alter table public.farms add column has_workers boolean not null default true;
alter table public.sales add column deleted_at timestamptz;
alter table public.sales add column deleted_by uuid references public.profiles(id) on delete restrict;
create index sales_active_farm_date on public.sales(farm_id, sale_date desc, id) where deleted_at is null;
create index sales_active_date on public.sales(sale_date desc, id) where deleted_at is null;

-- Deleted sales are invisible to normal reads, including direct detail navigation.
drop policy sales_member on public.sales;
create policy sales_member on public.sales for select to authenticated
 using(deleted_at is null and private.has_role(farm_id,array['ADMIN','EDITOR','VIEWER']::public.farm_role[]));

alter table public.audit_logs drop constraint audit_logs_action_check;
alter table public.audit_logs add constraint audit_logs_action_check check(action in ('INSERT','UPDATE','DELETE','SOFT_DELETE'));

create or replace function private.capture_audit() returns trigger language plpgsql security definer set search_path=''
as $$
declare o jsonb; n jsonb; f uuid; k jsonb; audit_action text:=tg_op;
begin
 if tg_op<>'INSERT' then o=to_jsonb(old); end if;
 if tg_op<>'DELETE' then n=to_jsonb(new); end if;
 if tg_table_name='sales' and tg_op='UPDATE' and old.deleted_at is null and new.deleted_at is not null then audit_action='SOFT_DELETE'; end if;
 if tg_table_name='farms' then f=coalesce((n->>'id')::uuid,(o->>'id')::uuid); k=jsonb_build_object('id',f);
 elsif tg_table_name='user_farm_roles' then f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('farm_id',f,'user_id',coalesce(n->>'user_id',o->>'user_id'));
 else f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('id',coalesce(n->>'id',o->>'id'));
 end if;
 insert into public.audit_logs(farm_id,table_name,record_key,action,actor_id,old_data,new_data)
 values(f,tg_table_name,k,audit_action,auth.uid(),o,n);
 if tg_op='DELETE' then return old; end if; return new;
end; $$;

-- Add has_workers without changing current farm data.  The extra argument is
-- required on updates so a stale form cannot silently overwrite this setting.
drop function public.create_farm(uuid,text,text,public.share_input);
create function public.create_farm(p_id uuid,p_name text,p_produce_name text,p_share_input public.share_input,p_has_workers boolean default true)
returns public.farms language plpgsql security definer set search_path=''
as $$ declare u uuid:=auth.uid(); r public.farms; begin
 if u is null or not exists(select 1 from public.profiles where id=u) then raise exception using errcode='42501',message='PROFILE_REQUIRED'; end if;
 insert into public.farms(id,name,produce_name,default_share_input,has_workers,created_by,updated_by)
 values(p_id,btrim(p_name),btrim(p_produce_name),p_share_input,coalesce(p_has_workers,true),u,u) returning * into r;
 insert into public.user_farm_roles(farm_id,user_id,role,created_by,updated_by) values(r.id,u,'ADMIN',u,u); return r;
end; $$;

drop function public.update_farm(uuid,integer,text,text,public.share_input,boolean);
create function public.update_farm(p_id uuid,p_expected_version integer,p_name text,p_produce_name text,p_share_input public.share_input,p_has_workers boolean,p_is_active boolean)
returns public.farms language plpgsql security definer set search_path=''
as $$ declare r public.farms; begin
 select * into r from public.farms where id=p_id for update;
 if not found or not private.has_role(p_id,array['ADMIN']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if p_expected_version is null or r.version<>p_expected_version then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
 update public.farms set name=btrim(p_name),produce_name=btrim(p_produce_name),default_share_input=p_share_input,has_workers=p_has_workers,is_active=p_is_active,version=version+1,updated_at=now(),updated_by=auth.uid() where id=p_id returning * into r;
 return r;
end; $$;

-- Lock the Farm before mutation, matching save_sale and membership changes.
create function public.soft_delete_sale(p_id uuid,p_expected_version integer)
returns public.sales language plpgsql security definer set search_path=''
as $$ declare r public.sales; begin
 select s.* into r from public.sales s join public.farms f on f.id=s.farm_id where s.id=p_id for update of f,s;
 if not found or not private.has_role(r.farm_id,array['ADMIN','EDITOR']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if r.deleted_at is not null then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if p_expected_version is null or r.version<>p_expected_version then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
 update public.sales set deleted_at=now(),deleted_by=auth.uid(),updated_at=now(),updated_by=auth.uid(),version=version+1 where id=p_id returning * into r;
 return r;
end; $$;

-- An edit may never revive a deleted sale.  New-sale defaults are supplied by
-- the UI; historical snapshots remain untouched.
create or replace function public.save_sale(p_id uuid,p_farm_id uuid,p_sale_date date,p_weight_kg numeric,p_unit_price numeric,p_input_share numeric,p_expected_version integer default null)
returns public.sales language plpgsql security definer set search_path=''
as $$ declare f public.farms; r public.sales; begin
 select * into f from public.farms where id=p_farm_id for update;
 if not found or not private.has_role(p_farm_id,array['ADMIN','EDITOR']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if p_id is null or p_sale_date is null or p_sale_date>(now() at time zone 'Asia/Bangkok')::date then raise exception using errcode='22023',message='INVALID_DATE_OR_ID'; end if;
 if p_weight_kg is null or not(p_weight_kg>0 and p_weight_kg<=9999999.999) or p_weight_kg<>round(p_weight_kg,3) or p_unit_price is null or not(p_unit_price>0 and p_unit_price<=999999.99) or p_unit_price<>round(p_unit_price,2) or p_input_share is null or not(p_input_share>=0 and p_input_share<=99999999999999.99) or p_input_share<>round(p_input_share,2) then raise exception using errcode='22023',message='INVALID_NUMERIC_INPUT'; end if;
 select * into r from public.sales where id=p_id for update;
 if found then
  if r.farm_id<>p_farm_id or r.deleted_at is not null then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
  if p_expected_version is null then if r.version=1 and r.created_by=auth.uid() and r.sale_date=p_sale_date and r.weight_kg=p_weight_kg and r.unit_price=p_unit_price and r.input_share=p_input_share then return r; end if; raise exception using errcode='40001',message='DUPLICATE_REQUEST_CONFLICT'; end if;
  if r.version<>p_expected_version then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
  update public.sales set sale_date=p_sale_date,weight_kg=p_weight_kg,unit_price=p_unit_price,input_share=p_input_share,version=version+1,updated_by=auth.uid(),updated_at=now() where id=p_id returning * into r;
 else
  if p_expected_version is not null then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
  if not f.is_active then raise exception using errcode='22023',message='FARM_INACTIVE'; end if;
  insert into public.sales(id,farm_id,sale_date,produce_name_snapshot,share_input_type,weight_kg,unit_price,input_share,created_by,updated_by) values(p_id,p_farm_id,p_sale_date,f.produce_name,f.default_share_input,p_weight_kg,p_unit_price,p_input_share,auth.uid(),auth.uid()) returning * into r;
 end if; return r;
end; $$;

create or replace function public.sales_summary(p_start date,p_end date,p_farm_id uuid default null)
returns table(farm_id uuid,month_start date,total_amount numeric,weight_kg numeric,average_price numeric,sale_count bigint,owner_share numeric,worker_share numeric)
language sql stable security invoker set search_path=''
as $$ select s.farm_id,date_trunc('month',s.sale_date)::date,sum(s.total_amount),sum(s.weight_kg),sum(s.total_amount)/nullif(sum(s.weight_kg),0),count(*),sum(s.owner_share),sum(s.worker_share) from public.sales s where s.deleted_at is null and s.sale_date>=p_start and s.sale_date<p_end and (p_farm_id is null or s.farm_id=p_farm_id) group by s.farm_id,date_trunc('month',s.sale_date)::date; $$;

create or replace function public.sales_daily_summary(p_start date,p_end date,p_farm_id uuid default null)
returns table(sale_date date,total_amount numeric,owner_share numeric,worker_share numeric,sale_count bigint)
language sql stable security invoker set search_path=''
as $$ select s.sale_date,sum(s.total_amount),sum(s.owner_share),sum(s.worker_share),count(*) from public.sales s where s.deleted_at is null and s.sale_date>=p_start and s.sale_date<p_end and (p_farm_id is null or s.farm_id=p_farm_id) group by s.sale_date order by s.sale_date; $$;

revoke all on function public.create_farm(uuid,text,text,public.share_input,boolean),public.update_farm(uuid,integer,text,text,public.share_input,boolean,boolean),public.soft_delete_sale(uuid,integer) from public,anon;
grant execute on function public.create_farm(uuid,text,text,public.share_input,boolean),public.update_farm(uuid,integer,text,text,public.share_input,boolean,boolean),public.soft_delete_sale(uuid,integer) to authenticated;
commit;

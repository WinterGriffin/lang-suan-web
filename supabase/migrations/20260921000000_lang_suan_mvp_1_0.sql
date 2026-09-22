-- หลังสวน (Lang Suan) MVP 1.0 | PostgreSQL 15+ / Supabase
-- Fresh-project migration. Canonical reference: docs/schema.sql.
-- Apply as the migration owner, never through the browser or to production for fixtures.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create type public.share_input as enum ('OWNER','WORKER');
create type public.farm_role as enum ('ADMIN','EDITOR','VIEWER');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check (length(btrim(display_name)) between 1 and 120),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.farms (
 id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 120),
 produce_name text not null check(length(btrim(produce_name)) between 1 and 120),
 default_share_input public.share_input not null default 'OWNER', is_active boolean not null default true,
 version integer not null default 1 check(version>0), created_by uuid not null references public.profiles(id) on delete restrict,
 updated_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_farm_roles (
 farm_id uuid not null references public.farms(id) on delete restrict, user_id uuid not null references public.profiles(id) on delete restrict,
 role public.farm_role not null, created_by uuid not null references public.profiles(id) on delete restrict,
 updated_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(farm_id,user_id)
);
create table public.sales (
 id uuid primary key, farm_id uuid not null references public.farms(id) on delete restrict,
 sale_date date not null default (now() at time zone 'Asia/Bangkok')::date,
 produce_name_snapshot text not null check(length(btrim(produce_name_snapshot)) between 1 and 120), share_input_type public.share_input not null,
 weight_kg numeric(10,3) not null check(weight_kg>0 and weight_kg<=9999999.999), unit_price numeric(8,2) not null check(unit_price>0 and unit_price<=999999.99),
 input_share numeric(16,2) not null check(input_share>=0 and input_share<=99999999999999.99),
 total_amount numeric(16,2) generated always as (round(weight_kg*unit_price,2)) stored,
 owner_share numeric(16,2) generated always as (case when share_input_type='OWNER' then input_share else round(weight_kg*unit_price,2)-input_share end) stored,
 worker_share numeric(16,2) generated always as (case when share_input_type='WORKER' then input_share else round(weight_kg*unit_price,2)-input_share end) stored,
 version integer not null default 1 check(version>0), created_by uuid not null references public.profiles(id) on delete restrict,
 updated_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint sale_positive_total check(total_amount>0), constraint sale_valid_share check(input_share<=total_amount and owner_share>=0 and worker_share>=0), constraint sale_balanced check(owner_share+worker_share=total_amount)
);
create table public.audit_logs (
 id bigint generated always as identity primary key, farm_id uuid not null references public.farms(id) on delete restrict,
 table_name text not null check(table_name in ('farms','sales','user_farm_roles')), record_key jsonb not null,
 action text not null check(action in ('INSERT','UPDATE','DELETE')), actor_id uuid references public.profiles(id) on delete restrict,
 old_data jsonb, new_data jsonb, occurred_at timestamptz not null default now(), transaction_id bigint not null default txid_current(), check(old_data is not null or new_data is not null)
);
create index sales_farm_date on public.sales(farm_id,sale_date desc,id);
create index sales_date on public.sales(sale_date desc,id);
create index roles_user_farm on public.user_farm_roles(user_id,farm_id);
create index audit_farm_time on public.audit_logs(farm_id,occurred_at desc,id desc);
create index audit_record_key on public.audit_logs using gin(record_key);

create function private.has_role(p_farm uuid,p_roles public.farm_role[]) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.user_farm_roles r where r.farm_id=p_farm and r.user_id=(select auth.uid()) and r.role=any(p_roles)); $$;
revoke all on function private.has_role(uuid,public.farm_role[]) from public;
grant execute on function private.has_role(uuid,public.farm_role[]) to authenticated;
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.user_farm_roles enable row level security;
alter table public.sales enable row level security;
alter table public.audit_logs enable row level security;
create policy profiles_self on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy farms_member on public.farms for select to authenticated using(private.has_role(id,array['ADMIN','EDITOR','VIEWER']::public.farm_role[]));
create policy memberships_self_or_admin on public.user_farm_roles for select to authenticated using(user_id=(select auth.uid()) or private.has_role(farm_id,array['ADMIN']::public.farm_role[]));
create policy sales_member on public.sales for select to authenticated using(private.has_role(farm_id,array['ADMIN','EDITOR','VIEWER']::public.farm_role[]));
create policy audit_member on public.audit_logs for select to authenticated using(private.has_role(farm_id,array['ADMIN','EDITOR','VIEWER']::public.farm_role[]) and (table_name='sales' or private.has_role(farm_id,array['ADMIN']::public.farm_role[])));
revoke all on public.profiles,public.farms,public.user_farm_roles,public.sales,public.audit_logs from public,anon,authenticated;
grant select on public.profiles,public.farms,public.user_farm_roles,public.sales,public.audit_logs to authenticated;

create function private.capture_audit() returns trigger language plpgsql security definer set search_path=''
as $$
declare o jsonb; n jsonb; f uuid; k jsonb;
begin
 if tg_op<>'INSERT' then o=to_jsonb(old); end if; if tg_op<>'DELETE' then n=to_jsonb(new); end if;
 if tg_table_name='farms' then f=coalesce((n->>'id')::uuid,(o->>'id')::uuid); k=jsonb_build_object('id',f);
 elsif tg_table_name='user_farm_roles' then f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('farm_id',f,'user_id',coalesce(n->>'user_id',o->>'user_id'));
 else f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('id',coalesce(n->>'id',o->>'id')); end if;
 insert into public.audit_logs(farm_id,table_name,record_key,action,actor_id,old_data,new_data) values(f,tg_table_name,k,tg_op,auth.uid(),o,n);
 if tg_op='DELETE' then return old; end if; return new;
end; $$;
revoke all on function private.capture_audit() from public;
create trigger audit_farms after insert or update or delete on public.farms for each row execute function private.capture_audit();
create trigger audit_sales after insert or update or delete on public.sales for each row execute function private.capture_audit();
create trigger audit_members after insert or update or delete on public.user_farm_roles for each row execute function private.capture_audit();
create function private.deny_audit_mutation() returns trigger language plpgsql set search_path=''
as $$ begin raise exception using errcode='42501',message='AUDIT_IMMUTABLE'; end; $$;
revoke all on function private.deny_audit_mutation() from public;
create trigger audit_immutable before update or delete or truncate on public.audit_logs for each statement execute function private.deny_audit_mutation();

create function public.ensure_profile(p_display_name text) returns public.profiles language plpgsql security definer set search_path=''
as $$ declare u uuid:=auth.uid(); r public.profiles; begin
 if u is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
 if p_display_name is null or length(btrim(p_display_name)) not between 1 and 120 then raise exception using errcode='22023',message='INVALID_PROFILE_NAME'; end if;
 insert into public.profiles(id,display_name) values(u,btrim(p_display_name)) on conflict(id) do nothing;
 select * into r from public.profiles where id=u; return r;
end; $$;
create function public.create_farm(p_id uuid,p_name text,p_produce_name text,p_share_input public.share_input) returns public.farms language plpgsql security definer set search_path=''
as $$ declare u uuid:=auth.uid(); r public.farms; begin
 if u is null or not exists(select 1 from public.profiles where id=u) then raise exception using errcode='42501',message='PROFILE_REQUIRED'; end if;
 insert into public.farms(id,name,produce_name,default_share_input,created_by,updated_by) values(p_id,btrim(p_name),btrim(p_produce_name),p_share_input,u,u) returning * into r;
 insert into public.user_farm_roles(farm_id,user_id,role,created_by,updated_by) values(r.id,u,'ADMIN',u,u); return r;
end; $$;
create function public.update_farm(p_id uuid,p_expected_version integer,p_name text,p_produce_name text,p_share_input public.share_input,p_is_active boolean) returns public.farms language plpgsql security definer set search_path=''
as $$ declare r public.farms; begin
 select * into r from public.farms where id=p_id for update;
 if not found or not private.has_role(p_id,array['ADMIN']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if p_expected_version is null or r.version<>p_expected_version then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
 update public.farms set name=btrim(p_name),produce_name=btrim(p_produce_name),default_share_input=p_share_input,is_active=p_is_active,version=version+1,updated_at=now(),updated_by=auth.uid() where id=p_id returning * into r; return r;
end; $$;
create function public.set_farm_member(p_farm_id uuid,p_user_id uuid,p_role public.farm_role) returns void language plpgsql security definer set search_path=''
as $$ declare old_role public.farm_role; begin
 perform 1 from public.farms where id=p_farm_id for update;
 if not private.has_role(p_farm_id,array['ADMIN']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 select role into old_role from public.user_farm_roles where farm_id=p_farm_id and user_id=p_user_id;
 if old_role='ADMIN' and (p_role is null or p_role<>'ADMIN') and (select count(*) from public.user_farm_roles where farm_id=p_farm_id and role='ADMIN')<=1 then raise exception using errcode='22023',message='LAST_ADMIN_REQUIRED'; end if;
 if p_role is null then delete from public.user_farm_roles where farm_id=p_farm_id and user_id=p_user_id;
 else insert into public.user_farm_roles(farm_id,user_id,role,created_by,updated_by) values(p_farm_id,p_user_id,p_role,auth.uid(),auth.uid()) on conflict(farm_id,user_id) do update set role=excluded.role,updated_by=auth.uid(),updated_at=now(); end if;
end; $$;
create function public.save_sale(p_id uuid,p_farm_id uuid,p_sale_date date,p_weight_kg numeric,p_unit_price numeric,p_input_share numeric,p_expected_version integer default null) returns public.sales language plpgsql security definer set search_path=''
as $$ declare f public.farms; r public.sales; begin
 select * into f from public.farms where id=p_farm_id for update;
 if not found or not private.has_role(p_farm_id,array['ADMIN','EDITOR']::public.farm_role[]) then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
 if p_id is null or p_sale_date is null or p_sale_date>(now() at time zone 'Asia/Bangkok')::date then raise exception using errcode='22023',message='INVALID_DATE_OR_ID'; end if;
 if p_weight_kg is null or not(p_weight_kg>0 and p_weight_kg<=9999999.999) or p_weight_kg<>round(p_weight_kg,3) or p_unit_price is null or not(p_unit_price>0 and p_unit_price<=999999.99) or p_unit_price<>round(p_unit_price,2) or p_input_share is null or not(p_input_share>=0 and p_input_share<=99999999999999.99) or p_input_share<>round(p_input_share,2) then raise exception using errcode='22023',message='INVALID_NUMERIC_INPUT'; end if;
 select * into r from public.sales where id=p_id for update;
 if found then
  if r.farm_id<>p_farm_id then raise exception using errcode='42501',message='NOT_FOUND_OR_FORBIDDEN'; end if;
  if p_expected_version is null then if r.version=1 and r.created_by=auth.uid() and r.sale_date=p_sale_date and r.weight_kg=p_weight_kg and r.unit_price=p_unit_price and r.input_share=p_input_share then return r; end if; raise exception using errcode='40001',message='DUPLICATE_REQUEST_CONFLICT'; end if;
  if r.version<>p_expected_version then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
  update public.sales set sale_date=p_sale_date,weight_kg=p_weight_kg,unit_price=p_unit_price,input_share=p_input_share,version=version+1,updated_by=auth.uid(),updated_at=now() where id=p_id returning * into r;
 else
  if p_expected_version is not null then raise exception using errcode='40001',message='VERSION_CONFLICT'; end if;
  if not f.is_active then raise exception using errcode='22023',message='FARM_INACTIVE'; end if;
  insert into public.sales(id,farm_id,sale_date,produce_name_snapshot,share_input_type,weight_kg,unit_price,input_share,created_by,updated_by) values(p_id,p_farm_id,p_sale_date,f.produce_name,f.default_share_input,p_weight_kg,p_unit_price,p_input_share,auth.uid(),auth.uid()) returning * into r;
 end if; return r;
end; $$;
create function public.sales_summary(p_start date,p_end date,p_farm_id uuid default null)
returns table(farm_id uuid,month_start date,total_amount numeric,weight_kg numeric,average_price numeric,sale_count bigint,owner_share numeric,worker_share numeric)
language sql stable security invoker set search_path=''
as $$ select s.farm_id,date_trunc('month',s.sale_date)::date,sum(s.total_amount),sum(s.weight_kg),sum(s.total_amount)/nullif(sum(s.weight_kg),0),count(*),sum(s.owner_share),sum(s.worker_share) from public.sales s where s.sale_date>=p_start and s.sale_date<p_end and (p_farm_id is null or s.farm_id=p_farm_id) group by s.farm_id,date_trunc('month',s.sale_date)::date; $$;
revoke all on function public.ensure_profile(text),public.create_farm(uuid,text,text,public.share_input),public.update_farm(uuid,integer,text,text,public.share_input,boolean),public.set_farm_member(uuid,uuid,public.farm_role),public.save_sale(uuid,uuid,date,numeric,numeric,numeric,integer),public.sales_summary(date,date,uuid) from public,anon;
grant execute on function public.ensure_profile(text),public.create_farm(uuid,text,text,public.share_input),public.update_farm(uuid,integer,text,text,public.share_input,boolean),public.set_farm_member(uuid,uuid,public.farm_role),public.save_sale(uuid,uuid,date,numeric,numeric,numeric,integer),public.sales_summary(date,date,uuid) to authenticated;
commit;

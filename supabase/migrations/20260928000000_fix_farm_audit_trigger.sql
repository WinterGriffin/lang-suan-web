-- The shared audit trigger serves Farms, Sales and memberships.  Check a
-- soft-delete transition through JSON payloads so Farm updates never access a
-- Sales-only record field.
create or replace function private.capture_audit() returns trigger language plpgsql security definer set search_path=''
as $$
declare o jsonb; n jsonb; f uuid; k jsonb; audit_action text:=tg_op;
begin
 if tg_op<>'INSERT' then o=to_jsonb(old); end if;
 if tg_op<>'DELETE' then n=to_jsonb(new); end if;
 if tg_table_name='sales' and tg_op='UPDATE'
    and (o->>'deleted_at') is null and (n->>'deleted_at') is not null then
  audit_action='SOFT_DELETE';
 end if;
 if tg_table_name='farms' then f=coalesce((n->>'id')::uuid,(o->>'id')::uuid); k=jsonb_build_object('id',f);
 elsif tg_table_name='user_farm_roles' then f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('farm_id',f,'user_id',coalesce(n->>'user_id',o->>'user_id'));
 else f=coalesce((n->>'farm_id')::uuid,(o->>'farm_id')::uuid); k=jsonb_build_object('id',coalesce(n->>'id',o->>'id'));
 end if;
 insert into public.audit_logs(farm_id,table_name,record_key,action,actor_id,old_data,new_data)
 values(f,tg_table_name,k,audit_action,auth.uid(),o,n);
 if tg_op='DELETE' then return old; end if; return new;
end; $$;

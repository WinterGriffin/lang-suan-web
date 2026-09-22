-- Rollback-only test harness for a disposable Supabase project.
-- Canonical test source: docs/verification.sql. Never run against production.
begin;
insert into auth.users(id,aud,role,email) values
 ('a0000000-0000-4000-8000-000000000001','authenticated','authenticated','admin@example.test'),
 ('a0000000-0000-4000-8000-000000000002','authenticated','authenticated','editor@example.test'),
 ('a0000000-0000-4000-8000-000000000003','authenticated','authenticated','viewer@example.test'),
 ('a0000000-0000-4000-8000-000000000004','authenticated','authenticated','outsider@example.test');
insert into public.profiles(id,display_name) values
 ('a0000000-0000-4000-8000-000000000001','Admin fixture'),('a0000000-0000-4000-8000-000000000002','Editor fixture'),
 ('a0000000-0000-4000-8000-000000000003','Viewer fixture'),('a0000000-0000-4000-8000-000000000004','Outsider fixture');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.create_farm('b0000000-0000-4000-8000-000000000001','Test Farm','Oil palm','OWNER');
select public.set_farm_member('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','EDITOR');
select public.set_farm_member('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','VIEWER');
select public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,9000,null);
select public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,9000,null);
do $$ begin
 if not exists(select 1 from public.sales where id='c0000000-0000-4000-8000-000000000001' and total_amount=15190 and owner_share=9000 and worker_share=6190 and version=1) then raise exception 'T02 failed'; end if;
 if (select count(*) from public.audit_logs where table_name='sales' and record_key @> '{"id":"c0000000-0000-4000-8000-000000000001"}')<>1 then raise exception 'T12 failed'; end if;
 if not exists(select 1 from public.sales_summary(current_date-30,current_date+1,null)) then raise exception 'ADMIN report read failed'; end if;
 begin perform public.save_sale('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001',current_date-2,1,1,2,null); raise exception 'T06 failed'; exception when check_violation then null; end;
 begin perform public.save_sale('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001',current_date-2,1.0001,1,0,null); raise exception 'T07 failed'; exception when invalid_parameter_value then null; end;
 begin perform public.set_farm_member('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001',null); raise exception 'T18 failed'; exception when invalid_parameter_value then null; end;
end $$;
select public.update_farm('b0000000-0000-4000-8000-000000000001',1,'Test Farm','Renamed produce','WORKER',true);
select public.save_sale('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001',current_date-2,1.005,1,0,null);
select public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,8000,1);
do $$ begin
 if not exists(select 1 from public.sales where id='c0000000-0000-4000-8000-000000000002' and total_amount=1.01 and share_input_type='WORKER' and worker_share=0 and owner_share=1.01) then raise exception 'T03/T04 failed'; end if;
 if not exists(select 1 from public.sales where id='c0000000-0000-4000-8000-000000000001' and share_input_type='OWNER' and produce_name_snapshot='Oil palm' and version=2 and owner_share=8000) then raise exception 'T09/T10 failed'; end if;
 begin perform public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,7000,1); raise exception 'T11 failed'; exception when serialization_failure then null; end;
 begin update public.sales set input_share=1 where id='c0000000-0000-4000-8000-000000000001'; raise exception 'T16 failed'; exception when insufficient_privilege then null; end;
 begin update public.farms set name='Bypass' where id='b0000000-0000-4000-8000-000000000001'; raise exception 'farm direct write failed'; exception when insufficient_privilege then null; end;
 begin update public.user_farm_roles set role='VIEWER' where farm_id='b0000000-0000-4000-8000-000000000001'; raise exception 'membership direct write failed'; exception when insufficient_privilege then null; end;
 begin update public.profiles set display_name='Bypass' where id='a0000000-0000-4000-8000-000000000001'; raise exception 'profile direct write failed'; exception when insufficient_privilege then null; end;
 begin delete from public.audit_logs; raise exception 'T17 delete failed'; exception when insufficient_privilege then null; end;
 begin update public.audit_logs set action='UPDATE'; raise exception 'T17 update failed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,8100,2);
do $$ begin
 begin perform public.update_farm('b0000000-0000-4000-8000-000000000001',2,'Forbidden','Forbidden','OWNER',true); raise exception 'EDITOR Farm update failed'; exception when insufficient_privilege then null; end;
 if not exists(select 1 from public.sales_summary(current_date-30,current_date+1,null)) then raise exception 'EDITOR report read failed'; end if;
 if exists(select 1 from public.audit_logs where table_name<>'sales') then raise exception 'EDITOR admin Audit leak'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.sales)<>2 then raise exception 'VIEWER read failed'; end if;
 if not exists(select 1 from public.sales_summary(current_date-30,current_date+1,null)) then raise exception 'VIEWER report read failed'; end if;
 begin perform public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,8100,3); raise exception 'T14 failed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.sales) or exists(select 1 from public.farms) or exists(select 1 from public.audit_logs) then raise exception 'T15 row leak'; end if;
 if exists(select 1 from public.sales_summary(current_date-30,current_date+1,null)) then raise exception 'T15 report leak'; end if;
 begin perform public.save_sale('c0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001',current_date-2,1,1,0,null); raise exception 'Outsider write failed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;

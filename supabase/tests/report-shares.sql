-- Rollback-only Reports revenue-share fixture for a disposable local/development database.
-- Never run against production or a shared database.
begin;

insert into auth.users(id,aud,role,email) values
 ('e1000000-0000-4000-8000-000000000001','authenticated','authenticated','share-a@example.test'),
 ('e1000000-0000-4000-8000-000000000002','authenticated','authenticated','share-b@example.test');
insert into public.profiles(id,display_name) values
 ('e1000000-0000-4000-8000-000000000001','Share fixture A'),
 ('e1000000-0000-4000-8000-000000000002','Share fixture B');
insert into public.farms(id,name,produce_name,default_share_input,created_by,updated_by) values
 ('f1000000-0000-4000-8000-000000000001','Share farm A','Palm','OWNER','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001'),
 ('f1000000-0000-4000-8000-000000000002','Share farm B','Palm','WORKER','e1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002');
insert into public.user_farm_roles(farm_id,user_id,role,created_by,updated_by) values
 ('f1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','VIEWER','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001'),
 ('f1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002','VIEWER','e1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002');
-- Farm A: 100.00 total with owner 60.00, 50.00 total with owner 0.00, and one soft-deleted sale.
insert into public.sales(id,farm_id,sale_date,produce_name_snapshot,share_input_type,weight_kg,unit_price,input_share,created_by,updated_by) values
 (gen_random_uuid(),'f1000000-0000-4000-8000-000000000001','2024-03-05','Palm','OWNER',10.000,10.00,60.00,'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001'),
 (gen_random_uuid(),'f1000000-0000-4000-8000-000000000001','2024-03-20','Palm','OWNER',5.000,10.00,0.00,'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001'),
 ('51000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','2024-03-21','Palm','OWNER',1.000,999.00,999.00,'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001'),
 (gen_random_uuid(),'f1000000-0000-4000-8000-000000000002','2024-03-05','Palm','WORKER',1.000,70.00,70.00,'e1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002');
update public.sales set deleted_at=now(),deleted_by='e1000000-0000-4000-8000-000000000001' where id='51000000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare s record; n bigint;
begin
 select count(*) into n from public.sales_summary('2024-01-01','2025-01-01',null);
 if n<>1 then raise exception 'R01 cross-farm isolation failed: % rows',n; end if;
 select * into s from public.sales_summary('2024-01-01','2025-01-01',null);
 if s.farm_id<>'f1000000-0000-4000-8000-000000000001' then raise exception 'R01 wrong farm visible'; end if;
 if s.total_amount<>150.00 or s.owner_share<>60.00 or s.worker_share<>90.00 or s.sale_count<>2 then
  raise exception 'R02 share totals failed: % % % %',s.total_amount,s.owner_share,s.worker_share,s.sale_count; end if;
 if exists(select 1 from public.sales_summary('2024-01-01','2025-01-01','f1000000-0000-4000-8000-000000000002')) then
  raise exception 'R03 explicit foreign farm filter leaked'; end if;
 if exists(select 1 from public.sales_summary('2023-01-01','2024-01-01',null)) then raise exception 'R04 empty year returned rows'; end if;
end $$;

rollback;

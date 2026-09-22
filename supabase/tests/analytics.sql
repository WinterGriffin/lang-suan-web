-- Rollback-only analytics fixture for a disposable local/development database.
-- Never run against production or a shared database.
begin;

insert into auth.users(id,aud,role,email) values
 ('e0000000-0000-4000-8000-000000000001','authenticated','authenticated','analytics@example.test');
insert into public.profiles(id,display_name) values
 ('e0000000-0000-4000-8000-000000000001','Analytics fixture');
insert into public.farms(id,name,produce_name,default_share_input,created_by,updated_by) values
 ('f0000000-0000-4000-8000-000000000001','Pagination fixture','Palm','OWNER','e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001'),
 ('f0000000-0000-4000-8000-000000000002','Weighted fixture','Palm','OWNER','e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001');
insert into public.user_farm_roles(farm_id,user_id,role,created_by,updated_by) values
 ('f0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','VIEWER','e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001'),
 ('f0000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','VIEWER','e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001');
insert into public.sales(id,farm_id,sale_date,produce_name_snapshot,share_input_type,weight_kg,unit_price,input_share,created_by,updated_by)
select gen_random_uuid(),'f0000000-0000-4000-8000-000000000001',current_date-1,'Palm','OWNER',1.000,1.00,0.00,'e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001' from generate_series(1,1001);
insert into public.sales(id,farm_id,sale_date,produce_name_snapshot,share_input_type,weight_kg,unit_price,input_share,created_by,updated_by) values
 (gen_random_uuid(),'f0000000-0000-4000-8000-000000000002',current_date-1,'Palm','OWNER',1.000,100.00,0.00,'e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001'),
 (gen_random_uuid(),'f0000000-0000-4000-8000-000000000002',current_date-1,'Palm','OWNER',9.000,10.00,0.00,'e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001'),
 (gen_random_uuid(),'f0000000-0000-4000-8000-000000000002','2024-02-29','Palm','OWNER',1.000,10.00,0.00,'e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001'),
 (gen_random_uuid(),'f0000000-0000-4000-8000-000000000002','2023-12-31','Palm','OWNER',1.000,20.00,0.00,'e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare c record; n bigint; s record;
begin
 select * into s from public.sales_summary(current_date-2,current_date+1,'f0000000-0000-4000-8000-000000000001');
 if s.sale_count<>1001 or s.total_amount<>1001 or s.weight_kg<>1001 then raise exception 'T24 aggregate pagination bias'; end if;
 select sale_date,id into c from public.sales where farm_id='f0000000-0000-4000-8000-000000000001' order by sale_date desc,id desc offset 24 limit 1;
 select count(*) into n from public.sales where farm_id='f0000000-0000-4000-8000-000000000001' and (sale_date<c.sale_date or (sale_date=c.sale_date and id<c.id));
 if n<>976 then raise exception 'T24 keyset continuation failed: %',n; end if;
 if exists(select 1 from public.sales_summary(current_date-40,current_date-39,null)) then raise exception 'T19 empty period failed'; end if;
 select * into s from public.sales_summary(current_date-2,current_date+1,'f0000000-0000-4000-8000-000000000002');
 if s.average_price<>19 then raise exception 'T20 weighted average failed: %',s.average_price; end if;
 select * into s from public.sales_summary('2024-02-01','2024-03-01','f0000000-0000-4000-8000-000000000002');
 if s.sale_count<>1 or s.total_amount<>10 then raise exception 'T21 leap-year boundary failed'; end if;
 select * into s from public.sales_summary('2023-12-01','2024-01-01','f0000000-0000-4000-8000-000000000002');
 if s.sale_count<>1 or s.total_amount<>20 then raise exception 'T21 cross-year boundary failed'; end if;
end $$;
reset role;
rollback;

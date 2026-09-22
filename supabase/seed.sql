-- DEVELOPMENT / DISPOSABLE ONLY. `supabase db reset` may apply this file.
-- Never run this on production or a shared environment. It creates deterministic test identities and sales.
begin;
insert into auth.users(id,aud,role,email) values
 ('a0000000-0000-4000-8000-000000000001','authenticated','authenticated','admin@example.test'),
 ('a0000000-0000-4000-8000-000000000002','authenticated','authenticated','editor@example.test'),
 ('a0000000-0000-4000-8000-000000000003','authenticated','authenticated','viewer@example.test'),
 ('a0000000-0000-4000-8000-000000000004','authenticated','authenticated','outsider@example.test');
insert into public.profiles(id,display_name) values
 ('a0000000-0000-4000-8000-000000000001','Admin fixture'),
 ('a0000000-0000-4000-8000-000000000002','Editor fixture'),
 ('a0000000-0000-4000-8000-000000000003','Viewer fixture'),
 ('a0000000-0000-4000-8000-000000000004','Outsider fixture');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.create_farm('b0000000-0000-4000-8000-000000000001','ฟาร์มตัวอย่าง','ปาล์มน้ำมัน','OWNER');
select public.set_farm_member('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','EDITOR');
select public.set_farm_member('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','VIEWER');
select public.save_sale('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',current_date-2,2450,6.20,9000,null);
select public.save_sale('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001',current_date-1,1.005,1,0,null);
reset role;
commit;

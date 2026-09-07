begin;
select set_config('test.activity_id',gen_random_uuid()::text,true);
select set_config('test.activity_product','activity-test-'||gen_random_uuid()::text,true);
insert into public.products(id,data) values(current_setting('test.activity_product'),jsonb_build_object('id',current_setting('test.activity_product'),'isHidden',false,'isActive',true));
set local role service_role;
do $$ declare r jsonb; begin
 r:=public.record_site_activity(current_setting('test.activity_id')::uuid,repeat('a',64),repeat('b',64),repeat('c',64),'product_view','products',current_setting('test.activity_product'),null);
 if r->>'recorded'<>'true' then raise exception 'Event not recorded'; end if;
 perform public.record_site_activity(current_setting('test.activity_id')::uuid,repeat('a',64),repeat('b',64),repeat('c',64),'product_view','products',current_setting('test.activity_product'),null);
 if (select count(*) from public.site_activity_events where event_id=current_setting('test.activity_id')::uuid)<>1 then raise exception 'Duplicate event counted'; end if;
 update public.products set data=data||'{"isHidden":true}'::jsonb where id=current_setting('test.activity_product');
 r:=public.record_site_activity(gen_random_uuid(),repeat('a',64),repeat('b',64),repeat('c',64),'affiliate_click','products',current_setting('test.activity_product'),'amazon');
 if r->>'unavailable'<>'true' then raise exception 'Hidden product counted'; end if;
end $$;
reset role;
do $$ begin
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','email',(select email from public.admin_users where active and role='owner' limit 1))::text,true);
end $$;
set local role authenticated;
do $$ declare r jsonb; begin
 r:=public.site_activity_report(7);
 if r->'totals'->>'product_views' is null or r->'sales'<>'null'::jsonb then raise exception 'Report invalid'; end if;
 if not exists(select 1 from jsonb_array_elements(r->'products') x where x->>'product_id'=current_setting('test.activity_product') and x->>'views'='1') then raise exception 'Saved event missing from report'; end if;
 begin
  perform public.record_site_activity(gen_random_uuid(),repeat('a',64),repeat('b',64),repeat('c',64),'page_view','home',null,null);
  raise exception 'Client can write raw metrics';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","email":"nonadmin-test@example.invalid"}',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.site_activity_events) then raise exception 'Nonadmin can read events'; end if;
 begin perform public.site_activity_report(7); raise exception 'Nonadmin can read report';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.site_activity_report(7); raise exception 'Anonymous can read report';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;

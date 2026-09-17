-- Existing products must be merged before the category-validation trigger runs.
-- The previous INSERT ... ON CONFLICT implementation fired the INSERT trigger
-- against the partial patch first, so a valid patch such as {"image": "..."}
-- was rejected for not redundantly including the product category.
create or replace function public.patch_catalog_product(p_id text, p_patch jsonb)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
  v_data jsonb;
begin
  update public.products
     set data = coalesce(data, '{}'::jsonb)
                || jsonb_build_object('id', p_id)
                || coalesce(p_patch, '{}'::jsonb),
         updated_at = now()
   where id = p_id
   returning data into v_data;

  if found then
    return v_data;
  end if;

  insert into public.products (id, data, updated_at)
  values (
    p_id,
    jsonb_build_object('id', p_id) || coalesce(p_patch, '{}'::jsonb),
    now()
  )
  returning data into v_data;

  return v_data;
end;
$function$;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.enable_realtime(_table text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Set REPLICA IDENTITY FULL
  EXECUTE format(
    'ALTER TABLE public.%I REPLICA IDENTITY FULL;',
    _table
  );

  -- Add to supabase_realtime publication
  EXECUTE format(
    'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;',
    _table
  );

  RETURN 'success';
END;$function$
;

CREATE OR REPLACE FUNCTION private.has_admin_permission(_user uuid, _client_id integer, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$select exists (
    select 1 from public.permissions p
    where p.user_id = _user
    and p.level = 'ADMIN'
    and (
      (p.client_id is not null and p.client_id = _client_id)
      or
      (p.project_id is not null and p.project_id = _project_id)
    )
  );$function$
;

CREATE OR REPLACE FUNCTION private."storage.objects.get_object_by_id"(object_id uuid)
 RETURNS storage.objects
 LANGUAGE sql
AS $function$select *
  from storage.objects
  where id = object_id
  limit 1;$function$
;


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION triggers.clients_after_actions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
  return coalesce(new, old);
end;$function$
;



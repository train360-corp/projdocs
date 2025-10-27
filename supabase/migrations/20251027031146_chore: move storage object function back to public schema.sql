drop function if exists "private"."storage.objects.get_object_by_id"(object_id uuid);


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public."storage.objects.get_object_by_id"(object_id uuid)
 RETURNS storage.objects
 LANGUAGE sql
AS $function$select *
  from storage.objects
  where id = object_id
  limit 1;$function$
;



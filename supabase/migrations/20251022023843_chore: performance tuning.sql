drop policy "all: admin" on "public"."permissions";

create policy "all: admin"
on "public"."permissions"
as permissive
for all
to authenticated
using (( SELECT private.has_admin_permission(( SELECT auth.uid() AS uid), permissions.client_id, permissions.project_id) AS has_admin_permission));




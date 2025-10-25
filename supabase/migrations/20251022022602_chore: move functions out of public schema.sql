ALTER FUNCTION public.enable_realtime(text) SET SCHEMA private;
ALTER FUNCTION public.has_admin_permission(uuid, integer, uuid) SET SCHEMA private;
ALTER FUNCTION public."storage.objects.get_object_by_id"(uuid) SET SCHEMA private;

ALTER FUNCTION public.clients_after_actions() SET SCHEMA triggers;
ALTER FUNCTION public.clients_before_actions() SET SCHEMA triggers;
ALTER FUNCTION public.files_before_actions() SET SCHEMA triggers;
ALTER FUNCTION public.files_versions_after_actions() SET SCHEMA triggers;
ALTER FUNCTION public.files_versions_before_actions() SET SCHEMA triggers;
ALTER FUNCTION public.projects_after_actions() SET SCHEMA triggers;
ALTER FUNCTION public.projects_before_actions() SET SCHEMA triggers;
ALTER FUNCTION public."storage.objects_after_actions"() SET SCHEMA triggers;
ALTER FUNCTION public."storage.objects_before_actions"() SET SCHEMA triggers;
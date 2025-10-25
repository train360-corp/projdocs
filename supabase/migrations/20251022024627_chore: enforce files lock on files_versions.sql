drop policy "Enable insert for authenticated users only" on "public"."files_versions";

create policy "Enable insert for authenticated users only"
on "public"."files_versions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM files f
  WHERE ((f.id = files_versions.file_id) AND ((f.locked_by_user_id IS NULL) OR (f.locked_by_user_id = ( SELECT auth.uid() AS uid)))))));




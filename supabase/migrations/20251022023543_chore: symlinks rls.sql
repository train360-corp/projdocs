drop policy "Delete symlinks based on project access" on "public"."symlinks";

drop policy "Insert symlinks based on project access" on "public"."symlinks";

drop policy "Select symlinks based on project access" on "public"."symlinks";

drop policy "Update symlinks based on project access" on "public"."symlinks";

create policy "Delete symlinks based on project access"
on "public"."symlinks"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((directories d
     JOIN projects p ON ((p.id = d.project_id)))
     LEFT JOIN permissions perms ON (((perms.project_id = p.id) AND (perms.user_id = ( SELECT auth.uid() AS uid)))))
  WHERE ((d.id = symlinks.directory_id) AND ((p.access = ANY (ARRAY['DELETE'::access, 'ADMIN'::access])) OR (perms.id IS NOT NULL))))));


create policy "Insert symlinks based on project access"
on "public"."symlinks"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM ((directories d
     JOIN projects p ON ((p.id = d.project_id)))
     LEFT JOIN permissions perms ON (((perms.project_id = p.id) AND (perms.user_id = ( SELECT auth.uid() AS uid)))))
  WHERE ((d.id = symlinks.directory_id) AND ((p.access = ANY (ARRAY['EDIT'::access, 'ADMIN'::access])) OR (perms.id IS NOT NULL))))));


create policy "Select symlinks based on project access"
on "public"."symlinks"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((directories d
     JOIN projects p ON ((p.id = d.project_id)))
     LEFT JOIN permissions perms ON (((perms.project_id = p.id) AND (perms.user_id = ( SELECT auth.uid() AS uid)))))
  WHERE ((d.id = symlinks.directory_id) AND ((p.access = ANY (ARRAY['READ'::access, 'EDIT'::access, 'DELETE'::access, 'ADMIN'::access])) OR (perms.id IS NOT NULL))))));


create policy "Update symlinks based on project access"
on "public"."symlinks"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((directories d
     JOIN projects p ON ((p.id = d.project_id)))
     LEFT JOIN permissions perms ON (((perms.project_id = p.id) AND (perms.user_id = ( SELECT auth.uid() AS uid)))))
  WHERE ((d.id = symlinks.directory_id) AND ((p.access = ANY (ARRAY['EDIT'::access, 'ADMIN'::access])) OR (perms.id IS NOT NULL))))));




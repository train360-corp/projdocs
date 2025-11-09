declare
_id uuid := gen_random_uuid();
  _name text := gen_random_uuid();
begin

SET CONSTRAINTS versions_object_id_fkey DEFERRED;

if (tg_op = 'INSERT' OR tg_op = 'UPDATE') then

    if (new.user_metadata ->> 'filename') IS NOT NULL then
      _name := (new.user_metadata ->> 'filename')::text;
end if;

    if (
      (new.user_metadata -> 'file_id') = 'null'
      OR
      (
        ((new.user_metadata ->> 'file_id') ~* '^[0-9a-f-]{36}$')
        AND
        (EXISTS (SELECT 1 FROM public.files WHERE id = (new.user_metadata ->> 'file_id')::uuid))
      )
    ) then

      -- file row not not exist
      if (new.user_metadata -> 'file_id') = 'null' then
        insert into public.files ( -- create file
          id,
          project_id
        ) values (
          _id, (
            select d.project_id
            from public.directories d
            where d.id = (new.user_metadata ->> 'directory_id')::uuid limit 1
          )
        );
else
        _id := (new.user_metadata ->> 'file_id')::uuid
end if;

      -- create version
insert into public.files_versions (object_id, file_id, version, name) values (new.id, _id, 0, _name);

-- create simlink
if (
        ((new.user_metadata ->> 'directory_id') IS NOT NULL)
        AND
        EXISTS (
          SELECT 1 FROM public.directories
          WHERE id = (new.user_metadata ->> 'directory_id')::uuid
        )
        AND
        NOT EXISTS (
          select 1 from public.symlinks where
            directory_id = (new.user_metadata ->> 'directory_id')::uuid
            AND
            file_id = _id
        )
      ) then
        insert into public.symlinks (directory_id, file_id, name) values ((new.user_metadata ->> 'directory_id')::uuid, _id, _name);
end if;

end if;

end if;

return coalesce(new, old);

end;
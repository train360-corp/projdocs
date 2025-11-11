set check_function_bodies = off;

CREATE OR REPLACE FUNCTION triggers.files_versions_before_actions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin

  if tg_op = 'INSERT' then
    select coalesce(max(version), 0) + 1 into new.version
    from files_versions
    where file_id = new.file_id;

  end if;

  if tg_op = 'UPDATE' and (
    new.file_id <> old.file_id or
    new.version <> old.version or
    -- new.object_id <> old.object_id or -- omit this: need to be able to save a version's current progress
    new.created_at <> old.created_at or
    new.id <> old.id
  ) then
    raise exception 'Cannot change locked field';
  end if;

  return coalesce (new, old);
end;$function$
;

CREATE OR REPLACE FUNCTION triggers."storage.objects_after_actions"()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    _id       uuid                       := gen_random_uuid();
    directory public.directories%rowtype := null;
    _schema   json                       := '{
      "type": "object",
      "properties": {
        "preview": {
          "type": [
            "string",
            "null"
          ]
        },
        "file_id": {
          "type": [
            "string",
            "null"
          ],
          "minLength": 36,
          "maxLength": 36
        },
        "version_id": {
          "type": [
            "string",
            "null"
          ],
          "minLength": 36,
          "maxLength": 36
        },
        "directory_id": {
          "type": [
            "string",
            "null"
          ],
          "minLength": 36,
          "maxLength": 36
        },
        "filename": {
          "type": "string",
          "minLength": 1
        }
      },
      "required": [
        "file_id",
        "directory_id"
      ],
      "additionalProperties": false
    }'::json;

begin

    SET CONSTRAINTS versions_object_id_fkey DEFERRED;

    if
        (tg_op = 'INSERT' OR tg_op = 'UPDATE')
            and
        (new.user_metadata is not null)
    then

        -- validate preview
        if (new.user_metadata ->> 'preview') is not null then
          if not (new.user_metadata ->> 'preview') ~* '^data:[a-z]+/[a-z0-9\-\.+]+;base64,[A-Za-z0-9+/=]+$' then
            raise exception 'user_metadata.preview failed regex validation';
          end if;
        end if;

        -- validate schema
        if not extensions.jsonb_matches_schema(schema := _schema, instance := new.user_metadata) then
            raise exception 'user_metadata failed schema validation';
        end if;

        -- validate filename
        if not (new.user_metadata ->> 'filename') ~* '^[^\\s\\/:\*\?"<>\\|].*[^\\s\\/:\*\?"<>\\|]$' then
            raise exception 'user_metadata.filename failed regex validation';
        end if;

        -- validate directory_id
        if (new.user_metadata ->> 'directory_id') is not null then
          if not ((new.user_metadata ->> 'directory_id') ~* '^[0-9a-f-]{36}$') then
            raise exception 'user_metadata.directory_id failed validation: "%" is not a valid uuid', (new.user_metadata ->> 'file_id');
        else
            -- load the directory
            select *
            from public.directories
            where id = (new.user_metadata ->> 'directory_id')::uuid
            limit 1
            into directory;

            -- validate existence
            if directory is null or directory.id is null or
               directory.id <> (new.user_metadata ->> 'directory_id')::uuid then
                raise exception 'user_metadata.directory_id failed validation: directory (id=%) does not exist', (new.user_metadata ->> 'directory_id')::uuid;
            end if;
        end if;
        end if;

        -- validate file_id
        if (new.user_metadata ->> 'file_id') is null then
          if directory is null or directory.id is null then
            raise exception 'directory_id and file_id cannot both be empty';
          else
            -- create file
            insert into public.files (id, project_id)
            values (_id, directory.project_id);
          end if;
        else
            if not ((new.user_metadata ->> 'file_id') ~* '^[0-9a-f-]{36}$') then
                raise exception 'user_metadata.file_id failed validation: "%" is not a valid uuid', (new.user_metadata ->> 'file_id');
            else
                _id := (new.user_metadata ->> 'file_id')::uuid;
                if not exists(select 1 from public.files where id = _id) then
                    raise exception 'user_metadata.file_id failed validation: file (id=%) does not exist', _id;
                end if;
            end if;
        end if;

        -- validate version_id
        if (new.user_metadata ->> 'version_id') is null then
            -- create version
            insert into public.files_versions (object_id, file_id, version, name)
            values (new.id, _id, 0, (new.user_metadata ->> 'filename'))
            on conflict (object_id) do nothing; -- 0 for version bc trigger fixes it
        elsif not ((new.user_metadata ->> 'version_id') ~* '^[0-9a-f-]{36}$') then
            raise exception 'user_metadata.version_id failed validation: "%" is not a valid uuid', (new.user_metadata ->> 'file_id');
        elsif not exists(select 1 from public.files_versions where id = (new.user_metadata ->> 'version_id')::uuid) then
            raise exception 'user_metadata.version_id failed validation: file_version (id=%) does not exist', (new.user_metadata ->> 'version_id')::uuid;
        else
          update public.files_versions
          set object_id = new.id
          where id = (new.user_metadata ->> 'version_id')::uuid;
        end if;

        -- create symlink (if not already exists)
        if directory.id is not null then
          if not exists (select 1
                       from public.symlinks symlink
                       where symlink.directory_id = directory.id
                         and symlink.file_id = _id) then
            insert into public.symlinks (directory_id, file_id, name)
            values (directory.id, _id, (new.user_metadata ->> 'filename'));
          end if;
        end if;

    end if;
    return coalesce(new, old);

end;$function$
;



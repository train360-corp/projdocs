set check_function_bodies = off;

CREATE OR REPLACE FUNCTION triggers.files_before_actions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  current_user_id uuid;
BEGIN

  SELECT auth.uid() INTO current_user_id;

  IF TG_OP = 'UPDATE' THEN

    -- if another user holds the lock, block change
    IF OLD.locked_by_user_id IS NOT NULL AND OLD.locked_by_user_id <> current_user_id THEN
      RAISE EXCEPTION
        'File is locked by another user (%). Updates are not allowed.',
        OLD.locked_by_user_id
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- Always refresh current_version_id from latest version
    SELECT fv.id 
      INTO NEW.current_version_id
      FROM public.files_versions AS fv
      WHERE fv.file_id = NEW.id
      ORDER BY fv.version DESC;

    -- Column-level protections
    IF NEW.id <> OLD.id OR NEW.number <> OLD.number THEN
      RAISE EXCEPTION 'protected columns cannot be changed';
    END IF;

    -- explicit row-level locking
    IF NEW.locked_by_user_id IS DISTINCT FROM OLD.locked_by_user_id THEN
      IF OLD.locked_by_user_id IS NULL THEN
        -- Locking an unlocked file -> take the lock for caller
        NEW.locked_by_user_id := current_user_id;

      ELSIF NEW.locked_by_user_id IS NULL THEN
        -- Unlock attempt -> only the owner may unlock
        IF OLD.locked_by_user_id <> current_user_id THEN
          RAISE EXCEPTION
            'Cannot unlock a file locked by another user (%).',
            OLD.locked_by_user_id
            USING ERRCODE = '42501';
        END IF;

      ELSIF OLD.locked_by_user_id IS DISTINCT FROM current_user_id THEN
        -- Overwrite someone else’s lock -> block
        RAISE EXCEPTION
          'Cannot take lock owned by another user (%).',
          OLD.locked_by_user_id
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;$function$
;



alter table "public"."files" add column "locked_by_user_id" uuid;

alter table "public"."files" add constraint "files_locked_by_user_id_fkey" FOREIGN KEY (locked_by_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."files" validate constraint "files_locked_by_user_id_fkey";



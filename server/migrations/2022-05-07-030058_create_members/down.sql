-- This file should undo anything in `up.sql`
alter table "members" drop constraint "members_user_id_foreign";
alter table "members" drop constraint "members_conversation_id_foreign";

drop table if exists "members" cascade;
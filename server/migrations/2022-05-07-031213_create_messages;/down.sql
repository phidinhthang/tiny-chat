-- This file should undo anything in `up.sql`
alter table "messages" drop constraint "messages_author_id_foreign";
alter table "messages" drop constraint "messages_conversation_id_foreign";

drop table if exists "messages" cascade;
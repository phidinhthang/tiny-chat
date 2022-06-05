-- This file should undo anything in `up.sql`
alter table "conversations" drop column "is_group";
alter table "conversations" add column "type" text check ("type" in ('private', 'group')) not null default 'private';
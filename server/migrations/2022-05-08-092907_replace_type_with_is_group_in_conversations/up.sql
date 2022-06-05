-- Your SQL goes here
alter table "conversations" drop column "type";
alter table "conversations" add column "is_group" boolean not null default false;
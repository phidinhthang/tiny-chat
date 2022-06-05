-- Your SQL goes here
alter table "messages" add column "reactions" jsonb default '{}'::JSONB not null;
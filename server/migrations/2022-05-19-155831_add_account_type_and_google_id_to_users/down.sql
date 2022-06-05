-- This file should undo anything in `up.sql`
alter table "users" drop column "account_type";
alter table "users" drop column "google_id";
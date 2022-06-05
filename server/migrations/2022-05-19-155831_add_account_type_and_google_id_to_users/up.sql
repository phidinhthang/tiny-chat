-- Your SQL goes here
alter table "users" 
	add column "account_type" text
	check ("account_type" in ('local', 'google', 'facebook', 'github')) 
	default 'local' not null;

alter table "users"
	add column google_id text null;
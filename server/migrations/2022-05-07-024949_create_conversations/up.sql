-- Your SQL goes here
create table "conversations" (
	"id" uuid primary key default uuid_generate_v4(),
	"name" varchar(255) null, 
	"type" text check ("type" in ('private', 'group')) not null, 
	"admin_id" uuid null, 
	"last_message_id" uuid null,
	"last_message_display" jsonb default '{}'::jsonb not null,
	"created_at" timestamptz(0) not null default current_timestamp
);


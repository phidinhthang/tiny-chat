-- Your SQL goes here
create table "messages" (
	"id" uuid primary key default uuid_generate_v4(),
	"author_id" uuid not null,
	"conversation_id" uuid not null,
	"content" text,
	"is_deleted" boolean not null default false,
	"created_at" timestamptz(0) not null default current_timestamp,
	"updated_at" timestamptz(0) null
);

alter table "messages" 
	add constraint "messages_author_id_foreign" foreign key ("author_id") references "users" ("id") on delete cascade;
alter table "messages" 
	add constraint "messages_conversation_id_foreign" foreign key ("conversation_id") references "conversations" ("id") on delete cascade;

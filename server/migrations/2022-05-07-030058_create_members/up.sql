-- Your SQL goes here
create table "members" (
	"conversation_id" uuid not null,
	"user_id" uuid not null,
	"last_read_at" timestamptz(0),
	"joined_at" timestamptz(0) not null default current_timestamp,
	"nick" varchar(255) null,
	"avatar" varchar(255) null,
	"is_kicked" boolean not null default false,
	"is_banned" boolean not null default false
);

alter table "members" 
	add constraint "members_pkey" primary key ("conversation_id", "user_id");

alter table "members" 
	add constraint "members_conversation_id_foreign" foreign key ("conversation_id") references "conversations" ("id") on delete cascade;
alter table "members"
	add constraint "members_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;


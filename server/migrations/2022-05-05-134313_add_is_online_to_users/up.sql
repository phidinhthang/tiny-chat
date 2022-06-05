-- Your SQL goes here
alter table "users" 
	add column "is_online" boolean not null default false;

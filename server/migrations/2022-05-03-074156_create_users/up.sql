-- Your SQL goes here
create extension if not exists "uuid-ossp";

create table "users" (
	"id" uuid primary key default uuid_generate_v4(),
	"username" varchar(255) unique not null,
	"password" varchar(255) not null
);
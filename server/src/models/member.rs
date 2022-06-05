use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use serde::{Deserialize, Serialize};
use uuid::{Uuid};
// use chrono::prelude::*;
use crate::schema::members::{self, dsl::*};
use crate::lib::{json_time, json_option_time};
// use std::env;

#[derive(Debug, Clone, Serialize, Deserialize, Queryable)]
#[serde(rename_all="camelCase")]
pub struct Member {
	pub conversation_id: Uuid,
	pub user_id: Uuid,
	#[serde(with = "json_option_time")]
	pub last_read_at: Option<chrono::NaiveDateTime>,
	#[serde(with = "json_time")]
	pub joined_at: chrono::NaiveDateTime,
	pub nick: Option<String>,
	pub avatar: Option<String>,
	pub is_kicked: bool,
	pub is_banned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, Queryable)]
#[serde(rename_all="camelCase")]
#[table_name="members"]
pub struct NewMember {
	pub conversation_id: Uuid,
	pub user_id: Uuid
}

impl Member {
	pub fn insert_one(member: &NewMember, conn: &PgConnection) -> QueryResult<usize> {
		diesel::insert_into(members).values(member).execute(conn)
	}

	pub fn insert_many(new_members: &Vec<NewMember>, conn: &PgConnection) -> QueryResult<usize> {
		diesel::insert_into(members).values(new_members).execute(conn)
	}

	pub fn fetch_by_conversation(uid: &Uuid, conn: &PgConnection) -> QueryResult<std::vec::Vec<Member>> {
		members.filter(conversation_id.eq(uid)).get_results::<Member>(conn)
	}

	pub fn get_member_or_throw(uid: &uuid::Uuid, cid: &uuid::Uuid, conn: &PgConnection) -> QueryResult<Member> {
		members.filter(user_id.eq(uid).and(conversation_id.eq(cid))).get_result::<Member>(conn)
	}
}
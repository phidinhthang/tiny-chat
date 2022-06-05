use diesel::prelude::*;
use diesel::sql_query;
use diesel::sql_types::{Jsonb, Array, Text};
use diesel::pg::Pg;
// use diesel::backend::Backend;
use diesel::deserialize::{FromSql};
use diesel::serialize::{ToSql, Output};
use diesel::pg::expression::dsl::{any};
use std::io::Write;
use diesel::{PgConnection, QueryResult};
use serde::{Deserialize, Serialize};
use uuid::{Uuid};
// use chrono::prelude::*;
use crate::schema::conversations::{self, dsl::*};
use crate::schema::members::{dsl::*};
use crate::models::member::{Member, NewMember};
use crate::models::user::{User};
// use std::env;

sql_function!{
	fn jsonb_set(target: Jsonb, path: Array<Text>, new_value: Jsonb) -> Jsonb
}

#[derive(FromSqlRow, AsExpression, Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all="camelCase")]
#[sql_type = "Jsonb"]
pub struct LastMessageDisplay {
	pub user_id: Option<Uuid>,
	pub user_name: Option<String>,
	pub content: Option<String>,

	pub created_at: Option<chrono::NaiveDateTime>
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all="camelCase")]
pub struct With {
	pub user_id: Uuid,
	pub username: String,
	pub avatar_url: Option<String>,
	pub is_online: bool,
	pub last_online_at: Option<chrono::NaiveDateTime>
}

impl FromSql<Jsonb, Pg> for With {
	fn from_sql(bytes: Option<&[u8]>) -> diesel::deserialize::Result<Self> {
		let value = FromSql::<Jsonb, Pg>::from_sql(bytes)?;

		Ok(serde_json::from_value(value)?)
	}
}

impl ToSql<Jsonb, Pg> for With {
	fn to_sql<W: Write>(&self, out: &mut Output<W, Pg>) -> diesel::serialize::Result {
		let value = serde_json::to_value(self)?;
		ToSql::<Jsonb, Pg>::to_sql(&value, out)
	}
}

impl FromSql<Jsonb, Pg> for LastMessageDisplay {
	fn from_sql(bytes: Option<&[u8]>) -> diesel::deserialize::Result<Self> {
		let value = FromSql::<Jsonb, Pg>::from_sql(bytes)?;

		Ok(serde_json::from_value(value)?)
	}
} 

impl ToSql<Jsonb, Pg> for LastMessageDisplay {
	fn to_sql<W: Write>(&self, out: &mut Output<W, Pg>) -> diesel::serialize::Result {
		let value = serde_json::to_value(self)?;
		ToSql::<Jsonb, Pg>::to_sql(&value, out)
	}
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, QueryableByName)]
#[table_name="conversations"]
#[serde(rename_all="camelCase")]
pub struct Conversation {
	pub id: Uuid,
	pub name: Option<String>,
	pub admin_id: Option<Uuid>,
	pub last_message_id: Option<Uuid>,
	pub last_message_display: LastMessageDisplay,
	pub created_at: chrono::NaiveDateTime,
	pub is_group: bool,
	pub withs: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, Queryable)]
#[serde(rename_all="camelCase")]
#[table_name="conversations"]
pub struct NewConversation {
	pub name: Option<String>,
	pub admin_id: Option<Uuid>,
	pub is_group: bool,
	pub withs: Option<serde_json::Value>
}

impl Conversation {
	pub fn fetch_by_id(uid: &Uuid, conn: &PgConnection) -> QueryResult<Conversation> {
		conversations.filter(id.eq(uid)).get_result::<Conversation>(conn)
	}

	pub fn update_last_message(uid: &Uuid, message_id: &Uuid, lmd: &LastMessageDisplay, conn: &PgConnection) -> Result<usize, diesel::result::Error> {
		diesel::update(conversations.filter(id.eq(uid)))
			.set((last_message_id.eq(message_id), last_message_display.eq(lmd)))
			.execute(conn)
	}

	pub fn update_user_online(uid: &Uuid, conn: &PgConnection) -> QueryResult<usize> {
		sql_query(r#"
			with item as (
				select c.id, pos - 1 as user_index
				from conversations c,
				jsonb_array_elements(withs) with ordinality arr(elem, pos)
				where elem->>'userId' = $1::text 
			)
			update conversations c
			set withs = jsonb_set(withs, ('{' || user_index || ',"isOnline"}')::TEXT[], to_json(true)::JSONB)
			from item
			where c.id = item.id;
		"#).bind::<diesel::sql_types::Uuid, _>(uid)
		.execute(conn)
	}

	pub fn update_user_offline(uid: &Uuid, conn: &PgConnection) -> QueryResult<usize> {
		sql_query(r#"
			with item as (
				select c.id, pos - 1 as user_index
				from conversations c,
				jsonb_array_elements(withs) with ordinality arr(elem, pos)
				where elem->>'userId' = $1::text 
			)
			update conversations c
			set withs = jsonb_set(
				jsonb_set(withs, ('{' || user_index || ',"isOnline"}')::TEXT[], to_json(false)::JSONB),
				('{' || user_index || ',"lastOnlineAt"}')::TEXT[], to_json(CURRENT_TIMESTAMP)::JSONB
			)
			from item
			where c.id = item.id;
		"#).bind::<diesel::sql_types::Uuid, _>(uid)
		.execute(conn)
	}

	pub fn insert_one(conversation: &NewConversation, conn: &PgConnection) -> QueryResult<Conversation> {
		diesel::insert_into(conversations).values(conversation).get_result(conn)
	}

	pub fn get_by_recipient(rid: &Uuid, uid: &Uuid, conn: &PgConnection) -> Result<Conversation, diesel::result::Error> {
		let conversation = sql_query(r#"
			select c.* from members m1
			inner join conversations c on m1.conversation_id = c.id and c.is_group = false
			inner join members m2 on m2.conversation_id = c.id and m2.user_id = $1
			where m1.user_id = $2
			limit 1;
		"#)
		.bind::<diesel::sql_types::Uuid, _>(rid)
		.bind::<diesel::sql_types::Uuid, _>(uid)
		.get_result::<Conversation>(conn);
		
		match conversation {
			Ok(conversation) => Ok(conversation),
			Err(diesel::result::Error::NotFound) => {
				let users = User::fetch_by_ids(&vec![*rid, *uid], conn);
				match users {
					Ok(users) => {
						let mut with_users : Vec<With> = Vec::new();
						for user in users.iter() {
							with_users.push(With {
									avatar_url: None,
									username: user.username.to_owned(),
									is_online: user.is_online,
									last_online_at: user.last_online_at,
									user_id: user.id
								});
						}
						let conversation = Self::insert_one(&NewConversation {
							name: None, is_group: false, admin_id: None, 
							withs: Some(serde_json::to_value(&with_users).unwrap())
						}, &conn);
						match conversation {
							Ok(conversation) => {
								let new_members = vec![NewMember {conversation_id: conversation.id, user_id: rid.to_owned()}, NewMember {conversation_id: conversation.id, user_id: uid.to_owned()}];
								let result = Member::insert_many(&new_members, conn);
								if let Err(e) = result {
									return Err(e);
								};
								Ok(conversation)
							},
							Err(e) => {
								Err(e)
							}	
						}
					}
					Err(e) => Err(e)
				}
			}
			Err(e) => {
						Err(e)
			}
		}
	}

	pub fn fetch_by_user_id(uid: &Uuid, conn: &PgConnection) -> QueryResult<Vec<Conversation>> {
		let conversation_ids : Vec<uuid::Uuid> = members.select(conversation_id).filter(user_id.eq(uid)).get_results(conn).unwrap(); 
		conversations.filter(id.eq(any(conversation_ids)))
			.get_results(conn)
	}
}
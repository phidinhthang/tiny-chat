use diesel::prelude::*;
use diesel::sql_query;
use serde::{Serialize, Deserialize};
// use diesel::{}
use crate::schema::messages::{self, dsl::*};
use crate::models;
use crate::lib::{json_option_time, json_time};

#[derive(Debug, Clone, Serialize, Deserialize, Queryable)]
#[serde(rename_all="camelCase")]
pub struct Message {
	pub id: uuid::Uuid,
	pub author_id: uuid::Uuid,
	pub conversation_id: uuid::Uuid,
	pub content: Option<String>,
	pub is_deleted: bool,
	#[serde(with = "json_time")]
	pub created_at: chrono::NaiveDateTime,
	#[serde(with = "json_option_time")]
	pub updated_at: Option<chrono::NaiveDateTime>,
	pub reactions: serde_json::Value,
	pub is_image: bool
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMessageBody {
	pub conversation_id: uuid::Uuid,
	pub content: Option<String>,
	pub is_image: bool
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, Queryable)]
#[serde(rename_all="camelCase")]
#[table_name="messages"]
pub struct NewMessage {
	pub conversation_id: uuid::Uuid,
	pub author_id: uuid::Uuid,
	pub content: Option<String>,
	pub is_image: bool
}	

impl NewMessage {
	pub fn new(obj: Self) -> Self {
		obj
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
struct ReactionData {
	#[serde(with = "json_time")]
	created_at: chrono::NaiveDateTime,
	name: String
}

impl Message {
	pub fn insert_one(new_message: &NewMessage, conn: &PgConnection) -> QueryResult<Message> {
		diesel::insert_into(messages).values(new_message).get_result::<Message>(conn)
	}

	pub fn create_reaction(uid: &uuid::Uuid, 
		cid: &uuid::Uuid, 
		mid: &uuid::Uuid, 
		emoji_name: &String, 
		conn: &PgConnection
	) -> Result<usize, diesel::result::Error> {
		let reaction_key = format!("{}:{}",uid.to_hyphenated(), emoji_name);
		let reaction_data: ReactionData = ReactionData {
			created_at: chrono::Utc::now().naive_utc(),
			name: emoji_name.to_owned()
		};
		let data: serde_json::Value = serde_json::to_value(reaction_data).unwrap();
		sql_query(r#"
			update messages
			set reactions = jsonb_set(reactions, $1::TEXT[], $2, true)
			where messages.id = $3 and messages.conversation_id = $4; 
		"#).bind::<diesel::sql_types::Text, _>(format!("{{ {} }}", reaction_key))
		.bind::<diesel::sql_types::Jsonb, _>(data)
		.bind::<diesel::sql_types::Uuid, _>(mid)
		.bind::<diesel::sql_types::Uuid, _>(cid)
		.execute(conn)
	}

	pub fn delete_message(mid: &uuid::Uuid, uid: &uuid::Uuid, conn: &PgConnection) -> QueryResult<usize> {
		sql_query(r#"
			update messages
			set content = null,
			is_deleted = true
			where messages.id = $1 and messages.author_id = $2;
		"#)
		.bind::<diesel::sql_types::Uuid, _>(mid)
		.bind::<diesel::sql_types::Uuid, _>(uid)
		.execute(conn)
	}

	pub fn delete_reaction(uid: &uuid::Uuid, cid: &uuid::Uuid, mid: &uuid::Uuid, emoji_name: &String, conn: &PgConnection) -> Result<usize, diesel::result::Error> {
		let reaction_key = format!("{}:{}", uid.to_hyphenated(), emoji_name);
		sql_query(r#"
			update messages
			set reactions = reactions - $1
			where messages.id = $2 and messages.conversation_id = $3;
		"#)
		.bind::<diesel::sql_types::Text, _>(reaction_key)
		.bind::<diesel::sql_types::Uuid, _>(mid)
		.bind::<diesel::sql_types::Uuid, _>(cid)
		.execute(conn)
	}

	pub fn fetch_by_conversation(
		uid: &uuid::Uuid, 
		options: &models::pagination::Options, 
		conn: &PgConnection
	) -> Result<models::pagination::Result<Vec<Message>>, diesel::result::Error> {
		let mut query = messages::table.into_boxed();
		query = query.filter(conversation_id.eq(uid));

		match options.after {
			Some(after) => {
				query = query.filter(created_at.le(after));
			}
			None => {}
		};
		let limit : usize;
		match options.limit {
			Some(_limit) => {
				if _limit > 50 {
					limit = 50;
				} else {
					limit = _limit;
				}
			} 
			None => {
				limit = 10;
			}
		}
		let limit_plus_one : i32 = limit as i32 + 1;
		query = query.limit(limit_plus_one.into());
		query = query.order_by(created_at.desc());
		let result = query.get_results::<Message>(conn);
		match result {
			Ok(users) => {
				let mut next_cursor : Option<chrono::NaiveDateTime> = None;
				let items : Vec<Message>;
				if users.len() == limit_plus_one as usize {
					next_cursor = Some(users[limit_plus_one as usize - 1].created_at);
					items = (&users[0..limit]).to_vec();
				} else {
					items = users;
				}
				let res : models::pagination::Result<Vec<Message>> = models::pagination::Result {
					items: items,
					next_cursor: next_cursor,
					prev_cursor: None
				};
				Ok(res)
			}
			Err(err) => Err(err)
		}
	}
}
use diesel::prelude::*;
use diesel::{PgConnection, QueryResult};
use diesel::sql_query;
use serde::{Deserialize, Serialize};
use uuid::{Uuid};
use rand::Rng;
use actix_web::{HttpRequest};
// use chrono::{NaiveDateTime, NaiveDate, NaiveTime};
use diesel::pg::expression::dsl::{any};
use crate::lib::json_option_time;
use chrono::prelude::*;
use argon2::Config;
use crate::schema::users::{self, dsl::*};
use crate::models;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, QueryableByName)]
#[table_name="users"]
#[serde(rename_all="camelCase")]
pub struct User {
	pub id: Uuid,
	pub username: String,
	#[serde(skip_serializing)]
	pub password: String,
	pub is_online: bool,
	#[serde(with = "json_option_time")]
	pub last_online_at: Option<chrono::NaiveDateTime>,
	#[serde(skip_serializing)]
	pub account_type: String,
	#[serde(skip_serializing)]
	pub google_id: Option<String>,
	pub avatar_url: Option<String>
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, QueryableByName)]
#[table_name="users"]
pub struct UserId {
	pub id: Uuid
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable, Queryable)]
#[serde(rename_all="camelCase")]
#[table_name="users"]
pub struct NewUser {
	pub username: String,
	pub password: String,
	pub account_type: Option<String>,
	pub google_id: Option<String>
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all="camelCase")]
struct Claims {
	exp: usize,
	user_id: Uuid
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all="camelCase")]
pub struct RefreshToken {
	pub refresh_token: String
}

impl User {
	pub fn find_user_by_username(un: &str, is_local: bool, conn: &PgConnection) -> QueryResult<User> {
		let mut query = users::table.into_boxed();
		query = query.filter(username.eq(un));
		if is_local {
			query = query.filter(account_type.eq("local"));
		};
		query.get_result::<User>(conn)
	}

	pub fn fetch_by_google_id(gid: &String, conn: &PgConnection) -> QueryResult<User> {
		users.filter(google_id.eq(gid)).get_result::<User>(conn)
	}

	pub fn fetch_users_by_conversation(cid: &uuid::Uuid, conn: &PgConnection) -> QueryResult<Vec<User>> {
		let user_rows = sql_query(r#"
			select u.* from users u
			inner join members m on m.user_id = u.id and m.conversation_id = $1
		"#)
		.bind::<diesel::sql_types::Uuid, _>(cid)
		.get_results::<User>(conn);
		user_rows
	}

	pub fn update_avatar(uid: &uuid::Uuid, new_avatar_url: &String, conn: &PgConnection) -> QueryResult<usize> {
		diesel::update(users.filter(id.eq(uid))).set(avatar_url.eq(new_avatar_url)).execute(conn)
	}

	pub fn fetch_user_ids_by_conversation(conversation_id: &uuid::Uuid, user_id: &uuid::Uuid, conn: &PgConnection) -> QueryResult<Vec<uuid::Uuid>> {
		let user_id_rows = sql_query(r#"
			select m.user_id as "id" from members m
			where m.user_id != $1 and m.conversation_id = $2;
		"#)
		.bind::<diesel::sql_types::Uuid, _>(user_id)
		.bind::<diesel::sql_types::Uuid, _>(conversation_id)
		.get_results::<UserId>(conn);
		match user_id_rows {
			Ok(user_ids) => {
				let mut result : Vec<uuid::Uuid> = Vec::new();
				for user_id in user_ids {
					result.push(user_id.id);
				}
				Ok(result)
			}
			Err(err) => {
				println!("error in fetch user ids {}", err);
				Err(err)
			}
		}
	}

	pub fn fetch_user_ids(conn: &PgConnection) -> QueryResult<Vec<uuid::Uuid>> {
		users.select(id).load::<uuid::Uuid>(conn)
	}

	pub fn find_by_id(uid: &Uuid, conn: &PgConnection) -> QueryResult<User> {
		users.filter(id.eq(uid)).get_result::<User>(conn)
	}

	pub fn fetch_by_ids(user_ids: &Vec<Uuid>, conn: &PgConnection) -> QueryResult<Vec<User>> {
		users.filter(id.eq(any(user_ids))).get_results::<User>(conn)
	}

	pub fn insert_user(user: &NewUser, conn: &PgConnection) -> QueryResult<User> {
		diesel::insert_into(users).values(user).get_result(conn)
	}

	pub fn set_online(user_id: &Uuid, conn: &PgConnection) -> QueryResult<usize> {
		let result = diesel::update(users.filter(id.eq(user_id))).set(is_online.eq(true)).execute(conn);
		models::conversation::Conversation::update_user_online(user_id, conn).expect("update user online in conversation fail");
		result
	}

	pub fn set_offline(user_id: &Uuid, conn: &PgConnection) -> QueryResult<usize> {
		let result = diesel::update(users.filter(id.eq(user_id))).set((is_online.eq(false), last_online_at.eq(Utc::now().naive_utc()))).execute(conn);
		models::conversation::Conversation::update_user_offline(user_id, conn).expect("update user offline in conversation fail");		
		result
	}

	pub fn fetch_all(conn: &PgConnection) -> std::result::Result<std::vec::Vec<User>, diesel::result::Error> {
		users.load::<User>(conn)
	}

	pub fn get_id_from_req(req: &HttpRequest) -> Option<uuid::Uuid> {
		let access_token_header = req.headers().get("X-Access-Token");
		match access_token_header {
			Some(_) => {
				let split = access_token_header.unwrap().to_str().unwrap();
				let access_token = split.trim();
				let user_id = User::verify_access_token(&access_token);
				user_id
			}
			None => None
		}
	}

	pub fn hash_password(raw: &str) -> Option<String> {
		let salt: [u8; 32] = rand::thread_rng().gen();
		let config = Config::default();
		let result = argon2::hash_encoded(raw.as_bytes(), &salt, &config);

		match result {
			Ok(hashed_password) => Some(hashed_password),
			Err(_) => None 
		}
	}

	pub fn verify_password(raw: &str, hash: &str) -> bool {
		match argon2::verify_encoded(hash, raw.as_bytes()) {
			Ok(is_match) => is_match,
			Err(_) => false 
		}
	}

	pub fn create_jwt(uid: &Uuid, expire_time: chrono::Duration, token_secret: &str) -> Option<String> {
		let expiration = Utc::now()
			.checked_add_signed(expire_time);
		if expiration.is_none() {
			return None
		}

		let exp = expiration.unwrap().timestamp();
		let claims = Claims {
			exp: exp as usize,
			user_id: uid.to_owned()
		};
		let header = Header::new(Algorithm::HS512);

		match encode(&header, &claims, &EncodingKey::from_secret(token_secret.as_bytes())) {
			Ok(token) => Some(token),
			Err(_) => None
		}
	}

	pub fn create_refresh_token(uid: &Uuid) -> Option<String> {
		dotenv::dotenv().ok();
		let refresh_token_secret = env::var("REFRESH_TOKEN_SECRET");
		if refresh_token_secret.is_err() {
			return None;
		};
		User::create_jwt(uid, chrono::Duration::minutes(60 * 24 * 7), &refresh_token_secret.unwrap())
	}

	pub fn create_access_token(uid: &Uuid) -> Option<String> {
		dotenv::dotenv().ok();
		let access_token_secret = env::var("ACCESS_TOKEN_SECRET");
		if access_token_secret.is_err() {
			return None;
		};
		User::create_jwt(uid, chrono::Duration::minutes(60), &access_token_secret.unwrap())
	}

	pub fn verify_jwt(token: &str, token_secret: &str) -> Option<Uuid> {
		let decoded = decode::<Claims>(token, &DecodingKey::from_secret(token_secret.as_bytes()), &Validation::new(Algorithm::HS512));

		if decoded.is_err() {
			return None;
		};

		Some(decoded.unwrap().claims.user_id)
	}

	pub fn verify_access_token(access_token: &str) -> Option<Uuid> {
		dotenv::dotenv().ok();
		let access_token_secret = env::var("ACCESS_TOKEN_SECRET");
		if access_token_secret.is_err() {
			return None;
		};
		User::verify_jwt(access_token, &access_token_secret.unwrap())
	}

	pub fn verify_refresh_token(refresh_token: &str) -> Option<Uuid> {
		dotenv::dotenv().ok();
		let refresh_token_secret = env::var("REFRESH_TOKEN_SECRET");
		if refresh_token_secret.is_err() {
			return None;
		};
		User::verify_jwt(refresh_token, &refresh_token_secret.unwrap())
	}

}
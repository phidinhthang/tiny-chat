extern crate dotenv;

use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};
use dotenv::dotenv;
use std::env;
use serde::{Serialize};


pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub fn create_pool() -> DbPool {
	dotenv().ok();

	let database_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set in .env file");
	let manager = ConnectionManager::<PgConnection>::new(database_url);
	let pool = r2d2::Pool::builder().max_size(20).min_idle(Option::Some(5))
		.build(manager)
		.expect("Failed to create pool.");
	println!("max pool size {0}, {1}", pool.max_size(), pool.min_idle().unwrap());
		pool
}

#[derive(Serialize)]
pub struct ErrorField {
    pub path: String,
    pub messages: Vec<String>
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String
}

pub fn time_to_json(t: chrono::NaiveDateTime) -> String {
	chrono::DateTime::<chrono::Utc>::from_utc(t, chrono::Utc).to_rfc3339()
}

pub mod json_time {
	use super::*;
	use serde::{Serialize, Serializer, Deserialize, Deserializer, de::Error};

    #[allow(dead_code)]
	pub fn serialize<S: Serializer>(time: &chrono::NaiveDateTime, serializer: S) -> Result<S::Ok, S::Error> {
        time_to_json(time.clone()).serialize(serializer)
	}

    #[allow(dead_code)]
	pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<chrono::NaiveDateTime, D::Error> {
		let time: String = Deserialize::deserialize(deserializer)?;
            Ok(chrono::DateTime::parse_from_rfc3339(&time).map_err(D::Error::custom)?.naive_utc())
	}
}

pub mod json_option_time {
	use super::*;
	use serde::{Serialize, Serializer, Deserialize, Deserializer, de::Error};

	pub fn serialize<S: Serializer>(time: &Option<chrono::NaiveDateTime>, serializer: S) -> Result<S::Ok, S::Error> {
        match time {
            Some(time) => {
                time_to_json(time.clone()).serialize(serializer)
            },
            None => {
                serializer.serialize_none()
            }
        }
	}

	pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Option<chrono::NaiveDateTime>, D::Error> {
		let time: Option<String> = Deserialize::deserialize(deserializer)?;
        match time {
            Some(time) => {
                Ok(Some(chrono::DateTime::parse_from_rfc3339(&time).map_err(D::Error::custom)?.naive_utc()))
            }
            None => Ok(None)
        }
	}
}





use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Options {
	pub limit: Option<usize>,
	pub before: Option<chrono::NaiveDateTime>,
	pub after: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct Result<T> {
	pub items: T,
	pub next_cursor: Option<chrono::NaiveDateTime>,
	pub prev_cursor: Option<chrono::NaiveDateTime>
}
use std::{
	collections::{HashMap, HashSet},
	sync::{
		atomic::{AtomicUsize, Ordering},
		Arc
	}
};

use serde::{Serialize, Deserialize};
use actix::prelude::*;
use rand::{self, rngs::ThreadRng, Rng};
use std::fmt;
use crate::lib::DbPool;
use crate::models;

#[derive(Message)]
#[rtype(result = "()")]
pub struct Message(pub String);

#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
	pub addr: Recipient<Message>
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
	pub id: usize,
	pub user_id: Option<uuid::Uuid>
}

#[derive(Message, Deserialize, Serialize)]
#[rtype(result = "()")]
pub struct NewMessage {
	pub message: models::message::Message,
	pub author: models::user::User
}

#[derive(Message, Deserialize, Serialize)]
#[rtype(result = "()")]
pub struct NewUser {
	pub user: models::user::User
}

#[derive(Message, Deserialize, Serialize)]
#[rtype(result = "()")]
#[serde(rename_all="camelCase")]
pub struct MessageDeleted {
	pub message_id: uuid::Uuid,
	pub conversation_id: uuid::Uuid,
	pub author_id: uuid::Uuid
}

#[derive(Serialize)]
pub enum ReactionUpdateType {
	DELETED = 0,
	CREATED = 1
}

#[derive(Message, Serialize)]
#[rtype(result = "()")]
#[serde(rename_all="camelCase")]
pub struct ReactionUpdated {
	pub user_id: uuid::Uuid,
	pub emoji_name: String,
	pub message_id: uuid::Uuid,
	pub conversation_id: uuid::Uuid,
	pub update_type: ReactionUpdateType
}


#[derive(Message, Serialize, Deserialize)]
#[rtype(result = "()")]
pub struct ClientMessage {
	pub op: String,
	pub d: Option<serde_json::Value>
}

impl fmt::Display for ClientMessage {
	fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
		match &self.d {
			Some(d) => {
				write!(f, "ClientMessage {{ op: {}, d: {} }}", self.op, d)
			}
			None => {
				write!(f, "Client Message {{ op: {}, d: None }}", self.op)
			}
		}
  }
}

pub struct ListRooms;

impl actix::Message for ListRooms {
	type Result = Vec<String>;
}

#[derive(Message, Serialize, Deserialize)]
#[rtype(result = "Option<uuid::Uuid>")]
pub struct Auth {
	pub access_token: String,
	pub id: usize
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Join {
	pub id: usize,

	pub name: String
}

pub struct WsServer {
	sessions: HashMap<usize, Recipient<Message>>,
	users: HashMap<uuid::Uuid, HashSet<usize>>,
	#[allow(dead_code)]
	pool: DbPool,
	rng: ThreadRng,
	visitor_count: Arc<AtomicUsize>
}

impl WsServer {
	pub fn new(visitor_count: Arc<AtomicUsize>, pool: DbPool) -> WsServer {
		let users = HashMap::new();
		// rooms.insert("Main".to_owned(), HashSet::new());

		WsServer {
			sessions: HashMap::new(),
			users,
			pool,
			rng: rand::thread_rng(),
			visitor_count
		}
	}
}

impl WsServer {
	#[allow(dead_code)]
	pub fn send_message(&self, user_id: &uuid::Uuid, message: &ClientMessage) {
		if let Some(sessions) = self.users.get(user_id) {
			for id in sessions {
				if let Some(addr) = self.sessions.get(id) {
					addr.do_send(Message(serde_json::to_string(message).unwrap()));
				}
			}
		}
	}

	pub fn broadcast(&self, message: &ClientMessage) {
		for (_, addr) in &self.sessions {
			addr.do_send(Message(serde_json::to_string(message).unwrap()));
		}
	}
}

impl Actor for WsServer {
	type Context = Context<Self>;
}

impl Handler<Connect> for WsServer {
	type Result = usize;

	fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {

		let id = self.rng.gen::<usize>();
		self.sessions.insert(id, msg.addr);

		let count = self.visitor_count.fetch_add(1, Ordering::SeqCst);

		let d_count: serde_json::Value = serde_json::to_value(&count).unwrap();
		self.broadcast(&ClientMessage {op: "hi".to_string(), d: Some(d_count)});

		id
	}
}

impl Handler<ReactionUpdated> for WsServer {
	type Result = ();

	fn handle(&mut self, msg: ReactionUpdated, _: &mut Context<Self>) -> Self::Result {
		let conn = self.pool.get().unwrap();
		let user_id = msg.user_id;
		let conversation_id = msg.conversation_id;
		let user_ids = models::user::User::fetch_user_ids_by_conversation(&conversation_id, &user_id, &conn);
		match user_ids {
			Ok(user_ids) => {
				let d : serde_json::Value = serde_json::to_value(&msg).unwrap();
				let msg: ClientMessage = ClientMessage {
					op: "reaction_updated".to_string(),
					d: Some(d)
				};
				for user_id in user_ids {
					self.send_message(&user_id, &msg);
				}
			}
			_ => {}
		}
	}
}

impl Handler<MessageDeleted> for WsServer {
	type Result = ();

	fn handle(&mut self, msg: MessageDeleted, _: &mut Context<Self>) -> Self::Result {
		let conn = self.pool.get().unwrap();
		let user_id = msg.author_id;
		let conversation_id = msg.conversation_id;
		let user_ids = models::user::User::fetch_user_ids_by_conversation(&conversation_id, &user_id, &conn);
		match user_ids {
			Ok(user_ids) => {
				let d: serde_json::Value = serde_json::to_value(&msg).unwrap();
				let msg: ClientMessage = ClientMessage {
					op: "message_deleted".to_string(),
					d: Some(d)
				};
				for user_id in user_ids {
					self.send_message(&user_id, &msg);
				}
			}
			_ => {}
		}
	}
}

impl Handler<NewMessage> for WsServer {
	type Result = ();

	fn handle(&mut self, msg: NewMessage, _: &mut Context<Self>) -> Self::Result {
		let conn = self.pool.get().unwrap();
		let user_id = msg.message.author_id;
		let conversation_id = msg.message.conversation_id;
		let user_ids = models::user::User::fetch_user_ids_by_conversation(&conversation_id, &user_id, &conn);
		match user_ids {
			Ok(user_ids) => {
				let d : serde_json::Value = serde_json::to_value(&msg).unwrap();
				let msg: ClientMessage = ClientMessage {
					op: "new_message".to_string(),
					d: Some(d)
				};
				for user_id in user_ids {
					self.send_message(&user_id, &msg);
				}
			}
			_ => {}
		}
	}
}

impl Handler<NewUser> for WsServer {
	type Result = ();

	fn handle(&mut self, msg: NewUser, _: &mut Context<Self>) -> Self::Result {
		let d: serde_json::Value = serde_json::to_value(&msg).unwrap();
		let msg: ClientMessage = ClientMessage {
			op: "new_user".to_string(),
			d: Some(d)
		};

		self.broadcast(&msg)
	}
}

impl Handler<Auth> for WsServer {
	type Result = Option<uuid::Uuid>;

	fn handle(&mut self, msg: Auth, _: &mut Context<Self>) -> Self::Result {
		let user_id = models::user::User::verify_access_token(&msg.access_token[..]);
		let conn = self.pool.get().unwrap();
		match user_id {
			Some(user_id) => {
				let result = models::user::User::set_online(&user_id, &conn);
				let d : serde_json::Value = serde_json::to_value(user_id).unwrap();
				let message : ClientMessage = ClientMessage {
					op: "user_online".to_string(),
					d: Some(d)
				};
				self.users.entry(user_id).or_insert_with(HashSet::new).insert(msg.id);
				self.broadcast(&message);
				match result {
					Ok(_) => {},
					Err(_) => {}
				}
			}
			None => {}
		}
		user_id
	}
}

impl Handler<Disconnect> for WsServer {
	type Result = ();

	fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
		println!("Someone disconnected");

		if self.sessions.remove(&msg.id).is_some() {
			match msg.user_id {
				Some(user_id) => {
					let conn = self.pool.get().unwrap();
					let result = models::user::User::set_offline(&user_id, &conn);
					let d : serde_json::Value = serde_json::to_value(user_id).unwrap();
					let message : ClientMessage = ClientMessage {
						op: "user_offline".to_string(),
						d: Some(d)
					};
					self.broadcast(&message);
					match result {
						_ => {}
					}
					for sessions in self.users.get(&user_id) {
						sessions.to_owned().remove(&msg.id);
					}
				}
				None => {}
			}
		}
	}
}
use std::time::{Duration, Instant};

use actix::prelude::*;
use actix_web_actors::ws;
use serde::{Deserialize, Serialize};

use crate::ws_server;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct SocketSession {
	pub id: usize,

	pub hb: Instant,

	pub user_id: Option<uuid::Uuid>,

	pub addr: Addr<ws_server::WsServer>
}

impl SocketSession {
	fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
		ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
			if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
				println!("Websocket client heartbeat failed, disconnecting!");

				act.addr.do_send(ws_server::Disconnect {id: act.id, user_id: act.user_id});

				ctx.stop();

				return;
			}

			ctx.ping(b"");
		});
	}
}

impl Actor for SocketSession {
	type Context = ws::WebsocketContext<Self>;

	fn started(&mut self, ctx: &mut Self::Context) {
		self.hb(ctx);

		let addr = ctx.address();
		self.addr
			.send(ws_server::Connect {
				addr: addr.recipient(),
			})
			.into_actor(self)
			.then(|res, act, ctx| {
				match res {
					Ok(res) => act.id = res,

					_ => ctx.stop(),
				}
				fut::ready(())
			})
			.wait(ctx);
	}

	fn stopping(&mut self, _: &mut Self::Context) -> Running {
        self.addr.do_send(ws_server::Disconnect { id: self.id, user_id: self.user_id });
        Running::Stop
    }
}

impl Handler<ws_server::Message> for SocketSession {
    type Result = ();

    fn handle(&mut self, msg: ws_server::Message, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

#[derive(Serialize, Deserialize)]
struct Msg {
	op: String,
	d: serde_json::Value
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for SocketSession {
	fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
		let msg = match msg {
			Err(_) => {
				ctx.stop();
				return;
			}
			Ok(msg) => msg
		};

		log::debug!("WEBSOCKET MESSAGE: {:?}", msg);

		match msg {
			ws::Message::Ping(msg) => {
				self.hb = Instant::now();
				println!("ping");
				ctx.pong(&msg);
			}
			ws::Message::Pong(_) => {
				self.hb = Instant::now();
			}
			ws::Message::Text(text) => {
				let raw = text.trim();
				let m: Msg = serde_json::from_str(raw).unwrap();
				
				print!("socket id {}", self.id);

				match &m.op[..] {
					"hello" => {
							ctx.text(format!("!!! unknown command: {:?}", m.op));
					},
					"auth" => {
						println!("auth");
						let access_token: String = serde_json::from_value(m.d).unwrap();
						self.addr
							.send(ws_server::Auth {
								access_token: access_token,
								id: self.id
							})
							.into_actor(self)
							.then(|res, act, ctx| {
								match res {
									Ok(user_id) => {
										let res : Msg = Msg {
											op: "auth-good".to_string(),
											d: serde_json::value::to_value(user_id).unwrap()
										};
										act.user_id = user_id;
										ctx.text(serde_json::to_string(&res).unwrap());
									}
									_ => println!("Auth error")
								}
								fut::ready(())
							})
							.wait(ctx)
					},
					_ => {
						ctx.text(format!("!!! unknown command: {:?}", m.op));
					}
				}
			}
			ws::Message::Binary(_) => println!("Unexpected binary"),
			ws::Message::Close(reason) => {
				ctx.close(reason);
				ctx.stop();
			}
			ws::Message::Continuation(_) => {
				ctx.stop();
			}
			ws::Message::Nop => ()
		}
	}
}

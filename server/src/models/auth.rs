use actix_web::{Error, HttpRequest,FromRequest, dev, error::{ErrorUnauthorized}};
use futures::future::{Ready, err, ok};
use crate::models::user::User;

pub struct Auth;

impl FromRequest for Auth {
	type Error = Error;
	type Future = Ready<Result<Auth, Error>>;

	fn from_request(req: &HttpRequest, _: &mut dev::Payload) -> Self::Future {
		let access_token_header = req.headers().get("X-Access-Token");
		match access_token_header {
			Some(_) => {
				let split = access_token_header.unwrap().to_str().unwrap();
				let access_token = split.trim();
				let user_id = User::verify_access_token(&access_token);
				match user_id {
					Some(_) => ok(Auth),
					None => err(ErrorUnauthorized("not authorized"))
				}
			}
			None => err(ErrorUnauthorized("not authorized"))
		}
	}
}
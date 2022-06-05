use actix_web::{
  web, HttpRequest, get, HttpResponse, post
};
use crate::lib::{DbPool, ErrorField};
use serde::{Serialize, Deserialize};
use crate::models;
use chrono::Utc;
use sha1::{Sha1, Digest};
use std::env;
use std::{fmt::Write};

#[get("/user/list")]
pub async fn list_user(
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let users = models::user::User::fetch_all(&conn);
    match users {
        Ok(users) => {
            HttpResponse::Ok().json(users)
        }
        Err(_) => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct ChangeAvatarBody {
    pub avatar_url: String
}

pub fn encode_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        write!(&mut s, "{:02x}", b).unwrap();
    }
    s
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all="camelCase")]
pub struct SignedSignature {
    pub signature: String,
    pub api_key: String,
    pub timestamp: i64,
}

#[get("/image/signed-signature")]
pub async fn get_signed_signature() -> HttpResponse {
    let cloudinary_api_key = env::var("CLOUDINARY_API_KEY").expect("CLOUDINARY_API_KEY is not set in .env file");
    let cloudinary_api_secret = env::var("CLOUDINARY_API_SECRET").expect("CLOUDINARY_API_SECRET is not set in .env file");
    let timestamp = Utc::now().timestamp();
    println!("timestamp {}, cloudinary_api_secret {}", timestamp, cloudinary_api_secret);
    let signed_params = format!("folder=tinychat&timestamp={}{}",timestamp, cloudinary_api_secret);
    let mut hasher = Sha1::new();
    hasher.update(signed_params.as_bytes());
    let hashed_signature: [u8; 20] = hasher.finalize().as_slice().try_into().expect("wrong length");
    let signature = encode_hex(&hashed_signature);
    let signed_signature_resp = SignedSignature {
        signature,
        api_key: cloudinary_api_key,
        timestamp
    };

    HttpResponse::Ok().json(signed_signature_resp)
}

#[post("/user/change-avatar")]
pub async fn change_avatar(
    _: models::auth::Auth, 
    req: HttpRequest, 
    body: web::Json<ChangeAvatarBody>, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let avatar_url = body.into_inner().avatar_url;
    let user_id = models::user::User::get_id_from_req(&req);
    match models::user::User::update_avatar(&user_id.unwrap(), &avatar_url, &conn) {
        Ok(_) => {
            HttpResponse::Ok().json(true)
        }
        _ => {
            HttpResponse::Ok().json(false)
        }
    }

}

#[get("/me")]
pub async fn me(
    pool: web::Data<DbPool>,
    req: HttpRequest
) -> HttpResponse {
    let conn = pool.get().unwrap();
    match req.headers().get("X-Access-Token") {
        None => {
            let mut errors: Vec<ErrorField> = Vec::new();
            errors.push(ErrorField {path: String::from("accessToken"), messages: vec![String::from("access token cannot be blank")]});
            HttpResponse::Unauthorized().json(errors)
        },
        Some(access_token) => {
            match access_token.to_str() {
                Ok(access_token) => {
                  let user_id = models::user::User::verify_access_token(&access_token);
                  match user_id {
                    Some(user_id) => {
                        let user = models::user::User::find_by_id(&user_id, &conn).unwrap();
                        HttpResponse::Ok().json(user)
                    },
                    None => {
                        let mut errors: Vec<ErrorField> = Vec::new();
                        errors.push(ErrorField {path: String::from("accessToken"), messages: vec![String::from("access token cannot be blank")]});
                        HttpResponse::Unauthorized().json(errors)
                    }
                  }
                },
                Err(_) => {
                    let mut errors: Vec<ErrorField> = Vec::new();
                    errors.push(ErrorField {path: String::from("accessToken"), messages: vec![String::from("access token cannot be blank")]});
                    HttpResponse::Unauthorized().json(errors)  
                }
            }
        }
    }
}
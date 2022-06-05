use actix_web::{
   post, get, web, HttpResponse
};
use serde::{Deserialize, Serialize};
use ::{http::{Method, header::HeaderMap}};
use crate::lib::{DbPool, ErrorField};
use crate::models;

use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{CsrfToken, Scope, AuthorizationCode, TokenResponse};
use actix_web::http::header;
use url::Url;
use std::env;
use actix::*;
use crate::ws_server;

#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct RegisterResponse {
    access_token: String,
    refresh_token: String,
    user: models::user::User
}

#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct LoginResponse {
    access_token: String,
    refresh_token: String,
    user: models::user::User
}

#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct RefreshTokenResponse {
    access_token: String,
    refresh_token: String
}

#[post("/register")]
pub async fn register(
    pool: web::Data<DbPool>,
    input: web::Json<models::user::NewUser>,
    ws_server: web::Data<Addr<ws_server::WsServer>>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    
    let hashed_password = models::user::User::hash_password(&input.password);

    let mut errors: Vec<ErrorField> = Vec::new();
    if input.username.len() == 0 {
        errors.push(ErrorField {path: String::from("username"), messages: vec![String::from("username cannot be blank")]});
    } else if input.username.len() < 3 {
        errors.push(ErrorField {path: String::from("username"), messages: vec![String::from("username length must be greater than 2")]});
    } else if input.username.len() > 255 {
        errors.push(ErrorField {path: String::from("username"), messages: vec![String::from("username length must be less than 255")]});
    };

    if input.password.len() == 0 {
        errors.push(ErrorField {path: String::from("password"), messages: vec![String::from("password cannot be blank")]});
    } else if input.password.len() < 3 {
        errors.push(ErrorField {path: String::from("password"), messages: vec![String::from("password length must be greater than 2")]});        
    };

    if errors.len() > 0 {
        return HttpResponse::BadRequest().json(errors);
    };

    if hashed_password.is_none() {
        return HttpResponse::InternalServerError().finish();
    }

    let result = web::block(move || {
        let new_user = models::user::NewUser {
            username: input.username.to_string(),
            password: hashed_password.unwrap(),
            account_type: None,
            google_id: None
        };
        models::user::User::insert_user(&new_user, &conn)
    }).await;

    match result {
        Ok(Ok(user))  => {
            let access_token = models::user::User::create_access_token(&user.id);
            let refresh_token = models::user::User::create_refresh_token(&user.id);

            if access_token.is_none() || refresh_token.is_none() {
               return HttpResponse::InternalServerError().finish();
            };

            let res: RegisterResponse  = RegisterResponse{
                access_token: access_token.unwrap(),
                refresh_token: refresh_token.unwrap(),
                user: user.clone()
            };
            ws_server.into_inner().send(ws_server::NewUser {
                user: user.clone()
            }).await.unwrap();
            HttpResponse::Created().json(res)
        },
        Ok(Err(diesel::result::Error::DatabaseError(diesel::result::DatabaseErrorKind::UniqueViolation, _))) => {
            let mut errors: Vec<ErrorField> = Vec::new();
            errors.push(ErrorField {path: String::from("username"), messages: vec![String::from("username already exist")]});
            HttpResponse::BadRequest().json(errors)
        },
        _ => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[post("/login")]
pub async fn login(
    pool: web::Data<DbPool>,
    input: web::Json<models::user::NewUser>
) -> HttpResponse {
    let username = &input.username;
    let password = &input.password;
    let conn = pool.get().unwrap();
    let result = models::user::User::find_user_by_username(&username, true, &conn);

    match result {
        Ok(user) => {
            let is_match = models::user::User::verify_password(&password, &user.password);
            match is_match {
                false => {
                    let mut errors: Vec<ErrorField> = Vec::new();
                    errors.push(ErrorField {path: String::from("password"), messages: vec![String::from("password incorrect")]});
                    HttpResponse::BadRequest().json(errors)
                },
                true => {
                    let access_token = models::user::User::create_access_token(&user.id);
                    let refresh_token = models::user::User::create_refresh_token(&user.id);

                    if access_token.is_none() || refresh_token.is_none() {
                        return HttpResponse::InternalServerError().finish();
                    };

                    let res: LoginResponse  = LoginResponse{
                        access_token: access_token.unwrap(),
                        refresh_token: refresh_token.unwrap(),
                        user: user
                    };
                    HttpResponse::Created().json(res)
                }
            }
        },
        Err(diesel::result::Error::NotFound) => {
            let mut errors: Vec<ErrorField> = Vec::new();
            errors.push(ErrorField {path: String::from("username"), messages: vec![String::from("username do not exist")]});
            HttpResponse::NotFound().json(errors)  
        },
        Err(_) => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/google/login")]
pub async fn google_login(
    google_oauth: web::Data<BasicClient>
) -> HttpResponse {
    // let (pkce_code_challenge, _pkce_code_verifier) = PkceCodeChallenge::new_random_sha256();

    let (authorize_url, _csrf_state) = &google_oauth.into_inner()
    .authorize_url(CsrfToken::new_random)
    .add_scope(Scope::new(
        "https://www.googleapis.com/auth/userinfo.profile".to_string()
    ))    
    .add_scope(Scope::new(
        "https://www.googleapis.com/auth/userinfo.email".to_string()
    ))
    .url();

    HttpResponse::Found()
        .append_header((header::LOCATION, authorize_url.to_string()))
        .finish()
}

#[derive(Deserialize)]
pub struct GoogleCallbackQuery {
    code: String
}

#[derive(Deserialize, Serialize)]
pub struct GoogleUserInfo {
    id: String,
    email: String,
    verified_email: bool,
    name: Option<String>,
    picture: Option<String>,
    given_name: Option<String>,
    family_name: Option<String>,
    locale: Option<String>,
}

#[get("/auth/google/callback")]
pub async fn google_callback(
    google_oauth: web::Data<BasicClient>,
    params: web::Query<GoogleCallbackQuery>,
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let param_code = params.into_inner().code;
    let code = AuthorizationCode::new(param_code.clone());
    let frontend_url = env::var("FRONTEND_URL")
        .expect("`FRONTEND_URL` is not set in .env file");

    let token = {
        google_oauth.into_inner()
        .exchange_code(code)
        .request_async(async_http_client)
        .await.unwrap()
    };

    let access_token = token.access_token().secret();

    let user_info_url = Url::parse(
        format!(
            "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token={}",
            access_token
        ).as_str()
    )
    .unwrap();

    let resp = async_http_client(oauth2::HttpRequest {
        url: user_info_url,
        method: Method::GET,
        headers: HeaderMap::new(),
        body: Vec::new()
    })
    .await.unwrap();

    let user_info: GoogleUserInfo = serde_json::from_slice(&resp.body).unwrap();

    let user_record = models::user::User::fetch_by_google_id(&user_info.id, &conn);

    let user = match user_record {
        Ok(user) => {
            println!("found user"); 
            Some(user)
        }
        Err(diesel::result::Error::NotFound) => {
            println!("not found user");
            let new_user = models::user::NewUser {
                username: "".to_string(),
                password: "".to_string(),
                account_type: Some("google".to_string()),
                google_id: Some(user_info.id)
            };
            match models::user::User::insert_user(&new_user, &conn) {
                Ok(user) => Some(user),
                _ => None
            }
        }
        _ => None
    };

    let frontend_oauth_token_url = format!("{}/oauth_token", frontend_url);
    if let Some(user) = user {
        let access_token = models::user::User::create_access_token(&user.id);
        let refresh_token = models::user::User::create_refresh_token(&user.id);
        let redirect_url = format!("{}?access_token={}&refresh_token={}", frontend_oauth_token_url, access_token.unwrap(), refresh_token.unwrap());
        return HttpResponse::Found()
            .append_header((header::LOCATION, redirect_url))
            .finish();
    } else {
        return HttpResponse::Found()
            .append_header((header::LOCATION, frontend_oauth_token_url))
            .finish();
    }
}

#[post("/refresh-token")]
pub async fn refresh_token_route(
    input: web::Json<models::user::RefreshToken>
) -> HttpResponse {
    let user_id = models::user::User::verify_refresh_token(&input.refresh_token);
    match user_id {
        Some(user_id) => {
            let access_token = models::user::User::create_access_token(&user_id);
            let refresh_token = models::user::User::create_refresh_token(&user_id);

            if access_token.is_none() || refresh_token.is_none() {
                let mut errors: Vec<ErrorField> = Vec::new();
                errors.push(ErrorField {path: String::from("refreshToken"), messages: vec![String::from("refresh token invalid")]});
                return HttpResponse::BadRequest().json(errors);
            };
            HttpResponse::Ok().json(RefreshTokenResponse {access_token: access_token.unwrap(), refresh_token: refresh_token.unwrap()})
        },
        None => {
            let mut errors: Vec<ErrorField> = Vec::new();
            errors.push(ErrorField {path: String::from("refreshToken"), messages: vec![String::from("refresh token invalid")]});
            HttpResponse::BadRequest().json(errors)
        }
    }
}
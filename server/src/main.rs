#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;

use std::{
    sync::{
        atomic::{AtomicUsize},
        Arc,
    },
    time::Instant,
    collections::HashMap,
    fs,
    io,
    env
};
use actix_web::{
    middleware,get, web, App,HttpServer,HttpRequest, HttpResponse, Error
};
use oauth2::{AuthUrl, TokenUrl, ClientId, ClientSecret, RedirectUrl};
use oauth2::basic::BasicClient;
use dotenv;
use actix::*;
use actix_web_actors::ws;
// use diesel_migrations::;

pub mod socket_session;
pub mod lib;
pub mod models;
pub mod route;
pub mod schema;
pub mod ws_server;

embed_migrations!();

#[get("/ws")]
async fn websocket_route(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<ws_server::WsServer>>
) -> Result<HttpResponse, Error>{
    ws::start(
        socket_session::SocketSession {
            id: 0,
            hb: Instant::now(),
            user_id: None,
            addr: srv.get_ref().clone()
        }, &req, stream)
}

#[actix_rt::main]
async fn main() -> io::Result<()> {
    dotenv::dotenv().ok();

    let pool = lib::create_pool();
    let conn = pool.get().unwrap();
    embedded_migrations::run(&conn).expect("migration err");
    let port = env::var("PORT")
        .expect("`PORT` is not set in .env file").parse::<u16>().unwrap();

    let app_state = Arc::new(AtomicUsize::new(0));

    let ws_server = ws_server::WsServer::new(app_state.clone(), pool.clone()).start();

    let emoji_map_string = fs::read_to_string("emoji_map.json")
        .expect("Unable to read `emoji_map.json`");
    let emoji_map_json: serde_json::Value = serde_json::from_str(&emoji_map_string)
        .expect("emoji_map does not have correct format");
    let emoji_map: HashMap<String, String> = serde_json::from_value(emoji_map_json)
        .expect("emoji_map_json does not have correct structure");
    let google_client_id = ClientId::new(
        env::var("GOOGLE_CLIENT_ID")
        .expect("`GOOGLE_CLIENT_ID is not set in .env file`")    
    );
    let google_client_secret = ClientSecret::new(
        env::var("GOOGLE_CLIENT_SECRET")
        .expect("`GOOGLE_CLIENT_SECRET is not set in .env file`")
    );
    let base_url = env::var("BASE_URL").expect("`BASE_URL` is not set in .env file");
    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
        .expect("Invalid authorization endpoint URL");
    let token_url = TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string())
        .expect("Invalid token endpoint URL");

    let google_client = BasicClient::new(
        google_client_id,
        Some(google_client_secret),
        auth_url,
        Some(token_url)
    )
    .set_redirect_uri(
        RedirectUrl::new(format!("{}/auth/google/callback", base_url))
            .expect("Invalid redirect URL")
    );
    
    
    HttpServer::new(move || {
        let cors = actix_cors::Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS", "HEAD"])
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::from(app_state.clone()))
            .app_data(web::Data::new(ws_server.clone()))
            .app_data(web::Data::new(emoji_map.clone()))
            .app_data(web::Data::new(google_client.clone()))
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(websocket_route)
            .service(route::auth::register)
            .service(route::auth::login)
            .service(route::auth::google_login)
            .service(route::auth::google_callback)
            .service(route::user::me)
            .service(route::user::list_user)
            .service(route::user::get_signed_signature)
            .service(route::user::change_avatar)
            .service(route::auth::refresh_token_route)
            .service(route::conversation::get_conversation_members)
            .service(route::conversation::get_conversation_users)
            .service(route::conversation::get_conversation_by_recipient)
            .service(route::conversation::get_conversations_for_user)
            .service(route::conversation::get_conversation_by_id)
            .service(route::message::create_message)
            .service(route::message::delete_message)
            .service(route::message::get_messages_by_conversation)
            .service(route::message::create_reaction)
            .service(route::message::delete_reaction)
            .service(route::message::search_giphy)
    })
    .bind(("0.0.0.0", port))
    .expect(format!("Cannot bind to port {}", port).as_str())
    .run()
    .await
}

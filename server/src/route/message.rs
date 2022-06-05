use std::collections::HashMap;
use actix_web::{
   get, web, http, HttpRequest, post, put, delete, HttpResponse
};
use serde::{Serialize, Deserialize};
use std::env;
use crate::lib::{DbPool};
use actix::*;
use crate::models;
use crate::ws_server;

#[delete("/message/{message_id}/conversation/{conversation_id}")]
pub async fn delete_message(
    _: models::auth::Auth,
    path: web::Path<(uuid::Uuid, uuid::Uuid)>,
    req: HttpRequest, pool: web::Data<DbPool>,
    ws_server: web::Data<Addr<ws_server::WsServer>>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let (message_id, conversation_id) = path.into_inner();
    let user_id = models::user::User::get_id_from_req(&req).unwrap();
    let member = models::member::Member::get_member_or_throw(&user_id, &conversation_id, &conn);

    match member {
        Ok(_) => {
            let result = models::message::Message::delete_message(&message_id, &user_id, &conn);
            match result {
                Ok(affected_rows) => {
                    if affected_rows > 0 {
                        ws_server.into_inner().send(ws_server::MessageDeleted {
                            message_id,
                            author_id: user_id,
                            conversation_id
                        }).await.unwrap();
                        return HttpResponse::Ok().json(true);
                    } else {
                        return HttpResponse::Ok().json(false);
                    }
                }
                _ => return HttpResponse::InternalServerError().finish()
            }
        }
        Err(_) => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[put("/message/{message_id}/conversation/{conversation_id}/reaction/{emoji_name}")]
pub async fn create_reaction(
    _: models::auth::Auth, 
    path: web::Path<(uuid::Uuid, uuid::Uuid, String)>, 
    req: HttpRequest, pool: web::Data<DbPool>,
    emoji_map: web::Data<HashMap<String, String>>,
    ws_server: web::Data<Addr<ws_server::WsServer>>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let (message_id, conversation_id, emoji_name) = path.into_inner();
    let emoji_map = emoji_map.into_inner();
    let emoji_unicode = emoji_map.get(&emoji_name);
    match emoji_unicode {
        Some(unicode) => {
            println!("unicode found {}", unicode);
            let user_id = models::user::User::get_id_from_req(&req);
            let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
            match member {
                Ok(_) => {
                    let result = models::message::Message::create_reaction(
                        &user_id.unwrap(), &conversation_id, &message_id, &emoji_name, &conn
                    );
                    match result {
                        Ok(affected_rows) => {
                            if affected_rows > 0 {
                                ws_server.into_inner().send(ws_server::ReactionUpdated {
                                    conversation_id,
                                    message_id,
                                    user_id: user_id.unwrap(),
                                    emoji_name,
                                    update_type: ws_server::ReactionUpdateType::CREATED
                                }).await.unwrap();
                                return HttpResponse::build(http::StatusCode::OK).json(true);
                            } else {
                                return HttpResponse::build(http::StatusCode::OK).json(false);
                            }
                        }
                        Err(_) => {
                            HttpResponse::InternalServerError().finish()
                        }
                    }
                }
                Err(_) => {
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        None => {
            println!("unicode not found");
            HttpResponse::BadRequest().finish()
        }
    }
}

#[delete("/message/{message_id}/conversation/{conversation_id}/reaction/{emoji_name}")]
pub async fn delete_reaction(
    _: models::auth::Auth, 
    path: web::Path<(uuid::Uuid, uuid::Uuid, String)>, 
    req: HttpRequest, pool: web::Data<DbPool>,
    ws_server: web::Data<Addr<ws_server::WsServer>>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let (message_id, conversation_id, emoji_name) = path.into_inner();
    let user_id = models::user::User::get_id_from_req(&req);
    let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
    match member {
        Ok(_) => {
            let result = models::message::Message::delete_reaction(
                &user_id.unwrap(), &conversation_id, &message_id, &emoji_name, &conn
            );
            match result {
                Ok(affected_rows) => {
                    if affected_rows > 0 {
                        ws_server.into_inner().send(ws_server::ReactionUpdated {
                            conversation_id,
                            message_id,
                            user_id: user_id.unwrap(),
                            emoji_name,
                            update_type: ws_server::ReactionUpdateType::DELETED
                        }).await.unwrap();
                        return HttpResponse::Ok().json(true);
                    } else {
                        return HttpResponse::Ok().json(false);
                    }
                }
                Err(err) => {
                    println!("delete reaction error {}", err);
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        _ => {
            HttpResponse::InternalServerError().finish()
        }
    }
}


#[get("/message/conversation/{conversation_id}/list")]
pub async fn get_messages_by_conversation(
    _: models::auth::Auth, 
    path: web::Path<uuid::Uuid>, 
    req: HttpRequest, query: web::Query<models::pagination::Options>, 
    pool: web::Data<DbPool>
) -> HttpResponse {   
    let conn = pool.get().unwrap();
    let conversation_id = path.into_inner();
    let user_id = models::user::User::get_id_from_req(&req);
    let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
    let options = query.into_inner();
    let messages = models::message::Message::fetch_by_conversation(&conversation_id,&options, &conn);
    match member {
        Ok(_) => {
            match messages {
                Ok(messages) => {
                    HttpResponse::Ok().json(messages)
                }
                Err(_) => {
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        _ => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[post("message/create")]
pub async fn create_message(_: models::auth::Auth ,
    input: web::Json<models::message::CreateMessageBody>, 
    req: HttpRequest, pool: web::Data<DbPool>, 
    ws_server: web::Data<Addr<ws_server::WsServer>>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let user_id = models::user::User::get_id_from_req(&req).unwrap();
    let message_content = input.content.to_owned();
    let new_message = models::message::NewMessage::new(models::message::NewMessage {
        author_id: user_id,
        conversation_id: input.conversation_id,
        content: input.content.to_owned(),
        is_image: input.is_image
    });
    if message_content.is_none() {
        return HttpResponse::BadRequest().finish();
    } else if message_content.unwrap().trim().is_empty() {
        return HttpResponse::BadRequest().finish();
    }
    let member = models::member::Member::get_member_or_throw(&user_id, &input.conversation_id, &conn);
    
    match member {
        Ok(_) => {
            let message = models::message::Message::insert_one(&new_message, &conn);
            match message {
                Ok(message) => {
                    println!("get message");
                    let author = models::user::User::find_by_id(&user_id, &conn);
                    match author {
                        Ok(author) => {
                            models::conversation::Conversation::update_last_message(
                                &message.conversation_id, 
                                &message.id, &models::conversation::LastMessageDisplay {
                                    content: message.content.to_owned(),
                                    user_id: Some(message.author_id),
                                    created_at: Some(message.created_at),
                                    user_name: Some(author.username.to_owned())
                                }, &conn).expect("update last message failure");
                            #[allow(dead_code)]
                            ws_server.into_inner().send(ws_server::NewMessage {
                                message: message.clone(),
                                author: author
                            }).await.unwrap();
                        },
                        _ => {}
                    }
                    HttpResponse::Ok().json(message)
                }
                Err(_) => {
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        _ => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchGiphyQuery {
    q: String
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GiphyGifImage {
    height: String,
    width: String,
    url: String
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GiphyGifImages {
    fixed_height: Option<GiphyGifImage>,
    fixed_height_small: Option<GiphyGifImage>,
    original: GiphyGifImage
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GiphyGifObject {
    id: String,
    images: GiphyGifImages
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GifObject {
    width: i32,
    height: i32,
    url: String
}

#[get("giphy/search")]
pub async fn search_giphy(
    search_giphy_query: web::Query<SearchGiphyQuery>
) -> HttpResponse {
    let giphy_api_key = env::var("GIPHY_API_KEY").expect("GIPHY_API_KEY is not set in .env file");
    let res: serde_json::Value = reqwest::get(
        format!("https://api.giphy.com/v1/gifs/search?api_key={}&q={}&limit=10&bundle=messaging_non_clips", giphy_api_key, search_giphy_query.into_inner().q)
    ).await.unwrap().json::<serde_json::Value>()
    .await.unwrap();

    let giphy_data = res.get("data").unwrap();
    let giphy_gif_objects: Vec<GiphyGifObject> = serde_json::from_value(giphy_data.to_owned()).unwrap();
    let mut gifs :Vec<GifObject> = Vec::new();

    for giphy_gif_object in giphy_gif_objects.iter() {
        let GiphyGifObject {images , ..} = giphy_gif_object;
        let GiphyGifImages { fixed_height, fixed_height_small, original } = images;
        if fixed_height_small.is_some() {
            let fixed_height_small = fixed_height_small.clone().unwrap();
            let GiphyGifImage { url, height, width } = fixed_height_small;
            gifs.push(GifObject {
                url: url,
                width: width.parse().unwrap(),
                height: height.parse().unwrap()
            });
        } else if fixed_height.is_some() {
            let fixed_height = fixed_height.clone().unwrap();
            let GiphyGifImage {url, height, width} = fixed_height;
            gifs.push(GifObject {
                url: url,
                width: width.parse().unwrap(),
                height: height.parse().unwrap()
            });
        } else {
            let GiphyGifImage {width, height, url} = original;
            gifs.push(GifObject {
                url: url.to_string(),
                width: width.parse().unwrap(),
                height: height.parse().unwrap()
            });
        }
    }

    HttpResponse::Ok().json(gifs)
}
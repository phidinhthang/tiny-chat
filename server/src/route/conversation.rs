use actix_web::{
   get, web, HttpRequest, HttpResponse
};
use crate::lib::{DbPool};
use crate::models;

#[get("/conversation/{conversation_id}")]
pub async fn get_conversation_by_id(
    _: models::auth::Auth, 
    req: HttpRequest, 
    path: web::Path<uuid::Uuid>, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conversation_id = path.into_inner();
    let conn = pool.get().unwrap();
    let user_id = models::user::User::get_id_from_req(&req);
    let conversation = models::conversation::Conversation::fetch_by_id(&conversation_id, &conn);
    let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
    match member {
        Ok(_) => {
            match conversation {
                Ok(conversation) => {
                    HttpResponse::Ok().json(conversation)
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

#[get("/conversation/recipient/{recipient_id}")]
pub async fn get_conversation_by_recipient(_: models::auth::Auth, 
    req: HttpRequest, 
    path: web::Path<uuid::Uuid>, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let recipient_id = path.into_inner();
    let conn = pool.get().unwrap();
    let user_id = models::user::User::get_id_from_req(&req);
    let conversation = models::conversation::Conversation::get_by_recipient(&recipient_id, &user_id.unwrap() , &conn);
    match conversation {
        Ok(conversation) => {
            HttpResponse::Ok().json(conversation)
        }
        Err(_) => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/conversation/list")]
pub async fn get_conversations_for_user(_: models::auth::Auth, 
    req: HttpRequest, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let user_id = models::user::User::get_id_from_req(&req);
    let conversations = models::conversation::Conversation::fetch_by_user_id(&user_id.unwrap(), &conn);
    match conversations {
        Ok(conversations) => {
            HttpResponse::Ok().json(conversations)
        }
        Err(_) => {
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/conversation/{conversation_id}/members")]
pub async fn get_conversation_members(
    _: models::auth::Auth, 
    req: HttpRequest,
    path: web::Path<uuid::Uuid>, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let conversation_id = path.into_inner();
    let user_id = models::user::User::get_id_from_req(&req);
    let members = models::member::Member::fetch_by_conversation(&conversation_id, &conn);
    let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
    match member {
        Ok(_) => {
            match members {
                Ok(members) => {
                    HttpResponse::Ok().json(members)
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

#[get("/conversation/{conversation_id}/users")]
pub async fn get_conversation_users(_: models::auth::Auth, 
    req: HttpRequest, 
    path: web::Path<uuid::Uuid>, 
    pool: web::Data<DbPool>
) -> HttpResponse {
    let conn = pool.get().unwrap();
    let conversation_id = path.into_inner();
    let users = models::user::User::fetch_users_by_conversation(&conversation_id, &conn);
    let user_id = models::user::User::get_id_from_req(&req);
    let member = models::member::Member::get_member_or_throw(&user_id.unwrap(), &conversation_id, &conn);
    match member {
        Ok(_) => {
            match users {
                Ok(users) => {
                    HttpResponse::Ok().json(users)
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
table! {
    conversations (id) {
        id -> Uuid,
        name -> Nullable<Varchar>,
        admin_id -> Nullable<Uuid>,
        last_message_id -> Nullable<Uuid>,
        last_message_display -> Jsonb,
        created_at -> Timestamptz,
        is_group -> Bool,
        withs -> Nullable<Jsonb>,
    }
}

table! {
    members (conversation_id, user_id) {
        conversation_id -> Uuid,
        user_id -> Uuid,
        last_read_at -> Nullable<Timestamptz>,
        joined_at -> Timestamptz,
        nick -> Nullable<Varchar>,
        avatar -> Nullable<Varchar>,
        is_kicked -> Bool,
        is_banned -> Bool,
    }
}

table! {
    messages (id) {
        id -> Uuid,
        author_id -> Uuid,
        conversation_id -> Uuid,
        content -> Nullable<Text>,
        is_deleted -> Bool,
        created_at -> Timestamptz,
        updated_at -> Nullable<Timestamptz>,
        reactions -> Jsonb,
        is_image -> Bool,
    }
}

table! {
    users (id) {
        id -> Uuid,
        username -> Varchar,
        password -> Varchar,
        is_online -> Bool,
        last_online_at -> Nullable<Timestamptz>,
        account_type -> Text,
        google_id -> Nullable<Text>,
        avatar_url -> Nullable<Text>,
    }
}

joinable!(members -> conversations (conversation_id));
joinable!(members -> users (user_id));
joinable!(messages -> conversations (conversation_id));
joinable!(messages -> users (author_id));

allow_tables_to_appear_in_same_query!(
    conversations,
    members,
    messages,
    users,
);

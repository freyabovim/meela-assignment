use std::env;
use uuid::Uuid;
use poem::{
    EndpointExt, Route, Server,
    error::ResponseError,
    handler, post,
    http::StatusCode,
    listener::TcpListener,
    web::{Data, Json},
};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    Var(#[from] std::env::VarError),
    #[error(transparent)]
    Dotenv(#[from] dotenv::Error),
}

impl ResponseError for Error {
    fn status(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

async fn init_pool() -> Result<SqlitePool, Error> {
    let pool = SqlitePool::connect(&env::var("DATABASE_URL")?).await?;
    Ok(pool)
}

#[derive(Deserialize)]
struct SaveFormRequest {
    user_id: Option<String>,
    form_step: i32,
    email: String,
    therapy_for_whom: String,
    therapist_gender: String,
}

#[derive(Serialize)]
struct SaveFormResponse {
    user_id: String,
}

#[derive(Deserialize)]
struct LoadFormRequest {
    user_id: String,
}

#[derive(Serialize)]
struct LoadFormResponse {
    user_id: Option<String>,
    form_step: Option<i32>,
    email: Option<String>,
    therapy_for_whom: Option<String>,
    therapist_gender: Option<String>,
}

#[handler]
async fn save_form_data(
    Data(pool): Data<&SqlitePool>,
    Json(req): Json<SaveFormRequest>,
) -> Result<Json<SaveFormResponse>, Error> {
    let user_id = if req.user_id.is_none() || req.user_id.as_ref().map_or(true, |s| s.is_empty()) {
        Uuid::new_v4().to_string()
    } else {
        req.user_id.unwrap()
    };

    sqlx::query!(
        "INSERT OR REPLACE INTO form_data (user_id, form_step, email, therapy_for_whom, therapist_gender, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)",
        user_id,
        req.form_step,
        req.email,
        req.therapy_for_whom,
        req.therapist_gender
    )
    .execute(pool)
    .await?;

    Ok(Json(SaveFormResponse { user_id }))
}

#[handler]
async fn load_form_data(
    Data(pool): Data<&SqlitePool>,
    Json(req): Json<LoadFormRequest>,
) -> Result<Json<LoadFormResponse>, Error> {
    let result = sqlx::query!(
        "SELECT user_id, form_step, email, therapy_for_whom, therapist_gender FROM form_data WHERE user_id = $1",
        req.user_id
    )
    .fetch_optional(pool)
    .await?;

    match result {
        Some(row) => Ok(Json(LoadFormResponse {
            user_id: row.user_id,
            form_step: Some(row.form_step as i32),
            email: row.email,
            therapy_for_whom: row.therapy_for_whom,
            therapist_gender: row.therapist_gender,
        })),
        None => Ok(Json(LoadFormResponse {
            user_id: Some(req.user_id),
            form_step: Some(1),
            email: None,
            therapy_for_whom: None,
            therapist_gender: None,
        })),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv::dotenv()?;
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let pool = init_pool().await?;
    let app = Route::new()
        .at("/api/save-form", post(save_form_data))
        .at("/api/load-form", post(load_form_data))
        .data(pool);
    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .run(app)
        .await?;

    Ok(())
}
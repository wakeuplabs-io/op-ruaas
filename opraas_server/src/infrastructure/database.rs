use async_once::AsyncOnce;
use lazy_static::lazy_static;
use sqlx::pool::Pool;
use sqlx::postgres::{PgPoolOptions, Postgres};
use std::env;

use crate::error::ApiError;

const DB_POOL_MAX_CONNECTIONS: u32 = 5;

pub type DbPool = Pool<Postgres>;

lazy_static! {
    static ref DB_POOL: AsyncOnce<Result<DbPool, ApiError>> = AsyncOnce::new(async { create_pool().await });
}

pub async fn create_pool() -> Result<Pool<Postgres>, ApiError> {
    let db_uri = env::var("DATABASE_URL").expect("Missing \"DATABASE_URL\" environment variable");

    PgPoolOptions::new()
        .max_connections(DB_POOL_MAX_CONNECTIONS)
        .connect(&db_uri)
        .await
        .map_err(|e| ApiError::InternalServerError(e.to_string()))
}

pub async fn get_db_pool() -> Result<DbPool, ApiError> {
    DB_POOL.get().await.clone()
}

pub async fn ping() -> Result<(), ApiError> {
    info!("Checking on database connection...");
    let pool = get_db_pool().await?;

    sqlx::query("SELECT 1")
        .fetch_one(&pool)
        .await
        .expect("Failed to PING database");
    info!("Database PING executed successfully!");

    Ok(())
}

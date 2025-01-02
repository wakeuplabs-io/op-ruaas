use axum::response::IntoResponse;

pub async fn health() -> impl IntoResponse {
    (axum::http::StatusCode::OK, "Ok")
}

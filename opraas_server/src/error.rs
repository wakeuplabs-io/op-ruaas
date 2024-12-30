use axum::http::StatusCode;

type ServerError = (StatusCode, String);

pub fn internal_server_error<E>(err: E) -> ServerError
where
    E: std::fmt::Display,
{
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        format!("Internal server error: {}", err),
    )
}

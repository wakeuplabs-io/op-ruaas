use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error as ThisError;

#[derive(Clone, Debug, ThisError)]
pub enum ApiError {
    #[error("Bad request. {0}")]
    BadRequest(String),

    #[error("Authorization error. {0}")]
    AuthError(String),

    #[error("Internal Server Error {0}")]
    InternalServerError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let response = match self {
            Self::BadRequest(e) => (StatusCode::BAD_REQUEST, e.to_string()),
            Self::AuthError(e) => (StatusCode::UNAUTHORIZED, e.to_string()),
            e => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };

        response.into_response()
    }
}

impl From<Box<dyn std::error::Error>> for ApiError {
    fn from(err: Box<dyn std::error::Error>) -> Self {
        ApiError::InternalServerError(err.to_string())
    }
}

// impl From<SqlxError> for Error {
//     fn from(sqlx_error: SqlxError) -> Self {
//         match sqlx_error.as_database_error() {
//             Some(db_error) => Error::DatabaseError(db_error.to_string()),
//             None => {
//                 error!("{:?}", sqlx_error);
//                 Error::DatabaseError(String::from("Unrecognized database error!"))
//             }
//         }
//     }
// }

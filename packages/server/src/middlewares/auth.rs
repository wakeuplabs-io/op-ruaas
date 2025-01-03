use crate::error::ApiError;
use axum::{body::Body, extract::Request, http, http::Response, middleware::Next};

#[derive(Clone)]
pub struct AuthCurrentUser {
    pub id: String,
    pub email: String,
}

pub async fn authorize(mut req: Request, next: Next) -> Result<Response<Body>, ApiError> {
    let auth_header = req.headers_mut().get(http::header::AUTHORIZATION);

    let auth_header = match auth_header {
        Some(header) => header
            .to_str()
            .map_err(|_| ApiError::AuthError("Invalid token".to_string()))?,
        None => return Err(ApiError::AuthError("No token provided".to_string())),
    };

    let mut header = auth_header.split_whitespace();

    let (bearer, token) = (header.next(), header.next());

    if bearer != Some("Bearer") || token.is_none() {
        return Err(ApiError::AuthError("Invalid token".to_string()));
    }
    let email = token.unwrap().to_string();

    // TODO: mocked
    let current_user = AuthCurrentUser {
        id: email.clone(),
        email,
    };

    req.extensions_mut().insert(current_user);
    Ok(next.run(req).await)
}

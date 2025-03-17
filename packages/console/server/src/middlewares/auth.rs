use crate::error::ApiError;
use axum::{body::Body, extract::Request, http, http::Response, middleware::Next};

#[derive(Clone)]
pub struct AuthCurrentUser {
    pub id: String,
}

#[derive(Clone)]
pub struct Authorizer {}

impl Authorizer {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {})
    }

    pub async fn authorize(&self, mut req: Request, next: Next) -> Result<Response<Body>, ApiError> {
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

        let token_str = token.unwrap().to_string();

        // TODO:
        let current_user = AuthCurrentUser {
            id: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".to_string(),
        };

        req.extensions_mut().insert(current_user);
        Ok(next.run(req).await)

        // if let (Some(sub), Some(email)) = (
        //     res.get("sub").and_then(|v| v.as_str()),
        //     res.get("email").and_then(|v| v.as_str()),
        // ) {
        //     let current_user = AuthCurrentUser {
        //         id: sub.to_string(),
        //     };

        //     req.extensions_mut().insert(current_user);
        //     Ok(next.run(req).await)
        // } else {
        //     Err(ApiError::AuthError("Invalid token".to_string()))
        // }
    }
}

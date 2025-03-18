use crate::error::ApiError;
use axum::{body::Body, extract::Request, http, http::Response, middleware::Next};
use hex::FromHex;
use siwe::{Message, VerificationOpts};
use std::str::FromStr;

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
            return Err(ApiError::AuthError("No token in headers".to_string()));
        }

        let decoded = base64::decode(token.unwrap().to_string())
            .map_err(|_| ApiError::AuthError("Invalid token. Could not decode token".to_string()))?;
        let token_str = std::str::from_utf8(&decoded)
            .map_err(|_| ApiError::AuthError("Invalid token. Could not decode token".to_string()))?;
        let parts: Vec<&str> = token_str.split("||").collect();
        if parts.len() != 2 {
            return Err(ApiError::AuthError("Invalid token".to_string()));
        }
        let message = Message::from_str(parts[0])
            .map_err(|_| ApiError::AuthError("Invalid token. Could not recover message.".to_string()))?;
        let signature = <[u8; 65]>::from_hex(parts[1].strip_prefix("0x").unwrap())
            .map_err(|e| ApiError::AuthError(e.to_string()))?;

        if let Err(e) = message
            .verify(
                &signature,
                &VerificationOpts {
                    ..Default::default()
                },
            )
            .await
        {
            // message cannot be correctly authenticated at this time
            return Err(ApiError::AuthError(e.to_string()));
        }

        let current_user = AuthCurrentUser {
            id: format!("{}", hex::encode(message.address)),
        };

        req.extensions_mut().insert(current_user);
        Ok(next.run(req).await)
    }
}

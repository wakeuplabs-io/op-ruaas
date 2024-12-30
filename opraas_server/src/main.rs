mod error;
mod infra;
mod routes;
mod utils;

use aws_config::Region;
use aws_credential_types::Credentials;
use axum::extract::DefaultBodyLimit;
use axum::routing::{delete, get, post};
use axum::{Extension, Router};
use infra::S3DeploymentRepository;
use lambda_http::{run, Error};
use opraas_core::application::deployment::manager::DeploymentManagerService;
use opraas_core::infra::project::InMemoryProjectInfraRepository;
use opraas_core::{
    application::CreateProjectService,
    infra::project::{GitVersionControl, InMemoryProjectRepository},
};
use routes::health;
use std::sync::Arc;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::{self, TraceLayer};
use tracing::{level_filters::LevelFilter, Level};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::INFO)
        .init();

    let access_key_id = std::env::var("AWS_ACCESS_KEY_ID").expect("AWS_ACCESS_KEY_ID not set");
    let secret_access_key = std::env::var("AWS_SECRET_ACCESS_KEY").expect("AWS_SECRET_ACCESS_KEY not set");
    let aws_bucket = std::env::var("AWS_BUCKET").expect("AWS_BUCKET not set");

    let creds = Credentials::new(access_key_id, secret_access_key, None, None, "aws-creds");
    let cfg = aws_config::from_env()
        .region(Region::new("us-east-1"))
        .credentials_provider(creds)
        .load()
        .await;
    let s3_client = aws_sdk_s3::Client::new(&cfg);

    let create_service = Arc::new(CreateProjectService::new(
        InMemoryProjectRepository::new(),
        GitVersionControl::new(),
        InMemoryProjectInfraRepository::new(),
    ));

    let deployment_manager_service = Arc::new(DeploymentManagerService::new(S3DeploymentRepository::new(
        s3_client.clone(),
        aws_bucket,
    )));

    let router = Router::new()
        .route("/health", get(health::health))
        .route("/config", post(routes::config::create))
        .route("/deployments", get(routes::deployments::list))
        .route("/deployments/:id", post(routes::deployments::create))
        .route("/deployments/:id", get(routes::deployments::get_by_id))
        .route("/deployments/:id", delete(routes::deployments::delete))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(Extension(create_service))
        .layer(Extension(deployment_manager_service))
        .layer(DefaultBodyLimit::disable());
    // .layer(RequestBodyLimitLayer::new(10 * 1024 * 1023));

    run(router).await
}

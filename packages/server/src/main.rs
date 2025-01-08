#[macro_use]
extern crate log;

mod error;
mod handlers;
mod infrastructure;
mod middlewares;
mod utils;

use aws_config::Region;
use axum::extract::DefaultBodyLimit;
use axum::http::Method;
use axum::routing::{get, post};
use axum::{middleware, Extension, Router};
use handlers::health;
use infrastructure::database::get_db_pool;
use infrastructure::domain::deployment::{S3DeploymentArtifactsRepository, SqlDeploymentRepository};
use lambda_http::{run, Error};
use opraas_core::application::deployment::manager::DeploymentManagerService;
use opraas_core::infrastructure::project::InMemoryProjectInfraRepository;
use opraas_core::{
    application::CreateProjectService,
    infrastructure::project::{GitVersionControl, InMemoryProjectRepository},
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::{self, TraceLayer};
use tracing::{level_filters::LevelFilter, Level};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::INFO)
        .init();

    let aws_region = std::env::var("AWS_REGION").expect("AWS_REGION not set");
    let artifacts_bucket = std::env::var("ARTIFACTS_BUCKET").expect("ARTIFACTS_BUCKET not set");
    let cognito_pool_id = std::env::var("COGNITO_POOL_ID").expect("COGNITO_POOL_ID not set");
    let cognito_client_ids = std::env::var("COGNITO_CLIENT_IDS").expect("COGNITO_CLIENT_IDS not set");

    // s3 bucket
    let cfg = aws_config::from_env()
        .region(Region::new(aws_region.clone()))
        .load()
        .await;
    let s3_client = aws_sdk_s3::Client::new(&cfg);

    // db pool
    let db_pool = get_db_pool()
        .await
        .expect("Unable to connect to the database");

    // authorizer
    let authorizer = middlewares::auth::Authorizer::new(
        &aws_region,
        &cognito_pool_id,
        &cognito_client_ids.split(',').collect::<Vec<&str>>(),
    )
    .unwrap();
    let authorizer_layer = middleware::from_fn(move |req, next| {
        let authorizer = authorizer.clone();
        async move { authorizer.authorize(req, next).await }
    });

    // cors policy
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(vec![Method::GET, Method::POST, Method::DELETE, Method::HEAD, Method::PUT]);

    // services
    let create_service = Arc::new(CreateProjectService::new(
        InMemoryProjectRepository::new(),
        GitVersionControl::new(),
        InMemoryProjectInfraRepository::new(),
    ));
    let deployment_manager_service = Arc::new(DeploymentManagerService::new(
        SqlDeploymentRepository::new(db_pool),
        S3DeploymentArtifactsRepository::new(s3_client, artifacts_bucket),
    ));

    let router = Router::new()
        .route("/health", get(health::health))
        .route("/config", post(handlers::deployments_config::create))
        .route(
            "/deployments",
            get(handlers::deployments::list).layer(authorizer_layer.clone()),
        )
        .route(
            "/deployments/{id}",
            post(handlers::deployments::create)
                .layer(authorizer_layer.clone())
                .get(handlers::deployments::get_by_id)
                .layer(authorizer_layer.clone())
                .delete(handlers::deployments::delete)
                .layer(authorizer_layer.clone()),
        )
        .route(
            "/deployments/{id}/artifact",
            post(handlers::deployments_artifacts::create)
                .layer(authorizer_layer.clone())
                .get(handlers::deployments_artifacts::get_by_id)
                .layer(authorizer_layer.clone())
                .delete(handlers::deployments_artifacts::delete)
                .layer(authorizer_layer.clone())
                .head(handlers::deployments_artifacts::head)
                .layer(authorizer_layer.clone()),
        )
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(Extension(create_service))
        .layer(Extension(deployment_manager_service))
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(
            250 * 1024 * 1024, /* 250mb */
        ))
        .layer(cors);

    if std::env::var("ENV").unwrap_or_else(|_| "dev".into()) == "prod" {
        run(router).await?;
    } else {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:4000").await.unwrap();
        axum::serve(listener, router).await?;
    }

    Ok(())
}

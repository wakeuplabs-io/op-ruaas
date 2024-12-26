mod routes;
mod utils;

use axum::extract::DefaultBodyLimit;
use axum::routing::{get, post, put, delete};
use axum::{Extension, Router};
use lambda_http::{run, Error};
use opraas_core::application::deployment::inspect_contracts::DeploymentContractsInspectorService;
use opraas_core::application::deployment::inspect_infra::DeploymentInfraInspectorService;
use opraas_core::infra::deployment::InMemoryDeploymentRepository;
use opraas_core::infra::project::InMemoryProjectInfraRepository;
use opraas_core::{
    application::CreateProjectService,
    infra::project::{GitVersionControl, InMemoryProjectRepository},
};
use routes::health;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::{self, TraceLayer};
use tracing::{level_filters::LevelFilter, Level};

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::INFO)
        .init();

    let create_service = Arc::new(CreateProjectService::new(
        Box::new(InMemoryProjectRepository::new()),
        Box::new(GitVersionControl::new()),
        Box::new(InMemoryProjectInfraRepository::new()),
    ));

    let contracts_inspector = Arc::new(DeploymentContractsInspectorService::new(
        // TODO: replace with s3 repo
        Box::new(InMemoryDeploymentRepository::new(PathBuf::new())),
    ));
    let infra_inspector = Arc::new(DeploymentInfraInspectorService::new(
        // TODO: replace with s3 repo
        Box::new(InMemoryDeploymentRepository::new(PathBuf::new())),
    ));

    let s3_config = aws_config::load_from_env().await;
    let s3_client = aws_sdk_s3::Client::new(&s3_config);

    let router = Router::new()
        .route("/health", get(health::health))
        .route("/config", post(routes::config::create))
        .route("/deployments", get(routes::deployments::get_all))
        .route("/deployments/:id", post(routes::deployments::create))
        .route("/deployments/:id", get(routes::deployments::get_by_id))
        .route("/deployments/:id", put(routes::deployments::update))
        .route("/deployments/:id", delete(routes::deployments::delete))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(Extension(create_service))
        .layer(Extension(contracts_inspector))
        .layer(Extension(infra_inspector))
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(10 * 1024 * 1023))
        .with_state(s3_client);

    run(router).await
}

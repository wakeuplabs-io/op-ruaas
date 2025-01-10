use crate::{
    error::ApiError,
    infrastructure::domain::deployment::{S3DeploymentArtifactsRepository, SqlDeploymentRepository},
    middlewares::auth::AuthCurrentUser,
};
use axum::{extract::Path, http::StatusCode, response::IntoResponse, Extension, Json};
use opraas_core::{application::deployment::manager::DeploymentManagerService, domain::Deployment};
use std::sync::Arc;

pub async fn create(
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
    Json(mut deployment): Json<Deployment>,
) -> Result<impl IntoResponse, ApiError> {
    deployment.id = uuid::Uuid::new_v4().to_string();
    deployment.owner_id = user.id.clone();

    deployments_manager
        .save(&deployment)
        .await
        .map_err(ApiError::from)?;

    let deployment_json = serde_json::to_string(&deployment)
        .map_err(|_| ApiError::InternalServerError("Could not serialize deployment".into()))?;
    Ok((StatusCode::OK, deployment_json))
}

pub async fn update(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
    Json(deployment_update): Json<Deployment>, // Receive the updated deployment as JSON
) -> Result<impl IntoResponse, ApiError> {
    let mut deployment = deployments_manager
        .find_by_id(&id)
        .await
        .map_err(ApiError::from)?
        .ok_or(ApiError::BadRequest(
            "Could not find deployment with given id".into(),
        ))?;

    // Ensure the current user is the owner of the deployment
    if deployment.owner_id != user.id {
        return Err(ApiError::AuthError(
            "You are not the owner of this deployment".into(),
        ));
    }

    // Update the fields with the new data
    deployment.name = deployment_update.name;
    deployment.accounts_config = deployment_update.accounts_config;
    deployment.contracts_addresses = deployment_update.contracts_addresses;
    deployment.infra_base_url = deployment_update.infra_base_url;
    deployment.network_config = deployment_update.network_config;
    deployment.release_registry = deployment_update.release_registry;
    deployment.release_tag = deployment_update.release_tag;

    // Save the updated deployment
    deployments_manager
        .save(&deployment)
        .await
        .map_err(ApiError::from)?;

    let deployment_json = serde_json::to_string(&deployment)
        .map_err(|_| ApiError::InternalServerError("Could not serialize deployment".into()))?;
    Ok((StatusCode::OK, deployment_json))
}

pub async fn list(
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
) -> Result<impl IntoResponse, ApiError> {
    let deployments = deployments_manager
        .find_by_owner(&user.id)
        .await
        .map_err(|_| ApiError::InternalServerError("Could not list deployments".into()))?;

    let deployments_json = serde_json::to_string(&deployments)
        .map_err(|_| ApiError::InternalServerError("Could not serialize deployment".into()))?;
    Ok((StatusCode::OK, deployments_json))
}

pub async fn get_by_id(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
) -> Result<impl IntoResponse, ApiError> {
    let deployment = deployments_manager
        .find_by_id(&id)
        .await
        .map_err(ApiError::from)?
        .ok_or(ApiError::BadRequest(
            "Could not find deployment with given id".into(),
        ))?;

    // verify deployment is owned by user
    if deployment.owner_id != user.id {
        return Err(ApiError::AuthError(
            "Deployment is not owned by user".into(),
        ));
    }

    let deployment_json = serde_json::to_string(&deployment)
        .map_err(|_| ApiError::InternalServerError("Could not serialize deployment".into()))?;
    Ok((StatusCode::OK, deployment_json))
}

pub async fn delete(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
) -> Result<impl IntoResponse, ApiError> {
    let deployment = deployments_manager
        .find_by_id(&id)
        .await
        .map_err(ApiError::from)?
        .ok_or(ApiError::BadRequest(
            "Could not find deployment with given id".into(),
        ))?;

    if deployment.owner_id != user.id {
        return Err(ApiError::AuthError(
            "Deployment is not owned by user".into(),
        ));
    }

    let _ = deployments_manager.delete_artifact(&deployment).await;

    deployments_manager
        .delete(&deployment)
        .await
        .map_err(ApiError::from)?;

    let deployment_json = serde_json::to_string(&deployment)
        .map_err(|_| ApiError::InternalServerError("Could not serialize deployment".into()))?;
    Ok((StatusCode::OK, deployment_json))
}

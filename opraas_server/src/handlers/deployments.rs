use axum::{
    extract::{Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension,
};
use opraas_core::{application::deployment::manager::DeploymentManagerService, domain::Deployment};
use std::sync::Arc;

use crate::{
    error::ApiError, infrastructure::domain::deployment::SqlDeploymentRepository, middlewares::auth::AuthCurrentUser,
};

pub async fn create(
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<SqlDeploymentRepository>>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, ApiError> {
    let mut field: Option<Vec<u8>> = None;
    while let Some(formitem) = multipart.next_field().await.unwrap() {
        field = Some(
            formitem
                .bytes()
                .await
                .map_err(|_| ApiError::BadRequest("Could not read deployment file".into()))?
                .to_vec(),
        );
    }

    let Some(data) = field else {
        return Err(ApiError::BadRequest("No deployment file provided".into()));
    };

    todo!();

    return Ok((StatusCode::OK, "Ok"));
}

pub async fn list(
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<SqlDeploymentRepository>>>,
) -> Result<impl IntoResponse, ApiError> {
    let deployments = deployments_manager
        .find(&user.id)
        .await
        .map_err(|_| ApiError::InternalServerError("Could not list deployments".into()))?;

    let deployments_json = serde_json::to_string(&deployments).unwrap();
    Ok((StatusCode::OK, deployments_json))
}

pub async fn get_by_id(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<SqlDeploymentRepository>>>,
) -> Result<impl IntoResponse, ApiError> {
    let deployment = deployments_manager
        .find_one(&user.id, &id)
        .await
        .map_err(ApiError::from)?
        .ok_or(ApiError::BadRequest(
            "Could not find deployment with given id".into(),
        ))?;

    let deployment_json = serde_json::to_string(&deployment).unwrap();
    Ok((StatusCode::OK, deployment_json))
}

pub async fn delete(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<SqlDeploymentRepository>>>,
) -> Result<impl IntoResponse, ApiError> {
    let deployment = deployments_manager
        .find_one(&user.id, &id)
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

    // delete
    deployments_manager
        .delete(&deployment)
        .await
        .map_err(ApiError::from)?;

    Ok((StatusCode::OK, "Ok"))
}

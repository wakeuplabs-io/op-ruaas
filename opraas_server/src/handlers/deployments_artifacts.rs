use crate::{
    error::ApiError,
    infrastructure::domain::deployment::{S3DeploymentArtifactsRepository, SqlDeploymentRepository},
    middlewares::auth::AuthCurrentUser,
};
use axum::{
    extract::{Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension,
};
use opraas_core::application::deployment::manager::DeploymentManagerService;
use std::sync::Arc;

pub async fn create(
    Path(deployment_id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
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

    let Some(deployment_artifact) = field else {
        return Err(ApiError::BadRequest("No deployment file provided".into()));
    };

    let deployment = deployments_manager
        .find_one(&user.id, &deployment_id)
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

    deployments_manager
        .save_artifact(&deployment, deployment_artifact)
        .await
        .map_err(ApiError::from)?;

    return Ok((StatusCode::OK, "Ok"));
}

pub async fn head(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
) -> Result<impl IntoResponse, ApiError> {
    let deployment = deployments_manager
        .find_one(&user.id, &id)
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

    let exists = deployments_manager
        .exists_artifact(&deployment)
        .await
        .map_err(ApiError::from)?;

    if !exists {
         Ok((StatusCode::OK, [("X-Resource-Exist", "true")]))
    } else {
        Ok((StatusCode::NOT_FOUND, [("X-Resource-Exist", "false")]))
    }
}

pub async fn get_by_id(
    Path(id): Path<String>,
    Extension(user): Extension<AuthCurrentUser>,
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
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
    Extension(deployments_manager): Extension<
        Arc<DeploymentManagerService<SqlDeploymentRepository, S3DeploymentArtifactsRepository>>,
    >,
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

    deployments_manager
        .delete_artifact(&deployment)
        .await
        .map_err(ApiError::from)?;

    Ok((StatusCode::OK, "Ok"))
}

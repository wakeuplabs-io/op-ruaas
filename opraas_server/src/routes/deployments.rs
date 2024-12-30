use crate::{error::internal_server_error, infra::S3DeploymentRepository};
use axum::{
    extract::{Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension,
};
use opraas_core::{application::deployment::manager::DeploymentManagerService, domain::Deployment};
use std::sync::Arc;

const USER: &str = "root";

pub async fn create(
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut field: Option<Vec<u8>> = None;
    while let Some(formitem) = multipart.next_field().await.unwrap() {
        field = Some(
            formitem
                .bytes()
                .await
                .map_err(internal_server_error)?
                .to_vec(),
        );
    }

    let Some(data) = field else {
        return Err((
            StatusCode::BAD_REQUEST,
            "Could not find a valid deployment file".into(),
        ));
    };

    let mut deployment: Deployment = serde_json::from_slice(&data).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            "Could not decode deployment file".into(),
        )
    })?;

    deployment.owner_id = USER.to_string();

    deployments_manager
        .save(&mut deployment)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Could not save deployment".into(),
            )
        })?;

    return Ok((StatusCode::OK, "Ok"));
}

pub async fn list(
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let deployments = deployments_manager
        .find(USER)
        .await
        .map_err(internal_server_error)?;

    let deployments_json = serde_json::to_string(&deployments).unwrap();
    Ok((StatusCode::OK, deployments_json))
}

pub async fn get_by_id(
    Path(id): Path<String>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let deployment = deployments_manager
        .find_one(USER, &id)
        .await
        .map_err(internal_server_error)?
        .ok_or((
            StatusCode::NOT_FOUND,
            "Could not find deployment with given id".into(),
        ))?;

    let deployment_json = serde_json::to_string(&deployment).unwrap();
    Ok((StatusCode::OK, deployment_json))
}

pub async fn delete(
    Path(id): Path<String>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let deployment = deployments_manager
        .find_one(USER, &id)
        .await
        .map_err(internal_server_error)?
        .ok_or((
            StatusCode::NOT_FOUND,
            "Could not find deployment with given id".into(),
        ))?;

    // verify deployment is owned by user
    if deployment.owner_id != USER {
        return Err((
            StatusCode::UNAUTHORIZED,
            "You are not authorized to delete this deployment".into(),
        ));
    }

    // delete
    deployments_manager
        .delete(&deployment)
        .await
        .map_err(internal_server_error)?;

    Ok((StatusCode::OK, "Ok"))
}

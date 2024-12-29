use axum::{
    extract::{Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension,
};
use opraas_core::{application::deployment::manager::DeploymentManagerService, domain::Deployment};
use std::sync::Arc;

use crate::infra::S3DeploymentRepository;

pub async fn create(
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // takes, chain id and name and stores in user db
    // also stores the infra and contracts artifacts

    while let Some(field) = multipart.next_field().await.unwrap() {
        if let Some(_filename) = field.file_name() {
            let data = field.bytes().await.map_err(|_| {
                (
                    StatusCode::BAD_REQUEST,
                    "Could not find a valid deployment file",
                )
            })?;

            let mut deployment: Deployment = serde_json::from_slice(&data)
                .map_err(|_| (StatusCode::BAD_REQUEST, "Could not decode deployment file"))?;

            // TODO: set id and store in db as well
            deployments_manager
                .save(&mut deployment)
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "Could not save deployment"))?;

            return Ok((StatusCode::OK, "Ok"));
        }
    }

    Err((
        StatusCode::BAD_REQUEST,
        "Could not find a valid deployment file",
    ))
}

pub async fn get_all() -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // returns all chains available for user

    Ok((StatusCode::OK, "Ok"))
}

pub async fn get_by_id(
    Path(id): Path<String>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // given chain id returns id, name, inspect result and artifacts download links

    // let deployment = deployments_manager
    //     .find(&id)
    //     .await
    //     .map_err(|_| {
    //         (
    //             StatusCode::NOT_FOUND,
    //             "Could not find deployment with given id",
    //         )
    //     })?
    //     .ok_or((
    //         StatusCode::NOT_FOUND,
    //         "Could not find deployment with given id",
    //     ))?;

    // turn deployment in json and return

    Ok((StatusCode::OK, "Ok"))
}

pub async fn update() -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // allows to change name, or upload artifacts

    Ok((StatusCode::OK, "Ok"))
}

pub async fn delete(
    Path(id): Path<String>,
    Extension(deployments_manager): Extension<Arc<DeploymentManagerService<S3DeploymentRepository>>>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // deletes chain and all associated data

    // verify deployment is owned by user

    // deployments_manager
    //     .delete(&id)
    //     .await
    //     .map_err(|_| (StatusCode::BAD_REQUEST, "Could not delete deployment"))?;

    Ok((StatusCode::OK, "Ok"))
}

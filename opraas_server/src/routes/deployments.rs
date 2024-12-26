use axum::{
    extract::Multipart, http::StatusCode, response::IntoResponse, Extension, Json
};
use opraas_core::{
    application::{contracts::StackContractsInspectorService},
};
use std::{io::Cursor, sync::Arc};

pub async fn create( 
    Extension(contracts_inspector): Extension<Arc<StackContractsInspectorService>>,
mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // takes, chain id and name and stores in user db
    // also stores the infra and contracts artifacts

        // while let Some(field) = multipart
        //     .next_field()
        //     .await
        //     .map_err(|_| (StatusCode::BAD_REQUEST, "Could not find a valid ZIP file"))?
        // {
        //     if let Some(filename) = field.file_name() {
        //         if filename.ends_with(".zip") {
        //             let data = field
        //                 .bytes()
        //                 .await
        //                 .map_err(|_| (StatusCode::BAD_REQUEST, "Could not find a valid ZIP file"))?;
    
        //             let result = contracts_inspector
        //                 .inspect(Cursor::new(data.to_vec()))
        //                 .map_err(|_| {
        //                     (
        //                         StatusCode::INTERNAL_SERVER_ERROR,
        //                         "Could not find a valid ZIP file",
        //                     )
        //                 })?;
    
        //             return Ok(Json(result));
        //         }
        //     }
        // }
    
        // Err((StatusCode::BAD_REQUEST, "Could not find a valid ZIP file"))
    
    Ok((StatusCode::OK, "Ok"))
}

pub fn get_all() -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // returns all chains available for user

    Ok((StatusCode::OK, "Ok"))
}

pub fn get_by_id()  -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // given chain id returns id, name, inspect result and artifacts download links

    // inspect chain id

    Ok((StatusCode::OK, "Ok"))
}

pub fn update() -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // allows to change name, or upload artifacts

    Ok((StatusCode::OK, "Ok"))
}


pub fn delete() -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    // deletes chain and all associated data

    Ok((StatusCode::OK, "Ok"))
}

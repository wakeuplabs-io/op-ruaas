use std::fs;
use std::io::Cursor;
use std::path::Path;

use git2::{ObjectType, Repository};

pub fn clone_tag<T, U>(source_repo: U, source_tag: U, dst_path: T) -> Result<(), Box<dyn std::error::Error>>
where
    T: AsRef<std::path::Path>,
    U: AsRef<str>,
{
    let repo = Repository::clone(
        &format!("https://github.com/{}", source_repo.as_ref()),
        dst_path,
    )?;

    // Lookup the tag reference
    let tag_ref = format!("refs/tags/{}", source_tag.as_ref());
    let reference = repo.find_reference(&tag_ref)?;

    // Resolve the reference to the tag object
    let tag_oid = reference
        .target()
        .ok_or_else(|| git2::Error::from_str("Invalid tag reference"))?;
    let tag_object = repo.find_object(tag_oid, Some(ObjectType::Any))?;

    // Checkout the tag
    repo.checkout_tree(&tag_object, None)?;
    repo.set_head(&tag_ref)?;

    Ok(())
}

pub fn download_release_asset<T, U>(
    release_repo: T,
    release_tag: T,
    asset_path: T,
    dst_path: U,
) -> Result<(), Box<dyn std::error::Error>>
where
    T: AsRef<str>,
    U: AsRef<Path>,
{
    let response = reqwest::blocking::get(&format!(
        "https://raw.githubusercontent.com/{}/refs/tags/{}/{}",
        release_repo.as_ref(),
        release_tag.as_ref(),
        asset_path.as_ref()
    ))?;
    let bytes = response.bytes()?;

    let dst_dir = Path::new(dst_path.as_ref())
        .parent()
        .expect("Invalid destination path");
    if !dst_dir.exists() {
        fs::create_dir_all(dst_dir)?;
    }
    fs::write(dst_path, bytes)?;

    Ok(())
}

pub fn download_zipped_asset<T, U>(
    release_repo: T,
    release_tag: T,
    asset: T,
    dst_path: U,
) -> Result<(), Box<dyn std::error::Error>>
where
    T: AsRef<str>,
    U: AsRef<Path>,
{
    let response = reqwest::blocking::get(&format!(
        "https://github.com/{}/releases/download/{}/{}.zip",
        release_repo.as_ref(),
        release_tag.as_ref(),
        asset.as_ref()
    ))?;
    let bytes = response.bytes()?;

    if !dst_path.as_ref().exists() {
        fs::create_dir_all(dst_path.as_ref())?;
    }

    let target = Path::new(dst_path.as_ref());
    zip_extract::extract(Cursor::new(bytes), target, true)?;

    Ok(())
}

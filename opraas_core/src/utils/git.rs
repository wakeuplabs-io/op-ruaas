use std::fs;
use std::io::Cursor;
use std::path::Path;

use git2::{ObjectType, Repository};

pub fn clone_tag(source_repo: &str, source_tag: &str, dst_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let repo = Repository::clone(&format!("https://github.com/{}", source_repo), dst_path)?;

    // Lookup the tag reference
    let tag_ref = format!("refs/tags/{}", source_tag);
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

pub fn download_release_asset(
    release_repo: &str,
    release_tag: &str,
    asset_path: &str,
    dst_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::blocking::get(&format!(
        "https://raw.githubusercontent.com/{}/refs/tags/{}/{}",
        release_repo, release_tag, asset_path
    ))?;
    let bytes = response.bytes()?;

    let dst_dir = Path::new(dst_path).parent().unwrap();
    if !dst_dir.exists() {
        fs::create_dir_all(dst_dir)?;
    }
    fs::write(dst_path, bytes)?;

    Ok(())
}

pub fn download_zipped_asset(
    release_repo: &str,
    release_tag: &str,
    asset: &str,
    dst_path: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::blocking::get(&format!(
        "https://github.com/{}/releases/download/{}/{}.zip",
        release_repo, release_tag, asset
    ))?;
    let bytes = response.bytes()?;

    let target = Path::new(dst_path);
    if !target.exists() {
        fs::create_dir_all(target)?;
    }

    zip_extract::extract(Cursor::new(bytes), &target, true)?;

    Ok(())
}

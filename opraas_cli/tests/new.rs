use assert_cmd::prelude::*;
use std::{fs, process::Command};

const BIN: &str = env!("CARGO_PKG_NAME");

#[test]
fn create_new_project() {
    let tmp_dir = tempfile::tempdir().unwrap();
    let dst = tmp_dir.path().join("project_name");

    let mut cmd = Command::cargo_bin(BIN).unwrap();
    cmd.arg("new").arg(&dst).assert().success();

    // Assert that files have been created
    assert!(dst.exists(), "New directory was not created");
    assert!(dst.join("README.md").exists(), "README.md was not created");
    assert!(
        dst.join(".gitignore").exists(),
        ".gitignore was not created"
    );
    assert!(
        dst.join("config.toml").exists(),
        "config.toml was not created"
    );
    assert!(dst.join(".env").exists(), ".env was not created");
    assert!(dst.join(".git").exists(), ".git was not created");

    tmp_dir.close().unwrap();
}

#[test]
fn create_new_project_fails_if_dir_exists() {
    let tmp_dir = tempfile::tempdir().unwrap();
    let dst = tmp_dir.path().join("project_name");

    // Create the directory before running the command
    fs::create_dir_all(&dst).unwrap();

    let mut cmd = Command::cargo_bin(BIN).unwrap();
    cmd.arg("new")
        .arg(&dst)
        .assert()
        .failure()
        .stderr(predicates::str::contains("Directory already exists"));

    tmp_dir.close().unwrap();
}

use log::info;
use std::{
    fs,
    io::{self},
    path::Path,
    process::{Command, Stdio},
};

pub fn execute_command(command: &mut Command, silent: bool) -> Result<String, String> {
    info!("Executing command: {:?}", command);

    if !silent && log::log_enabled!(log::Level::Debug) {
        command.stdout(Stdio::inherit());
        command.stderr(Stdio::inherit());
    }

    let output = command
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).to_string();
    let error = String::from_utf8_lossy(&output.stderr).to_string();
    let status = output.status;

    if status.success() {
        return Ok(result);
    } else {
        return Err(format!(
            "Command exited with non-zero status: {}. {}",
            status, error
        ));
    }
}

pub fn copy_and_overwrite<T>(src: T, dest: T) -> io::Result<()>
where
    T: AsRef<Path>,
{
    let src = src.as_ref();
    let dest = dest.as_ref();

    if src == dest {
        return Ok(());
    }

    if dest.exists() {
        fs::remove_file(dest)?;
    }

    if src.is_file() {
        fs::copy(src, dest)?;
    } else {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Source is not a file.",
        ));
    }

    Ok(())
}

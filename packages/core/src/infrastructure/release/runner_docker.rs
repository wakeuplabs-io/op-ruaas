use crate::{
    domain::{Release, ReleaseRunnerOptions, TReleaseRunner},
    system::execute_command,
};
use std::process::Command;

pub struct DockerReleaseRunner;

// implementations =============================================

impl Default for DockerReleaseRunner {
    fn default() -> Self {
        Self::new()
    }
}

impl DockerReleaseRunner {
    pub fn new() -> Self {
        Self
    }
}

impl TReleaseRunner for DockerReleaseRunner {
    fn run(
        &self,
        release: &Release,
        opts: ReleaseRunnerOptions
    ) -> Result<(), Box<dyn std::error::Error>> {
        let env_args: Vec<Vec<String>> = opts.env
            .iter()
            .map(|(key, value)| vec!["-e".to_string(), format!("{}={}", key, value)])
            .collect();

        execute_command(
            Command::new("docker")
                .arg("run")
                .arg("--rm")
                .args(env_args.concat())
                .arg("-v")
                .arg(format!("{}:{}", opts.volume.display(), "/shared"))
                .arg("--name")
                .arg(opts.container_name)
                .arg(release.uri())
                .args(opts.args),
            false,
        )?;

        Ok(())
    }

    fn stop(&self, container_name: &str) -> Result<(), Box<dyn std::error::Error>> {
        let running_containers = execute_command(Command::new("docker").arg("ps"), true)?;
        if !running_containers.contains(container_name) {
            return Ok(());
        }

        let _ = execute_command(Command::new("docker").arg("stop").arg(container_name), true);
        let _ = execute_command(Command::new("docker").arg("rm").arg(container_name), true);

        Ok(())
    }
}

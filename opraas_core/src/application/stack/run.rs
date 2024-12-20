use crate::domain::{Stack, TStackInfraRepository, TStackRunner};
use serde_yaml::Value;
use std::collections::HashMap;

pub struct StackRunnerService {
    stack_runner: Box<dyn TStackRunner>,
    stack_infra_repository: Box<dyn TStackInfraRepository>,
}

pub trait TStackRunnerService {
    fn start(&self, stack: &Stack, monitoring: bool, explorer: bool) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl StackRunnerService {
    pub fn new(stack_runner: Box<dyn TStackRunner>, stack_infra_repository: Box<dyn TStackInfraRepository>) -> Self {
        Self {
            stack_runner,
            stack_infra_repository,
        }
    }
}

impl TStackRunnerService for StackRunnerService {
    fn start(&self, stack: &Stack, monitoring: bool, explorer: bool) -> Result<(), Box<dyn std::error::Error>> {
        self.stack_infra_repository.pull(stack)?;

        let mut values: HashMap<&str, Value> = HashMap::new();
        values.insert("monitoring.enabled", monitoring.into());
        values.insert("explorer.enabled", explorer.into());

        self.stack_runner.run(stack, &values)?;

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.stack_runner.stop()?;

        Ok(())
    }
}

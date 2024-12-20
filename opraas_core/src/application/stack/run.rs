use std::collections::HashMap;

use crate::domain::{Stack, TStackInfraRepository, TStackRunner};

pub struct StackRunnerService {
    stack_runner: Box<dyn TStackRunner>,
    stack_infra_repository: Box<dyn TStackInfraRepository>,
}

pub trait TStackRunnerService {
    fn start(&self, stack: &Stack) -> Result<(), Box<dyn std::error::Error>>;
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
    fn start(&self, stack: &Stack) -> Result<(), Box<dyn std::error::Error>> {
        self.stack_infra_repository.pull(stack)?;

        let values: HashMap<&str, String> = HashMap::new();

        self.stack_runner.run(stack, &values)?;

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.stack_runner.stop()?;

        Ok(())
    }
}

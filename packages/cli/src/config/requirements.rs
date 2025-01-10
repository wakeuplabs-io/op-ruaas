use crate::infrastructure::system::{System, TSystem};
use regex::Regex;
use semver::Version;
use std::{fmt, process::Command};

#[derive(Debug)]
#[allow(dead_code)]
pub enum Comparison {
    Equal,
    GreaterThanOrEqual,
    LessThanOrEqual,
    GreaterThan,
    LessThan,
}

#[derive(Debug)]
pub struct Requirement<'a> {
    pub program: &'a str,
    pub version_arg: &'a str,
    pub required_version: &'a str,
    pub required_comparator: Comparison,
}

pub trait TSystemRequirementsChecker {
    fn check(&self, requirements: Vec<Requirement>) -> Result<(), String>;
}

pub struct SystemRequirementsChecker {
    system: Box<dyn TSystem>,
}

// requirements constants ======================================

pub const DOCKER_REQUIREMENT: Requirement = Requirement {
    program: "docker",
    version_arg: "-v",
    required_version: "24.0.0",
    required_comparator: Comparison::GreaterThanOrEqual,
};
pub const K8S_REQUIREMENT: Requirement = Requirement {
    program: "kubectl",
    version_arg: "version",
    required_version: "1.28.0",
    required_comparator: Comparison::GreaterThanOrEqual,
};
pub const HELM_REQUIREMENT: Requirement = Requirement {
    program: "helm",
    version_arg: "version",
    required_version: "3.0.0",
    required_comparator: Comparison::GreaterThanOrEqual,
};
pub const TERRAFORM_REQUIREMENT: Requirement = Requirement {
    program: "terraform",
    version_arg: "-v",
    required_version: "1.9.8",
    required_comparator: Comparison::GreaterThanOrEqual,
};
pub const GIT_REQUIREMENT: Requirement = Requirement {
    program: "git",
    version_arg: "--version",
    required_version: "2.0.0",
    required_comparator: Comparison::GreaterThanOrEqual,
};

// implementations =============================================

impl fmt::Display for Comparison {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Comparison::Equal => write!(f, "=="),
            Comparison::GreaterThanOrEqual => write!(f, ">="),
            Comparison::LessThanOrEqual => write!(f, "<="),
            Comparison::GreaterThan => write!(f, ">"),
            Comparison::LessThan => write!(f, "<"),
        }
    }
}

impl SystemRequirementsChecker {
    pub fn new() -> Self {
        Self {
            system: Box::new(System::new()),
        }
    }
}

impl TSystemRequirementsChecker for SystemRequirementsChecker {
    fn check(&self, requirements: Vec<Requirement>) -> Result<(), String> {
        for requirement in requirements.iter() {
            let output = self
                .system
                .execute_command(Command::new(requirement.program).arg(requirement.version_arg))
                .map_err(|_| {
                    format!(
                        "{} {} did not exited succesfully. Please ensure program is installed and running.",
                        requirement.program, requirement.version_arg
                    )
                })?;
            let re = Regex::new(r"(\d+\.\d+\.\d+)").expect("Failed to compile regex");

            let version = Version::parse(
                &re.captures(&output)
                    .ok_or(format!("Failed to parse version from output: {}", output))?[1],
            )
            .expect("Failed to parse version");

            let required_version = Version::parse(requirement.required_version).map_err(|e| e.to_string())?;
            match requirement.required_comparator {
                Comparison::Equal => {
                    if version != required_version {
                        return Err(format!(
                            "Version {} does not equal required version {}",
                            version, requirement.required_version
                        ));
                    }
                }
                Comparison::GreaterThanOrEqual => {
                    if version < required_version {
                        return Err(format!(
                            "Version {} is not greater than or equal to required version {}",
                            version, requirement.required_version
                        ));
                    }
                }
                Comparison::LessThanOrEqual => {
                    if version > required_version {
                        return Err(format!(
                            "Version {} is not less than or equal to required version {}",
                            version, requirement.required_version
                        ));
                    }
                }
                Comparison::GreaterThan => {
                    if version <= required_version {
                        return Err(format!(
                            "Version {} is not greater than required version {}",
                            version, requirement.required_version
                        ));
                    }
                }
                Comparison::LessThan => {
                    if version >= required_version {
                        return Err(format!(
                            "Version {} is not less than required version {}",
                            version, requirement.required_version
                        ));
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::requirements::Comparison;
    use crate::config::requirements::Requirement;
    use crate::config::requirements::SystemRequirementsChecker;
    use crate::infrastructure::system::MockTSystem;

    #[test]
    fn test_check() {
        let requirements = vec![Requirement {
            program: "rustc",
            version_arg: "--version",
            required_version: "1.0.0",
            required_comparator: Comparison::GreaterThanOrEqual,
        }];

        let mut mock_system = MockTSystem::new();
        mock_system
            .expect_execute_command()
            .times(1)
            .returning(|_| Ok("rustc 1.0.0".to_string()));

        let checker = SystemRequirementsChecker {
            system: Box::new(mock_system),
        };
        let result = checker.check(requirements);

        assert!(result.is_ok());
    }

    #[test]
    fn test_check_fails() {
        let requirements = vec![Requirement {
            program: "rustc",
            version_arg: "--version",
            required_version: "1.0.0",
            required_comparator: Comparison::GreaterThanOrEqual,
        }];

        let mut mock_system = MockTSystem::new();
        mock_system
            .expect_execute_command()
            .times(1)
            .returning(|_| Ok("rustc 0.9.0".to_string()));

        let checker = SystemRequirementsChecker {
            system: Box::new(mock_system),
        };
        let result = checker.check(requirements);

        assert!(result.is_err());
    }
}

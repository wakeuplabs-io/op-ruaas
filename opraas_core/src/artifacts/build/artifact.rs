
pub trait BuildArtifact {
   fn build(&self, cfg: &crate::config::Config) -> Result<(), Box<dyn std::error::Error>>;
   fn release(&self, cfg: &crate::config::Config, name: &str, repository: &str) -> Result<(), Box<dyn std::error::Error>>;
}

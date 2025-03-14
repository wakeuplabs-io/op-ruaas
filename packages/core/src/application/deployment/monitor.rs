pub struct MonitorService {}

impl MonitorService {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn run(
        &self,
        ctx: &AppContext,
        target: &MonitorTarget,
        deployment_id: &str,
        subcmd: Option<String>,
        args: Option<Vec<String>>,
    ) -> Result<(), anyhow::Error> {
        let config = config::CoreConfig::new();
    }
}

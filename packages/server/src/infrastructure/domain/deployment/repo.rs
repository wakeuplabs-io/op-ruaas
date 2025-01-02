use crate::infrastructure::database::DbPool;
use opraas_core::domain::{Deployment, TDeploymentRepository};

pub struct SqlDeploymentRepository {
    client: DbPool,
}

#[derive(Debug, sqlx::FromRow)]
struct DeploymentDto {
    pub id: String,
    pub owner_id: String,
    pub release_tag: String,
    pub release_registry: String,
    pub infra_base_url: Option<String>,
    pub contracts_addresses: Option<String>,
    pub network_config: String,
    pub accounts_config: String,
}

impl From<DeploymentDto> for Deployment {
    fn from(deployment: DeploymentDto) -> Self {
        Self {
            id: deployment.id,
            owner_id: deployment.owner_id,
            release_tag: deployment.release_tag,
            release_registry: deployment.release_registry,
            infra_base_url: deployment.infra_base_url,
            contracts_addresses: deployment.contracts_addresses,
            network_config: serde_json::from_str(&deployment.network_config).unwrap(),
            accounts_config: serde_json::from_str(&deployment.accounts_config).unwrap(),
        }
    }
}

impl From<Deployment> for DeploymentDto {
    fn from(deployment: Deployment) -> Self {
        Self {
            id: deployment.id,
            owner_id: deployment.owner_id,
            release_tag: deployment.release_tag,
            release_registry: deployment.release_registry,
            infra_base_url: deployment.infra_base_url,
            contracts_addresses: deployment.contracts_addresses,
            network_config: serde_json::to_string(&deployment.network_config).unwrap(),
            accounts_config: serde_json::to_string(&deployment.accounts_config).unwrap(),
        }
    }
}

impl SqlDeploymentRepository {
    pub fn new(client: DbPool) -> Self {
        Self { client }
    }
}

#[async_trait::async_trait]
impl TDeploymentRepository for SqlDeploymentRepository {
    async fn find_one(&self, owner_id: &str, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        let result: DeploymentDto = sqlx::query_as("SELECT * FROM deployments WHERE owner_id = $1 AND id = $2")
            .bind(&owner_id)
            .bind(&id)
            .fetch_one(&self.client)
            .await?;

        Ok(Some(result.into()))
    }

    async fn find(&self, owner_id: &str) -> Result<Vec<Deployment>, Box<dyn std::error::Error>> {
        let result: Vec<DeploymentDto> = sqlx::query_as("SELECT * FROM deployments WHERE owner_id = $1")
            .bind(&owner_id)
            .fetch_all(&self.client)
            .await?;

        Ok(result.into_iter().map(Deployment::from).collect())
    }

    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let deployment_dto: DeploymentDto = deployment.clone().into();

        sqlx::query!(
            "INSERT INTO deployments (id, owner_id, release_tag, release_registry, infra_base_url, contracts_addresses, network_config, accounts_config)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            deployment_dto.id,
            deployment_dto.owner_id,
            deployment_dto.release_tag,
            deployment_dto.release_registry,
            deployment_dto.infra_base_url,
            deployment_dto.contracts_addresses,
            deployment_dto.network_config,
            deployment_dto.accounts_config,
        )
        .execute(&self.client)
        .await
        .unwrap();

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        sqlx::query!("DELETE FROM deployments WHERE id = $1", deployment.id)
            .execute(&self.client)
            .await?;

        Ok(())
    }
}

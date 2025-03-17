use crate::infrastructure::database::DbPool;
use opraas_core::domain::{Deployment, TDeploymentRepository};

pub struct SqlDeploymentRepository {
    client: DbPool,
}

#[derive(Debug, sqlx::FromRow)]
struct DeploymentDto {
    pub id: String,
    pub name: String,
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
            name: deployment.name,
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
            name: deployment.name,
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
    async fn find_by_id(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        let result: DeploymentDto = sqlx::query_as("SELECT * FROM deployments WHERE id = $1")
            .bind(id)
            .fetch_one(&self.client)
            .await?;

        Ok(Some(result.into()))
    }

    async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Deployment>, Box<dyn std::error::Error>> {
        let result: Vec<DeploymentDto> = sqlx::query_as("SELECT * FROM deployments WHERE owner_id = $1")
            .bind(owner_id)
            .fetch_all(&self.client)
            .await?;

        Ok(result.into_iter().map(Deployment::from).collect())
    }

    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let deployment_dto: DeploymentDto = deployment.clone().into();

        let exists: Option<String> = sqlx::query_scalar!(
            "SELECT id FROM deployments WHERE id = $1",
            deployment_dto.id,
        )
        .fetch_optional(&self.client)
        .await?;

        if exists.is_some() {
            sqlx::query!(
                r#"
                UPDATE deployments 
                SET 
                    owner_id = $2,
                    name = $3,
                    release_tag = $4,
                    release_registry = $5,
                    infra_base_url = $6,
                    contracts_addresses = $7,
                    network_config = $8,
                    accounts_config = $9
                WHERE id = $1
                "#,
                deployment_dto.id,
                deployment_dto.owner_id,
                deployment_dto.name,
                deployment_dto.release_tag,
                deployment_dto.release_registry,
                deployment_dto.infra_base_url,
                deployment_dto.contracts_addresses,
                deployment_dto.network_config,
                deployment_dto.accounts_config,
            )
            .execute(&self.client)
            .await?;
        } else {
            sqlx::query!(
                "INSERT INTO deployments (id, name, owner_id, release_tag, release_registry, infra_base_url, contracts_addresses, network_config, accounts_config)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                deployment_dto.id,
                deployment_dto.name,
                deployment_dto.owner_id,
                deployment_dto.release_tag,
                deployment_dto.release_registry,
                deployment_dto.infra_base_url,
                deployment_dto.contracts_addresses,
                deployment_dto.network_config,
                deployment_dto.accounts_config,
            )
            .execute(&self.client)
            .await?;
        }

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        sqlx::query!("DELETE FROM deployments WHERE id = $1", deployment.id)
            .execute(&self.client)
            .await?;

        Ok(())
    }
}

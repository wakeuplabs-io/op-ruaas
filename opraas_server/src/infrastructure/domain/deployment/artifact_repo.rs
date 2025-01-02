use aws_sdk_s3::primitives::ByteStream;
use opraas_core::domain::{Deployment, DeploymentArtifact, TDeploymentArtifactsRepository, TDeploymentRepository};

pub struct S3DeploymentArtifactsRepository {
    client: aws_sdk_s3::Client,
    bucket_name: String,
}

impl S3DeploymentArtifactsRepository {
    pub fn new(client: aws_sdk_s3::Client, bucket_name: String) -> Self {
        Self {
            client,
            bucket_name,
        }
    }
}

#[async_trait::async_trait]
impl TDeploymentArtifactsRepository for S3DeploymentArtifactsRepository {
    async fn find_one(
        &self,
        deployment: &Deployment,
    ) -> Result<Option<DeploymentArtifact>, Box<dyn std::error::Error>> {
        let key = format!("{}-{}.zip", &deployment.owner_id, &deployment.id);
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await?;

        let deployment_artifact: Vec<u8> = resp.body.collect().await?.to_vec();

        Ok(Some(deployment_artifact))
    }

    async fn save(
        &self,
        deployment: &Deployment,
        artifact: DeploymentArtifact,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let key = format!("{}-{}.zip", &deployment.owner_id, &deployment.id);
        self.client
            .put_object()
            .bucket(&self.bucket_name)
            .content_length(artifact.len() as i64)
            .key(key)
            .body(ByteStream::from(artifact))
            .send()
            .await?;

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let key = format!("{}-{}.zip", &deployment.owner_id, &deployment.id);
        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(key)
            .send()
            .await
            .map_err(|err| err.to_string())?;

        Ok(())
    }
}

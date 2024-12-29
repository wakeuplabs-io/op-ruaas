use aws_sdk_s3::primitives::ByteStream;
use opraas_core::domain::{Deployment, TDeploymentRepository};

pub struct S3DeploymentRepository {
    client: aws_sdk_s3::Client,
    bucket_name: String,
}

// implementations ====================================

impl S3DeploymentRepository {
    pub fn new(client: aws_sdk_s3::Client, bucket_name: String) -> Self {
        Self {
            client,
            bucket_name,
        }
    }
}

#[async_trait::async_trait]
impl TDeploymentRepository for S3DeploymentRepository {
    async fn find_one(&self, owner_id: &str, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket_name)
            .key(id)
            .send()
            .await;

        if resp.is_err() {
            return Ok(None);
        }

        let resp = resp.unwrap();
        let buf = resp.body.collect().await?;
        let deployment = serde_json::from_slice::<Deployment>(buf.into_bytes().as_ref())?;

        Ok(Some(deployment))
    }

    async fn list(&self, owner_id: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let result = Vec::new();
        Ok(result)
    }

    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let serialized = serde_json::to_string(&deployment)?;

        let res = self
            .client
            .put_object()
            .bucket(&self.bucket_name)
            .content_type("application/json")
            .content_length(serialized.as_bytes().len() as i64)
            .key(format!("{}/{}.json", "username", deployment.id))
            .body(ByteStream::from(serialized.as_bytes().to_vec()))
            .send()
            .await;

        if res.is_err() {
            return Err(res.err().unwrap().to_string().into());
        }

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(format!("{}/{}.json", deployment.owner_id, deployment.id))
            .send()
            .await
            .map_err(|err| err.to_string())?;

        Ok(())
    }
}

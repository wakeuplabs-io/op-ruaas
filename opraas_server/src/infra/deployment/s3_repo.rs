use aws_sdk_s3::primitives::ByteStream;
use opraas_core::domain::Deployment;

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

    pub async fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket_name)
            .key(format!("{}/{}.json", "username", id))
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

    pub async fn find_all(&self, prefix: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let resp = self
            .client
            .list_objects_v2()
            .bucket(&self.bucket_name)
            .prefix(prefix)
            .send()
            .await?;

        let mut files = Vec::new();
        if let Some(objects) = resp.contents {
            for object in objects {
                if let Some(key) = object.key {
                    files.push(key);
                }
            }
        }

        Ok(files)
    }

    pub async fn save(&self, deployment: &mut Deployment) -> Result<(), Box<dyn std::error::Error>> {
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

    pub async fn delete(&self, id: &str) -> Result<(), Box<dyn std::error::Error>> {
        self.client
            .delete_object()
            .bucket(&self.bucket_name)
            .key(format!("{}/{}.json", "username", id))
            .send()
            .await
            .map_err(|err| err.to_string())?;

        Ok(())
    }
}

use serde_json::Value;
use std::error::Error;

pub trait EthRpc {
    fn send_rpc_request(
        &self,
        base_url: &str,
        iden: u64,
        method: &str,
        params: Vec<Value>,
    ) -> Result<Value, Box<dyn Error>>;
}

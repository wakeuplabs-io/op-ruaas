use super::EthRpc;
use reqwest::{blocking::Client, header::CONTENT_TYPE};
use serde_json::{json, Value};

pub struct JsonRpc {}

// implementations ================================================

impl Default for JsonRpc {
    fn default() -> Self {
        Self::new()
    }
}

impl JsonRpc {
    pub fn new() -> JsonRpc {
        JsonRpc {}
    }
}

impl EthRpc for JsonRpc {
    fn send_rpc_request(
        &self,
        base_url: &str,
        iden: u64,
        method: &str,
        params: Vec<serde_json::Value>,
    ) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let client = Client::new();

        let body = json!({
            "id": iden,
            "jsonrpc": "2.0",
            "method": method,
            "params": params
        });

        let response = client
            .post(base_url)
            .body(body.to_string())
            .header(CONTENT_TYPE, "application/json")
            .send()?;

        let data = response.text()?;
        let json_demo: Value = serde_json::from_str(&data)?;

        Ok(json_demo)
    }
}

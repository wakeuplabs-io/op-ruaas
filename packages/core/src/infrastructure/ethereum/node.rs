pub trait TTestnetNode {
    fn start(&self, chain_id: u32, port: u64) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self) -> Result<(), Box<dyn std::error::Error>>;
}

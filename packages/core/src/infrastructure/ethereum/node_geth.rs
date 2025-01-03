use super::{EthRpc, JsonRpc, TTestnetNode};
use crate::system::execute_command;
use serde_json::json;
use std::{process::Command, thread, time};

const DOCKER_IMAGE: &str = "ethereum/client-go:v1.13.4";
const CONTAINER_NAME: &str = "geth-testnet-node";
const MAX_TIMEOUT: u64 = 30;

pub struct GethTestnetNode {
    eth_rpc: Box<dyn EthRpc>,
}

// implementations ==============================================

impl GethTestnetNode {
    pub fn new() -> Self {
        Self {
            eth_rpc: Box::new(JsonRpc::new()),
        }
    }
}

impl TTestnetNode for GethTestnetNode {
    fn start(&self, chain_id: u32, port: u64) -> Result<(), Box<dyn std::error::Error>> {
        if chain_id != 1337 {
            return Err("Unsupported chain id".into());
        }

        execute_command(Command::new("docker").args(["pull", DOCKER_IMAGE]), false)?;

        execute_command(
            Command::new("docker").args([
                "run",
                "-d",
                "--rm",
                "-p",
                &format!("{}:8545", port),
                "--name",
                CONTAINER_NAME,
                DOCKER_IMAGE,
                "--dev",
                "--http",
                "--http.api=eth,debug",
                &format!("--http.port={}", port),
                "--http.corsdomain=*",
                "--http.vhosts=*",
                "--http.addr=0.0.0.0",
                "--verbosity=4",
                "--gcmode=archive",
                "--dev.gaslimit=30000000",
                "--dev.period=1",
                "--rpc.allow-unprotected-txs",
                "--state.scheme=path",
            ]),
            true,
        )?;

        // Wait for node to start
        let timeout_duration = time::Duration::from_secs(MAX_TIMEOUT);
        let start_time = time::Instant::now();

        // Fetch the chain ID synchronously
        let rpc_url = format!("http://127.0.0.1:{}", port);

        loop {
            if start_time.elapsed() >= timeout_duration {
                return Err(format!(
                    "Timeout reached: Node did not respond within {} seconds.",
                    MAX_TIMEOUT
                )
                .into());
            }

            match self
                .eth_rpc
                .send_rpc_request(&rpc_url, 1, "eth_chainId", vec![])
            {
                Ok(_) => {
                    break; /*  geth is ready */
                }
                Err(_) => { /* unable to connect, retry */ }
            }

            thread::sleep(time::Duration::from_secs(2));
        }

        let accounts = self
            .eth_rpc
            .send_rpc_request(&rpc_url, 2, "eth_accounts", vec![])?;
        let send_from = accounts
            .get("result")
            .and_then(|v| v.get(0))
            .unwrap()
            .as_str()
            .unwrap();

        // fund dev accounts with 1000 eth each

        let dev_accounts = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
            "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
            "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
            "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
            "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
            "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
            "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
            "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
            "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
            "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
            "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
            "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
            "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
            "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
            "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
            "0x09DB0a93B389bEF724429898f539AEB7ac2Dd55f",
            "0x02484cb50AAC86Eae85610D6f4Bf026f30f6627D",
            "0x08135Da0A343E492FA2d4282F2AE34c6c5CC1BbE",
            "0x5E661B79FE2D3F6cE70F5AAC07d8Cd9abb2743F1",
            "0x61097BA76cD906d2ba4FD106E757f7Eb455fc295",
            "0xDf37F81dAAD2b0327A0A50003740e1C935C70913",
            "0x553BC17A05702530097c3677091C5BB47a3a7931",
            "0x87BdCE72c06C21cd96219BD8521bDF1F42C78b5e",
            "0x40Fc963A729c542424cD800349a7E4Ecc4896624",
            "0x9DCCe783B6464611f38631e6C851bf441907c710",
        ];
        for account in dev_accounts {
            self.eth_rpc.send_rpc_request(
                &rpc_url,
                1,
                "eth_sendTransaction",
                vec![json!( {
                    "from": send_from,
                    "to": account,
                    "value": "0x21E19E0C9BAB2400000",
                })],
            )?;
        }

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        let running_containers = execute_command(Command::new("docker").arg("ps"), true)?;
        if running_containers.contains(CONTAINER_NAME) == false {
            return Ok(());
        }

        let _ = execute_command(Command::new("docker").arg("stop").arg(CONTAINER_NAME), true);
        let _ = execute_command(Command::new("docker").arg("rm").arg(CONTAINER_NAME), true);

        Ok(())
    }
}

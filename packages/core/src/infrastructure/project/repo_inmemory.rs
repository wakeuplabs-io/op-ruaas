use std::path::Path;

use crate::{
    config::CoreConfig,
    domain::{self, Dockerfiles, Infrastructure, HelmCharts, Project, Src},
};

pub struct InMemoryProjectRepository;

impl Default for InMemoryProjectRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl InMemoryProjectRepository {
    pub fn new() -> Self {
        Self
    }
}

impl domain::project::TProjectRepository for InMemoryProjectRepository {
    fn create(&self, root: &Path, config: &CoreConfig) -> Result<Project, Box<dyn std::error::Error>> {
        std::fs::write(root.join("README.md"), README)?;
        std::fs::write(root.join(".gitignore"), GITIGNORE)?;
        std::fs::write(root.join(".env"), ENV_FILE)?;
        std::fs::write(root.join(".env.sample"), ENV_FILE)?;
        std::fs::write(root.join("config.toml"), toml::to_string(config).unwrap())?;

        Ok(Project {
            root: root.to_path_buf(),
            config: root.join("config.toml"),
            infrastructure: Infrastructure {
                root: root.join("infra"),
                aws: root.join("infra").join("aws"),
                helm: HelmCharts {
                    root: root.join("infra").join("helm"),
                    sequencer: root.join("infra").join("helm").join("sequencer"),
                    replica: root.join("infra").join("helm").join("replica"),
                },
                docker: Dockerfiles {
                    root: root.join("infra").join("docker"),
                    node: root.join("infra").join("docker").join("node.dockerfile"),
                    geth: root.join("infra").join("docker").join("geth.dockerfile"),
                    batcher: root.join("infra").join("docker").join("batcher.dockerfile"),
                    proposer: root
                        .join("infra")
                        .join("docker")
                        .join("proposer.dockerfile"),
                    explorer: root
                        .join("infra")
                        .join("docker")
                        .join("explorer.dockerfile"),
                    contracts: root
                        .join("infra")
                        .join("docker")
                        .join("contracts.dockerfile"),
                },
            },
            src: Src {
                root: root.join("src"),
                contracts: root.join("src").join("contracts"),
                node: root.join("src").join("node"),
                geth: root.join("src").join("geth"),
                batcher: root.join("src").join("batcher"),
                proposer: root.join("src").join("proposer"),
                explorer: root.join("src").join("explorer"),
            },
        })
    }

    fn exists(&self, project: &Project) -> bool {
        project.root.exists()
    }

    fn has(&self, project: &Project, filepath: &Path) -> bool {
        filepath.starts_with(&project.root) && filepath.exists()
    }

    fn write(&self, project: &Project, filepath: &Path, content: &str) -> Result<(), Box<dyn std::error::Error>> {
        // ensure filepath is a subpath of the project root
        if !filepath.starts_with(&project.root) {
            return Err("File path is not a subpath of the project root".into());
        }

        // Creates all missing directories in the path
        if let Some(parent) = filepath.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(filepath, content)?;

        Ok(())
    }
}

const README: &str = r#"

# Opruaas - Optimism Rollup as a service

Optimism Rollup As A Service. Easily deploy and manage rollups with the Optimism stack.

## Opruaas cli

Install with `npm i -g @wakeuplabs/opruaas`

### System Requirements  

Ensure you have the following tools installed and properly configured:  

- **Docker**: `>= 24.0.0` 
- **Docker Buildx**: `>= 0.18.0` (recommended if building images specially for arm machines to build linux/amd64) 
- **kubectl**: `>= 1.28.0` (ensure kubernetes engine is running when calling the cli, you can check with `kubectl version`)
- **Helm**: `>= 3.0.0`  
- **Terraform**: `>= 1.9.8` (with AWS authentication configured)  
- **Git**: `>= 2.0.0`  

To run it all smoothly we recommend:
- 16 GB Ram specially if building contracts image, otherwise 8 GB should get things moving as well.
- 25+ GB free on top of installed programs (This should account for images and volume claims (customizable from values.yaml))

### Commands

Usage: `opruaas [OPTIONS] <COMMAND>`  

#### Available Commands:
- `new`      Create a new project, template config file, and folders  
- `init`     Initialize a new project  
- `build`    Compile sources and create Docker images  
- `release`  Tag and push the already built Docker images to the registry for deployment  
- `dev`      Spin up a local development environment  
- `deploy`   Deploy your blockchain. Target must be one of: `contracts`, `infra`, `all`  
- `inspect`  Get details about the current deployment. Target must be one of: `contracts`, `infra`  
- `help`     Print this message or the help for the given subcommand(s)  

#### Options:
- `-q`, `--quiet`    Suppress logging output  
- `-h`, `--help`     Print help  
- `-V`, `--version`  Print version

### Create a New Project and Build Releases from Source  

Follow these steps to create a new project and build releases:  

```bash
# 1. Create your project
npx opruaas new my-chain && cd my-chain

# 2. Fill out the config.toml and .env files

# 3. Pull sources with init (target can be one of: all | batcher | node | geth | contracts)
npx opruaas init contracts

# 4. Build the images
npx opruaas build contracts

# 5. Release the build
# Ensure Docker is properly configured with permissions to push to your target repository
npx opruaas release contracts
```

### Test releases with dev

The dev command simplifies the setup for local testing. It performs the following actions:

1. Starts an L1 Node: Launches a Geth-based Layer 1 node.
2. Deploys Deterministic Contracts: Sets up the deterministic contract deployer on the node.
3. Deploys Your Chain Contracts: Automatically deploys your chain-specific contracts.
4. Installs Helm Chart: Configures the corresponding Helm chart on your local machine for testing.

**Prerequisites**
- You need to provide the `container registry` and the release `name` for your deployment.
- For reference, you can use the example configuration at `wakeuplabs` with the release name `v0.0.4`.

**Usage**
Run the following command to execute the setup:

```bash
# Use -v for verbose output; recommended as the process may take some time
npx opruaas -v dev
```

Once all deployments are up and running, it may take some time for the system to become fully responsive. This includes:
- RPC responsiveness: The RPC endpoint may initially take a few moments to respond to queries.
- Explorer indexing: The block explorer will need time to finish indexing before it can display your transactions.

**Testing Your Setup**

If you have cast installed, the following commands can help you test the deployment and interact with the setup:

```bash
cast chain-id --rpc-url http://localhost:80/rpc

cast balance 0x3fAB184622Dc19b6109349B94811493BF2a45362 --rpc-url http://localhost:80/rpc

cast send \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:80/rpc \
  --value 1ether \
  0x3fAB184622Dc19b6109349B94811493BF2a45362
```

In dev mode, all wallets on both L1 and L2 will be funded by default. This is achieved by automatically setting `fund_dev_accounts` to `true`.

```
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 with 10000 ETH
0x70997970C51812dc3A010C7d01b50e0d17dc79C8 with 10000 ETH
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC with 10000 ETH
0x90F79bf6EB2c4f870365E785982E1f101E93b906 with 10000 ETH
0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 with 10000 ETH
0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc with 10000 ETH
0x976EA74026E726554dB657fA54763abd0C3a0aa9 with 10000 ETH
0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 with 10000 ETH
0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f with 10000 ETH
0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 with 10000 ETH
0xBcd4042DE499D14e55001CcbB24a551F3b954096 with 10000 ETH
0x71bE63f3384f5fb98995898A86B02Fb2426c5788 with 10000 ETH
0xFABB0ac9d68B0B445fB7357272Ff202C5651694a with 10000 ETH
0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec with 10000 ETH
0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097 with 10000 ETH
0xcd3B766CCDd6AE721141F452C550Ca635964ce71 with 10000 ETH
0x2546BcD3c84621e976D8185a91A922aE77ECEc30 with 10000 ETH
0xbDA5747bFD65F08deb54cb465eB87D40e51B197E with 10000 ETH
0xdD2FD4581271e230360230F9337D5c0430Bf44C0 with 10000 ETH
0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 with 10000 ETH
0x09DB0a93B389bEF724429898f539AEB7ac2Dd55f with 10000 ETH
0x02484cb50AAC86Eae85610D6f4Bf026f30f6627D with 10000 ETH
0x08135Da0A343E492FA2d4282F2AE34c6c5CC1BbE with 10000 ETH
0x5E661B79FE2D3F6cE70F5AAC07d8Cd9abb2743F1 with 10000 ETH
0x61097BA76cD906d2ba4FD106E757f7Eb455fc295 with 10000 ETH
0xDf37F81dAAD2b0327A0A50003740e1C935C70913 with 10000 ETH
0x553BC17A05702530097c3677091C5BB47a3a7931 with 10000 ETH
0x87BdCE72c06C21cd96219BD8521bDF1F42C78b5e with 10000 ETH
0x40Fc963A729c542424cD800349a7E4Ecc4896624 with 10000 ETH
0x9DCCe783B6464611f38631e6C851bf441907c710 with 10000 ETH
```

Once the setup is complete, you can access the following services:
- L1 RPC: http://localhost:8545
- L2 RPC: http://localhost:80/rpc
- Off-chain Monitoring: http://localhost:80/monitoring
- Explorer: http://localhost:80

### Deploy contracts/infra/all

Ensure that your `config.toml` configuration file is properly set up before proceeding.

```bash
# Use -v for verbose output; recommended for detailed progress logs.
npx opruaas -v deploy all --name my-prod-deployment
```
- Optional Flag:
  Add `--deploy-deployer` if the L1 chain does not already have a deployer. For most popular L1 chains, this step is unnecessary.


The deployment process will create a deployments/my-prod-deployment directory containing the generated artifacts.

- Artifacts:
  These files are crucial for running your chain. Ensure you keep them safe and do not lose them.
- Inspecting Artifacts:
  You can manually review the artifacts or use the inspect command for easier analysis.

"#;

const GITIGNORE: &str = r#"
.env
"#;

const ENV_FILE: &str = r#"
L1_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/..."
ADMIN_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
BATCHER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PROPOSER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
SEQUENCER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHALLENGER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
"#;

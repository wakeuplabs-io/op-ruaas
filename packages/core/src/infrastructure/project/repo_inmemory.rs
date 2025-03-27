use std::path::Path;

use crate::{
    config::CoreConfig,
    domain::{self, Dockerfiles, HelmCharts, Infrastructure, Project, Src},
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
# Opruaas cli

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

- `new` Create a new project, template config file, and folders
- `init` Initialize a new project
- `build` Compile sources and create Docker images
- `release` Tag and push the already built Docker images to the registry for deployment
- `start` Spin up a local development environment
- `deploy` Deploy your blockchain. Target must be one of: `contracts`, `infra`, `all`
- `inspect` Get details about the current deployment. Target must be one of: `contracts`, `infra`
- `monitor` Monitor your deployment. A wrapper around [op-monitorism](https://github.com/ethereum-optimism/monitorism/tree/op-monitorism/v0.0.6/op-monitorism) and [op-dispute-mon](https://github.com/ethereum-optimism/optimism/tree/v1.12.1/op-dispute-mon)
- `help` Print this message or the help for the given subcommand(s)

#### Options:

- `-v`, `--verbose` Verbose output
- `-h`, `--help` Print help
- `-V`, `--version` Print version

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

> Please refer to current contracts image to output a cli compatible zip.

### Test releases with start

The `start` command simplifies the setup for local testing. It performs the following actions:

1. Starts an L1 Node: Launches a Geth-based Layer 1 node.
2. Deploys Deterministic Contracts: Sets up the deterministic contract deployer on the node.
3. Deploys Your Chain Contracts: Automatically deploys your chain-specific contracts.
4. Installs Helm Chart: Configures the corresponding Helm chart on your local machine for testing.

**Prerequisites**

- You need to provide the `container registry` and the release `name` for your deployment.
- For reference, you can use the example configuration at `wakeuplabs` with the release name `v1.0.0`.

**Usage**
Run the following command to execute the setup:

```bash
# Use -v for verbose output; recommended as the process may take some time, specially first time when downloading images
npx opruaas -v start
```

Once all deployments are up and running, it may take some time for the system to become fully responsive. This includes:

- RPC responsiveness: The RPC endpoint may initially take a few moments to respond to queries.
- Explorer indexing: The block explorer will need time to finish indexing before it can display your transactions.

**Testing Your Setup**

If you have cast installed, the following commands can help you test the deployment and interact with the setup:

```bash
cast chain-id --rpc-url http://rpc.localhost:80

cast balance 0x3fAB184622Dc19b6109349B94811493BF2a45362 --rpc-url http://rpc.localhost:80
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://rpc.localhost:80

cast send \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://rpc.localhost:80 \
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
- L2 RPC: http://rpc.localhost
- Off-chain Monitoring: http://monitoring.localhost
- Explorer: http://explorer.localhost

### Deploy contracts/infra(sequencer/replica) with `deploy`

Ensure that your `config.toml` configuration file is properly set up before proceeding.

```bash
# Use -v for verbose output; recommended for detailed progress logs.
npx opruaas -v deploy --deployment-id holenksy --deployment-name "My First Deployment"
```

- Optional Flag:
  Add `--deploy-deterministic-deployer` if the L1 chain does not already have a deployer. For most popular L1 chains, this step is unnecessary.

The deployment process will create a deployments/my-prod-deployment directory containing the generated artifacts.

- Artifacts:
  These files are crucial for running your chain. Ensure you keep them safe and do not lose them.
- Inspecting Artifacts:
  You can manually review the artifacts or use the inspect command for easier analysis.

### Monitor your chain with `monitor`

There're two main options here, `onchain` and `offchain`.

- `onchain` is a wrapper around [op-monitorism](https://github.com/ethereum-optimism/monitorism/tree/op-monitorism/v0.0.6/op-monitorism) and [op-dispute-mon](https://github.com/ethereum-optimism/optimism/tree/v1.12.1/op-dispute-mon) which we prefill with the specified deployment data.
- `offchain` will just remember the user the graphana url for them to check server status and other reports.

Example usage:

```bash
opruaas monitor offchain --deployment-id dev
# Monitor URL:
# http://monitoring.localhost:80

opruaas -v monitor onchain --deployment-id dev --kind balances -- --accounts 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:mine
# Running monitor...
# Remember to use '-v' to see the logs. We'll prefill some values for you.
#  INFO opraas_core::utils::system > Executing command: "docker" "pull" "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest"
# latest: Pulling from oplabs-tools-artifacts/images/op-monitorism
# Digest: sha256:f9e49a4d324ddcec97f677c98411dc901238a8c94f4ea35c7a1a87080a60cf2e
# Status: Image is up to date for us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest
# us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest
#  INFO opraas_core::utils::system > Executing command: "docker" "run" "--rm" "-v" "/Users/matzapata/git-work/optimism/opruaas/other-demo:/shared" "--name" "op-monitor" "us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest" "/usr/local/bin/monitorism" "balances" "--node.url" "http://host.docker.internal:8545" "--accounts" "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:mine"
# t=2025-03-14T20:32:22+0000 lvl=info msg="creating balance monitor"
# t=2025-03-14T20:32:22+0000 lvl=info msg="configured account" address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 nickname=mine
# t=2025-03-14T20:32:22+0000 lvl=info msg="starting metrics server" host=0.0.0.0 port=7300
# t=2025-03-14T20:32:22+0000 lvl=info msg="starting monitor..." loop_interval_ms=60000
# t=2025-03-14T20:32:22+0000 lvl=info msg="querying balances..."
# t=2025-03-14T20:32:22+0000 lvl=info msg="set balance" address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 nickname=mine balance=9998.980231447096
```

## Chain management

### Update sequencer wallet

Weather you want to rotate your wallets, or they've been compromised, you may want to update your sequencer wallet. To do so you need to go to the `SystemConfigProxy` and call `setUnsafeBlockSigner`. To do it with `cast` replace with your values here:

```bash
cast send {SystemConfigProxy} "setUnsafeBlockSigner(address _unsafeBlockSigner)" {NewSequencer} --rpc-url {L1RpcUrl} --private-key {AdminPrivateKey}

# Example locally just removing current one
cast send 0x0B306BF915C4d645ff596e518fAf3F9669b97016 "setUnsafeBlockSigner(address _unsafeBlockSigner)" 0x0000000000000000000000000000000000000000 --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

And verify with:

```bash
cast call {SystemConfigProxy} "unsafeBlockSigner() public view returns (address)" --rpc-url {L1RpcUrl}

# Example locally
cast call 0x0B306BF915C4d645ff596e518fAf3F9669b97016 "unsafeBlockSigner() public view returns (address)" --rpc-url http://localhost:8545
```

### Update batcher wallet

Weather you want to rotate your wallets, or they've been compromised, you may want to update your sequencer wallet. To do so you need to go to the `SystemConfigProxy` and call `setBatcherHash`. To do it with `cast` replace with your values here:

```bash
cast send {SystemConfigProxy} "setBatcherHash(bytes32 _batcherHash)" {"bytes32(uint256(uint160(_cfg.batchSenderAddress())))"} --rpc-url {L1RpcUrl} --private-key {AdminPrivateKey}

# Example locally just removing current batcher
cast send 0x0B306BF915C4d645ff596e518fAf3F9669b97016 "setBatcherHash(bytes32 _batcherHash)" 0x0000000000000000000000000000000000000000000000000000000000000000 --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

And verify with:

```bash
cast call {SystemConfigProxy} "batcherHash() public view returns (bytes32)" --rpc-url {L1RpcUrl}

# Example locally
cast call 0x0B306BF915C4d645ff596e518fAf3F9669b97016 "batcherHash() public view returns (bytes32)" --rpc-url http://localhost:8545
```

### Update proposer / challenger wallets

To update proposer and challenger wallets it's a bit more work.

A quick deactivation in case of emergency could be just removing the implementation:

AdminUser -> SystemOwnerSafe -> ProxyAdmin -> upgrade ....

```bash
cast send --rpc-url {L1Rpc} --private-key {AdminPrivateKey} {SystemOwnerSafe} "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" {ProxyAdmin} 0x0 $(cast calldata "upgrade(address, address)" {L2OutputOracleProxy} {NewImplementation}) 0 0 0 0 0x0000000000000000000000000000000000000000  0x0000000000000000000000000000000000000000 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000001

# And verify with
cast call {L2OutputOracleProxy} "implementation()(address)"  --rpc-url http://localhost:8545

# Example locally, update accordingly
cast send --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 0xfB4ED8d767750714d7c8b041EA4740D34f635461 "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 0x0 $(cast calldata "upgrade(address, address)" 0x59b670e9fA9D0A427751Af201D676719a970857b 0x0000000000000000000000000000000000000000) 0 0 0 0 0x0000000000000000000000000000000000000000  0x0000000000000000000000000000000000000000 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000001

cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "implementation()(address)"  --rpc-url http://localhost:8545
```

A proper update would imply to deploy a new `L2OutputOracle`, initialize it with the new values and then update the implementation in the proxy:

```bash
# recover config params from old one
cast call {OldL2OutputOracle} "submissionInterval()(uint256)" --rpc-url {L1RpcUrl}
cast call {OldL2OutputOracle} "l2BlockTime()(uint256)" --rpc-url {L1RpcUrl}
cast call {OldL2OutputOracle} "startingBlockNumber()(uint256)" --rpc-url {L1RpcUrl}
cast call {OldL2OutputOracle} "startingTimestamp()(uint256)" --rpc-url {L1RpcUrl}
cast call {OldL2OutputOracle} "finalizationPeriodSeconds()(uint256)" --rpc-url {L1RpcUrl}

# deploy the new oracle
cast send --rpc-url {L1RpcUrl} --private-key {AdminPrivateKey} --create {L2OutputOracleByteCode}
cast send {NewL2OutputOracle} "initialize(uint256 _submissionInterval, uint256 _l2BlockTime, uint256 _startingBlockNumber, uint256 _startingTimestamp, address _proposer, address _challenger, uint256 _finalizationPeriodSeconds)" {...params from above + new challenger and proposer}  --rpc-url {L1RpcUrl} --private-key {AdminPrivateKey}

cast send --rpc-url {L1Rpc} --private-key {AdminPrivateKey} {SystemOwnerSafe} "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" {ProxyAdmin} 0x0 $(cast calldata "upgrade(address, address)" {L2OutputOracleProxy} {NewImplementation}) 0 0 0 0 0x0000000000000000000000000000000000000000  0x0000000000000000000000000000000000000000 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000001

# Example locally =============================================

cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "submissionInterval()(uint256)" --rpc-url http://localhost:8545
cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "l2BlockTime()(uint256)" --rpc-url http://localhost:8545
cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "startingBlockNumber()(uint256)" --rpc-url http://localhost:8545
cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "startingTimestamp()(uint256)" --rpc-url http://localhost:8545
cast call 0x59b670e9fA9D0A427751Af201D676719a970857b "finalizationPeriodSeconds()(uint256)" --rpc-url http://localhost:8545

cast send --rpc-url http://localhost:8545 --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --create 0x608060405234801561001057600080fd5b506115b9806100206000396000f3fe60806040526004361061018a5760003560e01c806389c44cbb116100d6578063ce5db8d61161007f578063dcec334811610059578063dcec33481461049b578063e1a41bcf146104b0578063f4daa291146104c657600080fd5b8063ce5db8d614610445578063cf8e5cf01461045b578063d1de856c1461047b57600080fd5b8063a25ae557116100b0578063a25ae55714610391578063a8e4fb90146103ed578063bffa7f0f1461041a57600080fd5b806389c44cbb1461034857806393991af3146103685780639aaab6481461037e57600080fd5b806369f16eec1161013857806370872aa51161011257806370872aa5146102fc5780637f00642014610312578063887862721461033257600080fd5b806369f16eec146102a75780636abcf563146102bc5780636b4d98dd146102d157600080fd5b8063529933df11610169578063529933df146101ea578063534db0e2146101ff57806354fd4d501461025157600080fd5b80622134cc1461018f5780631c89c97d146101b35780634599c788146101d5575b600080fd5b34801561019b57600080fd5b506005545b6040519081526020015b60405180910390f35b3480156101bf57600080fd5b506101d36101ce366004611386565b6104db565b005b3480156101e157600080fd5b506101a06108b6565b3480156101f657600080fd5b506004546101a0565b34801561020b57600080fd5b5060065461022c9073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016101aa565b34801561025d57600080fd5b5061029a6040518060400160405280600581526020017f312e382e3000000000000000000000000000000000000000000000000000000081525081565b6040516101aa91906113e9565b3480156102b357600080fd5b506101a0610929565b3480156102c857600080fd5b506003546101a0565b3480156102dd57600080fd5b5060065473ffffffffffffffffffffffffffffffffffffffff1661022c565b34801561030857600080fd5b506101a060015481565b34801561031e57600080fd5b506101a061032d36600461145c565b61093b565b34801561033e57600080fd5b506101a060025481565b34801561035457600080fd5b506101d361036336600461145c565b610b4f565b34801561037457600080fd5b506101a060055481565b6101d361038c366004611475565b610de9565b34801561039d57600080fd5b506103b16103ac36600461145c565b61124a565b60408051825181526020808401516fffffffffffffffffffffffffffffffff9081169183019190915292820151909216908201526060016101aa565b3480156103f957600080fd5b5060075461022c9073ffffffffffffffffffffffffffffffffffffffff1681565b34801561042657600080fd5b5060075473ffffffffffffffffffffffffffffffffffffffff1661022c565b34801561045157600080fd5b506101a060085481565b34801561046757600080fd5b506103b161047636600461145c565b6112de565b34801561048757600080fd5b506101a061049636600461145c565b611316565b3480156104a757600080fd5b506101a0611346565b3480156104bc57600080fd5b506101a060045481565b3480156104d257600080fd5b506008546101a0565b600054610100900460ff16158080156104fb5750600054600160ff909116105b806105155750303b158015610515575060005460ff166001145b6105a6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a656400000000000000000000000000000000000060648201526084015b60405180910390fd5b600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00166001179055801561060457600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff166101001790555b60008811610694576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603a60248201527f4c324f75747075744f7261636c653a207375626d697373696f6e20696e74657260448201527f76616c206d7573742062652067726561746572207468616e2030000000000000606482015260840161059d565b60008711610724576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603460248201527f4c324f75747075744f7261636c653a204c3220626c6f636b2074696d65206d7560448201527f73742062652067726561746572207468616e2030000000000000000000000000606482015260840161059d565b428511156107db576040517f08c379a0000000000000000000000000000000000000000000000000000000008152602060048201526044602482018190527f4c324f75747075744f7261636c653a207374617274696e67204c322074696d65908201527f7374616d70206d757374206265206c657373207468616e2063757272656e742060648201527f74696d6500000000000000000000000000000000000000000000000000000000608482015260a40161059d565b60048890556005879055600186905560028590556007805473ffffffffffffffffffffffffffffffffffffffff8087167fffffffffffffffffffffffff0000000000000000000000000000000000000000928316179092556006805492861692909116919091179055600882905580156108ac57600080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00ff169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b5050505050505050565b6003546000901561092057600380546108d1906001906114d6565b815481106108e1576108e16114ed565b600091825260209091206002909102016001015470010000000000000000000000000000000090046fffffffffffffffffffffffffffffffff16919050565b6001545b905090565b600354600090610924906001906114d6565b60006109456108b6565b8211156109fa576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604860248201527f4c324f75747075744f7261636c653a2063616e6e6f7420676574206f7574707560448201527f7420666f72206120626c6f636b207468617420686173206e6f74206265656e2060648201527f70726f706f736564000000000000000000000000000000000000000000000000608482015260a40161059d565b600354610aaf576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604660248201527f4c324f75747075744f7261636c653a2063616e6e6f7420676574206f7574707560448201527f74206173206e6f206f7574707574732068617665206265656e2070726f706f7360648201527f6564207965740000000000000000000000000000000000000000000000000000608482015260a40161059d565b6003546000905b80821015610b485760006002610acc838561151c565b610ad69190611534565b90508460038281548110610aec57610aec6114ed565b600091825260209091206002909102016001015470010000000000000000000000000000000090046fffffffffffffffffffffffffffffffff161015610b3e57610b3781600161151c565b9250610b42565b8091505b50610ab6565b5092915050565b60065473ffffffffffffffffffffffffffffffffffffffff163314610bf6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603e60248201527f4c324f75747075744f7261636c653a206f6e6c7920746865206368616c6c656e60448201527f67657220616464726573732063616e2064656c657465206f7574707574730000606482015260840161059d565b6003548110610cad576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604360248201527f4c324f75747075744f7261636c653a2063616e6e6f742064656c657465206f7560448201527f747075747320616674657220746865206c6174657374206f757470757420696e60648201527f6465780000000000000000000000000000000000000000000000000000000000608482015260a40161059d565b60085460038281548110610cc357610cc36114ed565b6000918252602090912060016002909202010154610cf3906fffffffffffffffffffffffffffffffff16426114d6565b10610da6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604660248201527f4c324f75747075744f7261636c653a2063616e6e6f742064656c657465206f7560448201527f74707574732074686174206861766520616c7265616479206265656e2066696e60648201527f616c697a65640000000000000000000000000000000000000000000000000000608482015260a40161059d565b6000610db160035490565b90508160035581817f4ee37ac2c786ec85e87592d3c5c8a1dd66f8496dda3f125d9ea8ca5f657629b660405160405180910390a35050565b60075473ffffffffffffffffffffffffffffffffffffffff163314610eb6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604160248201527f4c324f75747075744f7261636c653a206f6e6c79207468652070726f706f736560448201527f7220616464726573732063616e2070726f706f7365206e6577206f757470757460648201527f7300000000000000000000000000000000000000000000000000000000000000608482015260a40161059d565b610ebe611346565b8314610f72576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604860248201527f4c324f75747075744f7261636c653a20626c6f636b206e756d626572206d757360448201527f7420626520657175616c20746f206e65787420657870656374656420626c6f6360648201527f6b206e756d626572000000000000000000000000000000000000000000000000608482015260a40161059d565b42610f7c84611316565b10611009576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603660248201527f4c324f75747075744f7261636c653a2063616e6e6f742070726f706f7365204c60448201527f32206f757470757420696e207468652066757475726500000000000000000000606482015260840161059d565b83611096576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603a60248201527f4c324f75747075744f7261636c653a204c32206f75747075742070726f706f7360448201527f616c2063616e6e6f7420626520746865207a65726f2068617368000000000000606482015260840161059d565b81156111525781814014611152576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604960248201527f4c324f75747075744f7261636c653a20626c6f636b206861736820646f65732060448201527f6e6f74206d61746368207468652068617368206174207468652065787065637460648201527f6564206865696768740000000000000000000000000000000000000000000000608482015260a40161059d565b8261115c60035490565b857fa7aaf2512769da4e444e3de247be2564225c2e7a8f74cfe528e46e17d24868e24260405161118e91815260200190565b60405180910390a45050604080516060810182529283526fffffffffffffffffffffffffffffffff4281166020850190815292811691840191825260038054600181018255600091909152935160029094027fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b810194909455915190518216700100000000000000000000000000000000029116177fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85c90910155565b60408051606081018252600080825260208201819052918101919091526003828154811061127a5761127a6114ed565b600091825260209182902060408051606081018252600290930290910180548352600101546fffffffffffffffffffffffffffffffff8082169484019490945270010000000000000000000000000000000090049092169181019190915292915050565b604080516060810182526000808252602082018190529181019190915260036113068361093b565b8154811061127a5761127a6114ed565b60006005546001548361132991906114d6565b611333919061156f565b600254611340919061151c565b92915050565b60006004546113536108b6565b610924919061151c565b803573ffffffffffffffffffffffffffffffffffffffff8116811461138157600080fd5b919050565b600080600080600080600060e0888a0312156113a157600080fd5b873596506020880135955060408801359450606088013593506113c66080890161135d565b92506113d460a0890161135d565b915060c0880135905092959891949750929550565b600060208083528351808285015260005b81811015611416578581018301518582016040015282016113fa565b81811115611428576000604083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016929092016040019392505050565b60006020828403121561146e57600080fd5b5035919050565b6000806000806080858703121561148b57600080fd5b5050823594602084013594506040840135936060013592509050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000828210156114e8576114e86114a7565b500390565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b6000821982111561152f5761152f6114a7565b500190565b60008261156a577f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b500490565b6000817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff04831182151516156115a7576115a76114a7565b50029056fea164736f6c634300080f000a

# Extract contractAddress form deployment receipt above and initialize
cast send --rpc-url http://localhost:8545 --private-key ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  0x8B290Fe1d6f55A1934020753D594eEAB37A22732 "initialize(uint256 _submissionInterval, uint256 _l2BlockTime, uint256 _startingBlockNumber, uint256 _startingTimestamp, address _proposer, address _challenger, uint256 _finalizationPeriodSeconds)" 120 2 0 1741193968 0xb0bc9e2602d7d0f78a6e966175d48aa84a90de3b 0xb0bc9e2602d7d0f78a6e966175d48aa84a90de3b 12

cast send --rpc-url {L1Rpc} --private-key {AdminPrivateKey} {SystemOwnerSafe} "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)" {ProxyAdmin} 0x0 $(cast calldata "upgrade(address, address)" {L2OutputOracleProxy} {NewImplementation}) 0 0 0 0 0x0000000000000000000000000000000000000000  0x0000000000000000000000000000000000000000 0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000001
```

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

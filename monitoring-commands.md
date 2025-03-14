# Monitorism

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism ...
```

## multisig [FAIL]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism multisig --help

OPTIONS:
   --l1.node.url value             Node URL of L1 peer (default: "127.0.0.1:8545") [$MULTISIG_MON_L1_NODE_URL]
   --optimismportal.address value  Address of the OptimismPortal contract [$MULTISIG_MON_OPTIMISM_PORTAL]
   --safe.address value            Address of the Safe contract [$MULTISIG_MON_SAFE]
   --op.vault value                1Pass vault name storing presigned safe txs following a 'ready-<nonce>.json' item name format [$MULTISIG_MON_1PASS_VAULT_NAME]
```

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism multisig --l1.node.url http://host.docker.internal:8545 --optimismportal.address 0x9A676e781A523b5d0C0e43731313A708CB607508 --safe.address 0x9FE103Ee652B20A798dcF010C5b4809fAF0d2A5a --op.vault myvault --nickname demo
```

## fault [FAIL]

fault Monitors output roots posted on L1 against L2

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism fault --help

 --l1.node.url value             Node URL of L1 peer (default: "127.0.0.1:8545") [$FAULT_MON_L1_NODE_URL]
   --l2.node.url value             Node URL of L2 peer (default: "127.0.0.1:9545") [$FAULT_MON_L2_NODE_URL]
   --optimismportal.address value  Address of the OptimismPortal contract [$FAULT_MON_OPTIMISM_PORTAL]
```

```
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism fault --l1.node.url  http://host.docker.internal:8545 --l2.node.url http://host.docker.internal:80/rpc --optimismportal.address 0x31f2A70b5260fB61819A5239Fc7211D00aa84fF0
```

## withdrawals [OK]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism withdrawals --help

   --l1.node.url value             Node URL of L1 peer (default: "127.0.0.1:8545") [$WITHDRAWAL_MON_L1_NODE_URL]
   --l2.node.url value             Node URL of L2 peer (default: "127.0.0.1:9545") [$WITHDRAWAL_MON_L2_NODE_URL]
   --optimismportal.address value  Address of the OptimismPortal contract [$WITHDRAWAL_MON_OPTIMISM_PORTAL]
```

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism withdrawals  --l1.node.url  http://host.docker.internal:8545 --l2.node.url http://host.docker.internal:80/rpc --optimismportal.address 0x31f2A70b5260fB61819A5239Fc7211D00aa84fF0 --start.block.height 0
```

## balances [OK]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism balances --help

OPTIONS:
   --node.url value                                             Node URL of a peer (default: "127.0.0.1:8545") [$BALANCE_MON_NODE_URL]
   --accounts address:nickname [ --accounts address:nickname ]  One or accounts formatted via address:nickname [$BALANCE_MON_ACCOUNTS]
```

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism balances  --node.url  http://host.docker.internal:80/rpc --accounts 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:mine

accounts is user param
```

## drippie [Missing Drippie Address]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism drippie --help

NAME:
   Monitorism drippie - Monitors Drippie contract

USAGE:
   Monitorism drippie [command options]

DESCRIPTION:
   Monitors Drippie contract

OPTIONS:
   --l1.node.url value         Node URL of L1 peer (default: "127.0.0.1:8545") [$DRIPPIE_MON_L1_NODE_URL]
   --drippie.address value     Address of the Drippie contract [$DRIPPIE_MON_DRIPPIE]
```

## secrets [Missing Drippie Address]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism secrets --help

OPTIONS:
   --l1.node.url value         Node URL of L1 peer (default: "127.0.0.1:8545") [$DRIPPIE_MON_L1_NODE_URL]
   --drippie.address value     Address of the Drippie contract [$DRIPPIE_MON_DRIPPIE]
```

## global_events

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-monitorism:latest /usr/local/bin/monitorism global_events --help

OPTIONS:
   --l1.node.url value         Node URL of L1 peer (default: "127.0.0.1:8545") [$DRIPPIE_MON_L1_NODE_URL]
```

## liveness_expiration [Missing Liveness Module]

Monitor the liveness expiration on Gnosis Safe.
faultproof_withdrawals

# Op-dispute-mon [OK]

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-dispute-mon:latest /usr/local/bin/op-dispute-mon h
```

```bash
docker run --rm -it us-docker.pkg.dev/oplabs-tools-artifacts/images/op-dispute-mon:latest /usr/local/bin/op-dispute-mon --game-factory-address 0x44f485e7E8C68CfcA44f3221C96A179A37405AB0 --l1-eth-rpc http://host.docker.internal:8545 --rollup-rpc http://host.docker.internal:80/rpc


# --game-window
```

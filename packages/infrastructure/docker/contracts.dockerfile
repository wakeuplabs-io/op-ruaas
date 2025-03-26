ARG BUILDPLATFORM=linux/amd64

FROM --platform=$BUILDPLATFORM debian:bookworm-slim

# install necessary dependencies
RUN apt-get update && apt-get install -y \
  curl \
  jq \
  git \
  make \
  bash \
  ca-certificates \
  zip 

RUN curl -L https://github.com/casey/just/releases/download/1.36.0/just-1.36.0-aarch64-unknown-linux-musl.tar.gz | tar xz -C /usr/local/bin

RUN curl -L https://foundry.paradigm.xyz | bash && /root/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:$PATH"
RUN foundryup --version nightly-143abd6a768eeb52a5785240b763d72a56987b4a

# Install Go
ENV GO_VERSION=1.22.6
RUN curl -L https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz | tar -C /usr/local -xz

# Add Go to the PATH
ENV PATH="/usr/local/go/bin:$PATH"


WORKDIR /app
COPY . .

# build contracts and go
RUN make submodules
RUN cd /app/packages/contracts-bedrock && just -v build
RUN cd /app && make op-node
RUN chmod +x /app/op-node/bin/op-node

RUN cd /app && make cannon-prestate

# shared volume paths
ENV IN_DEPLOY_CONFIG=/shared/in/deploy-config.json
ENV OUT_DEPLOY_CONFIG=/shared/out/deploy-config.json
ENV OUT_ADDRESSES=/shared/out/addresses.json
ENV OUT_ALLOCS=/shared/out/allocs-l2.json
ENV OUT_GENESIS=/shared/out/genesis.json
ENV OUT_ROLLUP_CONFIG=/shared/out/rollup-config.json
ENV OUT_JWT_SECRET=/shared/out/jwt-secret.txt

# DO NOT override. Required by contracts
ENV DEPLOYMENT_OUTFILE=/app/packages/contracts-bedrock/deployments/addresses.json
ENV DEPLOY_CONFIG_PATH=/app/packages/contracts-bedrock/deploy-config/deploy-config.json
ENV STATE_DUMP_PATH=/app/packages/contracts-bedrock/allocs-l2.json 
ENV CONTRACT_ADDRESSES_PATH=${DEPLOYMENT_OUTFILE}

# OVERRIDE
ENV ETH_RPC_URL="http://host.docker.internal:8545"
ENV IMPL_SALT="0x0000000000000000000000000000000000000000000000000000000000000000"
ENV DEPLOYER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ENV DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ENV GAS_MULTIPLIER="130"
ENV SLOW_ARG="--slow"
ENV DEPLOY_DETERMINISTIC_DEPLOYER="false"

CMD if [ "$DEPLOY_DETERMINISTIC_DEPLOYER" = "true" ]; then \
      echo "Deploying create2 deployer" && \
      cast send --from "$DEPLOYER_ADDRESS" --private-key "$DEPLOYER_PRIVATE_KEY" --rpc-url "$ETH_RPC_URL" --value "1ether" "0x3fAB184622Dc19b6109349B94811493BF2a45362" && \
      cast publish --rpc-url "$ETH_RPC_URL" "0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222"; \
    fi && \

    echo "Deploying L2 contracts to L1..." && \
    cp ${IN_DEPLOY_CONFIG} ${DEPLOY_CONFIG_PATH} && \
    l1GenesisBlockTimestamp=$(printf '0x%x' $(date +%s)) && jq --arg ts "$l1GenesisBlockTimestamp" '.l1GenesisBlockTimestamp = $ts' ${DEPLOY_CONFIG_PATH} > tmp.json && mv tmp.json ${DEPLOY_CONFIG_PATH} && \
    l1StartingBlockTag=$(cast block finalized --rpc-url "$ETH_RPC_URL" --json | jq -r ".hash") && jq --arg ts "$l1StartingBlockTag" '.l1StartingBlockTag = $ts' ${DEPLOY_CONFIG_PATH} > tmp.json && mv tmp.json ${DEPLOY_CONFIG_PATH} && \
    l2OutputOracleStartingTimestamp=$(cast block "$l1StartingBlockTag" --rpc-url "$ETH_RPC_URL" --json | jq -r ".timestamp" | xargs printf "%d\n") && jq --arg ts "$l2OutputOracleStartingTimestamp" '.l2OutputOracleStartingTimestamp = ($ts | tonumber)' ${DEPLOY_CONFIG_PATH} > tmp.json && mv tmp.json ${DEPLOY_CONFIG_PATH} && \
    echo "{}" > ${DEPLOYMENT_OUTFILE} && \
    cd /app/packages/contracts-bedrock && forge script scripts/deploy/Deploy.s.sol:Deploy --sig 'runWithStateDump()' --sender "${DEPLOYER_ADDRESS}" --private-key "${DEPLOYER_PRIVATE_KEY}" --gas-estimate-multiplier ${GAS_MULTIPLIER} --rpc-url "${ETH_RPC_URL}" --broadcast ${SLOW_ARG} --non-interactive && \
    cp ${DEPLOY_CONFIG_PATH} ${OUT_DEPLOY_CONFIG} && \
    cp ${DEPLOYMENT_OUTFILE} ${OUT_ADDRESSES} && \

    echo 'Generating L2 genesis allocs' && \
    cd /app/packages/contracts-bedrock && forge script scripts/L2Genesis.s.sol:L2Genesis --sig 'runWithAllUpgrades()' && mv ${STATE_DUMP_PATH} ${OUT_ALLOCS} && \
    
    echo 'Generating l2 genesis and rollup configs' && \
    /app/op-node/bin/op-node genesis l2 \
        --l1-rpc ${ETH_RPC_URL} \
        --deploy-config ${OUT_DEPLOY_CONFIG} \
        --l2-allocs ${OUT_ALLOCS} \
        --l1-deployments ${OUT_ADDRESSES} \
        --outfile.l2 ${OUT_GENESIS} \
        --outfile.rollup ${OUT_ROLLUP_CONFIG} && \
    jq 'del(.config.optimism)' ${OUT_GENESIS} > temp.json && mv temp.json ${OUT_GENESIS} && \
    jq 'del(.channel_timeout_granite)' ${OUT_ROLLUP_CONFIG} > temp.json && mv temp.json ${OUT_ROLLUP_CONFIG} && \
    
    echo "Generating jwt-secret.txt" && \
    openssl rand -hex 32 > ${OUT_JWT_SECRET} && \
    
    echo "Generating artifacts.zip" && \
    zip -j /shared/out/artifacts.zip ${OUT_ADDRESSES} ${OUT_ALLOCS} ${OUT_GENESIS} ${OUT_ROLLUP_CONFIG} ${OUT_DEPLOY_CONFIG} ${OUT_JWT_SECRET}

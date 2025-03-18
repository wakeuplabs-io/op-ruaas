/// <reference path="./.sst/platform/config.d.ts" />

import "dotenv/config";

const PROJECT_NAME = "opruaas-console";
const REGION = "us-east-1";

export default $config({
  app(input) {
    return {
      name: PROJECT_NAME,
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: REGION,
          defaultTags: {
            tags: {
              customer: "op-ruaas-console",
            },
          },
        },
      },
    };
  },
  async run() {
    // api bucket for deployment artifacts
    const bucket = new sst.aws.Bucket(`${PROJECT_NAME}-artifacts`);

    // vpc for api-db
    const vpc = new sst.aws.Vpc(`${PROJECT_NAME}-vpc`, {
      nat: "ec2", // sharing vpc with api
      bastion: true, // i'll let us connect to the VPC from our local machine to run migrations
    });

    // api db
    const db = new sst.aws.Aurora(`${PROJECT_NAME}-db`, {
      engine: "postgres",
      vpc: {
        subnets: vpc.privateSubnets,
        securityGroups: vpc.securityGroups,
      },
    });
    const DATABASE_URL = $interpolate`postgres://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;

    // api
    const api = new sst.aws.Function(`${PROJECT_NAME}-api`, {
      vpc,
      handler: "bootstrap",
      bundle: "target/lambda/opraas_server",
      architecture: "arm64", // or x86_64
      runtime: "provided.al2023",
      url: true,
      link: [db, bucket],
      timeout: "10 seconds",
      environment: {
        ENV: "prod",
        DATABASE_URL,
        ARTIFACTS_BUCKET: bucket.name,
      },
    });

    // create command to run migrations
    // - npx sst tunnel
    // - npx sst shell --target db sqlx migrate run
    new sst.x.DevCommand("db", {
      environment: { DATABASE_URL },
    });

    // static website
    const ui = new sst.aws.StaticSite(`${PROJECT_NAME}-ui`, {
      path: "ui",
      build: {
        command: "npm run build",
        output: "dist",
      },
      dev: {
        command: "npm run dev",
        directory: "ui",
      },
      environment: {
        VITE_SERVER_URL: api.url,
        VITE_APP_REGION: REGION,
        VITE_IS_TESTNET: "true",
        VITE_MARKETPLACE_ADDRESS: "0x338b71C2697b9584dcB7B3a21Da590e5494deecd",
        VITE_ERC20_TOKEN_ADDRESS: "0x071BCbC304B0E4eE088FFA46088a33A227c1410b",
        VITE_MARKETPLACE_CHAIN_ID: "11155420",
        VITE_PINATA_JWT: process.env.VITE_PINATA_JWT,
        VITE_GATEWAY_URL: process.env.VITE_GATEWAY_URL,
      },
      domain: `${PROJECT_NAME}.wakeuplabs.link`,
      indexPage: "index.html",
      errorPage: "index.html",
      invalidation: {
        paths: "all",
        wait: true,
      },
    });

    return {
      api: api.url,
      ui: ui.url,
    };
  },
});

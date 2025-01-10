/// <reference path="./.sst/platform/config.d.ts" />

const PROJECT_NAME = "opruaas";
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
              customer: "op-ruaas",
            },
          },
        },
      },
    };
  },
  async run() {
    // auth
    const userPool = new sst.aws.CognitoUserPool(`${PROJECT_NAME}-user-pool`, {
      usernames: ["email"],
    });
    const userPoolClient = userPool.addClient("Web");

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
        COGNITO_POOL_ID: userPool.id,
        COGNITO_CLIENT_IDS: userPoolClient.id,
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
      path: "packages/ui",
      build: {
        command: "npm run build",
        output: "dist",
      },
      dev: {
        command: "npm run dev",
        directory: "packages/ui",
      },
      environment: {
        VITE_SERVER_URL: api.url,
        VITE_APP_REGION: REGION,
        VITE_USER_POOL_ID: userPool.id,
        VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
      },
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

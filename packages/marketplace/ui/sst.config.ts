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
      ui: ui.url,
    };
  },
});

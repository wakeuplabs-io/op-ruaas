/// <reference path="./.sst/platform/config.d.ts" />

const PROJECT_NAME = "opruaas-marketplace";
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
        VITE_APP_REGION: REGION,
        VITE_IS_TESTNET: process.env.VITE_IS_TESTNET || "false",
        VITE_MARKETPLACE_ADDRESS: process.env.VITE_MARKETPLACE_ADDRESS || "",
        VITE_ERC20_TOKEN_ADDRESS: process.env.VITE_ERC20_TOKEN_ADDRESS || "",
        VITE_MARKETPLACE_CHAIN_ID: process.env.VITE_MARKETPLACE_CHAIN_ID || "1",
        VITE_PINATA_JWT: process.env.VITE_PINATA_JWT || "",
        VITE_GATEWAY_URL: process.env.VITE_GATEWAY_URL || "",
        VITE_PROVIDER_NAME: process.env.VITE_PROVIDER_NAME || "",
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

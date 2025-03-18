/// <reference path="./.sst/platform/config.d.ts" />

import "dotenv/config";

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
              customer: "op-ruaas-marketplace",
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
        VITE_IS_TESTNET: "true",
        VITE_MARKETPLACE_ADDRESS: "0xe99b68EF5459f78cAbb7a352E60CD2D80801B687",
        VITE_ERC20_TOKEN_ADDRESS: "0x89771d5B1020549F8EC2815eACE52Aa5a0C84dEa",
        VITE_MARKETPLACE_CHAIN_ID: "11155420",
        VITE_MARKETPLACE_SEQUENCER_OFFERS: "1",
        VITE_MARKETPLACE_REPLICA_OFFERS: "2",
        VITE_PROVIDER_NAME: "Provider Name",
        VITE_PINATA_JWT: process.env.VITE_PINATA_JWT || "",
        VITE_GATEWAY_URL: process.env.VITE_GATEWAY_URL || "",
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
      ui: ui.url,
    };
  },
});

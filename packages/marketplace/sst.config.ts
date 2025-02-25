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
      path: "packages/marketplace/ui",
      build: {
        command: "npm run build",
        output: "dist",
      },
      dev: {
        command: "npm run dev",
        directory: "packages/marketplace/ui",
      },
      environment: {
        VITE_APP_REGION: REGION,
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

/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "opraas-server",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const api = new sst.aws.Function("opraas-server", {
      handler: "bootstrap",
      architecture: "arm64", // or x86_64
      bundle: "target/lambda/api",
      runtime: 'provided.al2023',
      url: true,
    });
    const router = new sst.aws.Router("MyRouter", {
      routes: {
        "/*": api.url,
      },
      domain: "rust.dev.sst.dev",
    });
    return {
      function: api.url,
      domain: router.url
    }
  },
});

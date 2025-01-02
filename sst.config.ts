/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "opruaas",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            providers: {
                aws: {
                    region: "us-east-1",
                }
            }
        };
    },
    async run() {
        // auth
        const auth = new sst.aws.CognitoUserPool("MyUserPool", {
            usernames: ["email"]
        });
        const authClient = auth.addClient("Web")

        // api bucket for deployment artifacts
        const bucket = new sst.aws.Bucket("RuaasBucket");

        // vpc for api-db
        const vpc = new sst.aws.Vpc("RuaasVpc", { bastion: true });

        // api db
        const rds = new sst.aws.Postgres("RuaasPostgres", { vpc });
        const DATABASE_URL = $interpolate`postgres://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`;

        // api
        const api = new sst.aws.Function("RuaasConsoleApi", {
            handler: "bootstrap",
            bundle: "packages/posts-api/target/lambda/posts-api",
            architecture: "arm64", // or x86_64
            runtime: 'provided.al2023',
            url: true,
            link: [rds, bucket],
            timeout: "10 seconds",
            environment: {
                DATABASE_URL,
                BUCKET: bucket.name,
            }
        });

        // create command to run migrations
        // - npx sst tunnel
        // - npx sst shell --target db sqlx migrate run
        new sst.x.DevCommand("db", {
            environment: { DATABASE_URL },
        });

        // static website
        const ui = new sst.aws.StaticSite("RuaasConsoleWeb", {
            path: "packages/ui",
            build: {
                command: "npm run build",
                output: "dist",
            },
            environment: {
                VITE_API_URL: api.url,
                VITE_APP_REGION: aws.getRegionOutput().name,
                VITE_COGNITO_USER_POOL_ID: auth.id,
                VITE_COGNITO_CLIENT_ID: authClient.id,
            },
        });

        return {
            api: api.url,
            ui: ui.url
        };
    },
});

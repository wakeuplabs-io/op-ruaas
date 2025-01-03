/// <reference path="./.sst/platform/config.d.ts" />

const REGION = "us-east-1";

export default $config({
    app(input) {
        return {
            name: "opruaas",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            providers: {
                aws: {
                    region: REGION,
                }
            }
        };
    },
    async run() {
        // auth
        const userPool = new sst.aws.CognitoUserPool("RuaasUserPool", {
            usernames: ["email"]
        });
        const userPoolClient = userPool.addClient("Web");

        // api bucket for deployment artifacts
        const bucket = new sst.aws.Bucket("RuaasBucket");

        // vpc for api-db
        const vpc = new sst.aws.Vpc("RuaasVpc", { bastion: true, nat: "ec2" });

        // api db
        const rds = new sst.aws.Postgres("RuaasPostgres", { vpc });
        const DATABASE_URL = $interpolate`postgres://${rds.username}:${rds.password}@${rds.host}:${rds.port}/${rds.database}`;

        // api
        const api = new sst.aws.Function("RuaasConsoleApi", {
            vpc,
            handler: "bootstrap",
            bundle: "packages/server/target/lambda/server",
            architecture: "arm64", // or x86_64
            runtime: 'provided.al2023',
            url: true,
            link: [rds, bucket],
            timeout: "10 seconds",
            environment: {
                DATABASE_URL,
                ARTIFACTS_BUCKET: bucket.name,
                COGNITO_USER_POOL_ID: userPool.id,
                COGNITO_USER_POOL_CLIENT_ID: userPoolClient.id
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
                VITE_APP_REGION: REGION,
                VITE_USER_POOL_ID: userPool.id,
                VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
            },
        });

        return {
            api: api.url,
            ui: ui.url
        };
    },
});

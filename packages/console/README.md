# OP RaaS Console

The OP RaaS Console is a web application that provides a user interface for setting up and storing your Optimism Rollup-as-a-Service deployments. It also connects to the marketplace to

## Getting Started

### Prerequisites

- Cargo 1.8.0 or later
- Node.js 16.x or later
- Yarn package manager

### Run and Deploy

To make use of the console each user will need to deploy its own, or run it locally.

To run it you will need to:

- Fill environment variables for `server` and `ui`.
- Install dependencies with `npm install`
- Run server `just console-server-run`
- Run ui `just console-ui-run`

If you want to deploy it that's easy as well! Having sst configured with aws you just need to go to console root, check `sst.config.ts`, adjust any variables and run `just console-deploy`

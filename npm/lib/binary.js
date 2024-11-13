const { Binary } = require("binary-install");
const os = require("os");
const { join } = require("path");
const cTable = require("console.table");

const error = msg => {
    console.error(msg);
    process.exit(1);
};

const { version, name, repository } = require("../package.json");

const supportedPlatforms = [
    {
        TYPE: "Windows",
        ARCHITECTURE: "x64",
        RUST_TARGET: "x86_64-pc-windows-gnu",
        BINARY_NAME: "opraas_cli.exe"
    },
    {
        TYPE: "Linux",
        ARCHITECTURE: "x64",
        RUST_TARGET: "x86_64-unknown-linux-gnu",
        BINARY_NAME: "opraas_cli"
    },
    {
        TYPE: "Apple",
        ARCHITECTURE: "x64",
        RUST_TARGET: "x86_64-apple-darwin",
        BINARY_NAME: "opraas_cli"
    },
];

const getPlatformMetadata = () => {
    const type = os.type();
    const architecture = os.arch();

    for (let supportedPlatform of supportedPlatforms) {
        if (
            type === supportedPlatform.TYPE &&
            architecture === supportedPlatform.ARCHITECTURE
        ) {
            return supportedPlatform;
        }
    }

    error(
        `Platform with type "${type}" and architecture "${architecture}" is not supported by ${name}.\nYour system must be one of the following:\n\n${cTable.getTable(
            supportedPlatforms
        )}`
    );
};

const getBinary = () => {
    const platformMetadata = getPlatformMetadata();
    // the url for this binary is constructed from values in `package.json`
    // https://github.com/wakeuplabs-io/opraas/releases/download/v1.0.0/opraas-v1.0.0-x86_64-apple-darwin.tar.gz
    const url = `${repository.url}/releases/download/v${version}/${name}-v${version}-${platformMetadata.RUST_TARGET}.${platformMetadata.BINARY_NAME.includes("exe") ? "zip" : "tar.gz"}`;
    return new Binary(platformMetadata.BINARY_NAME, url, version, {
        installDirectory: join(__dirname, "..", "bin"),
    });
};

const run = () => {
    const binary = getBinary();
    binary.run();
};

const install = () => {
    const binary = getBinary();
    binary.install();
};

module.exports = {
    install,
    run
};
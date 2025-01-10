
VERSION := "0.1.4"
APPLE_TARGET := "x86_64-apple-darwin"
WINDOWS_TARGET := "x86_64-pc-windows-gnu"
LINUX_TARGET := "x86_64-unknown-linux-musl"

# linting

lint:
	cargo clippy --fix

# formatting 

format:
	cargo fmt --all

format-md:
	npx prettier --write "**/*.md"

# cli

cli-build-windows: clean-windows
	cargo zigbuild --target={{WINDOWS_TARGET}} --release
	(cd target/{{WINDOWS_TARGET}}/release && \
	mkdir opruaas-v{{VERSION}}-{{WINDOWS_TARGET}} && \
	mv opruaas.exe opruaas-v{{VERSION}}-{{WINDOWS_TARGET}} && \
	zip -r opruaas-v{{VERSION}}-{{WINDOWS_TARGET}}.zip opruaas-v{{VERSION}}-{{WINDOWS_TARGET}})

cli-build-linux: clean-linux
	cargo zigbuild --target={{LINUX_TARGET}} --release
	(cd target/{{LINUX_TARGET}}/release && \
	mkdir opruaas-v{{VERSION}}-{{LINUX_TARGET}} && \
	mv opruaas opruaas-v{{VERSION}}-{{LINUX_TARGET}} && \
	tar -czf opruaas-v{{VERSION}}-{{LINUX_TARGET}}.tar.gz opruaas-v{{VERSION}}-{{LINUX_TARGET}})

cli-build-apple: clean-apple
	cargo zigbuild --target={{APPLE_TARGET}} --release
	(cd target/{{APPLE_TARGET}}/release && \
	mkdir opruaas-v{{VERSION}}-{{APPLE_TARGET}} && \
	cp opruaas opruaas-v{{VERSION}}-{{APPLE_TARGET}} && \
	tar -czf opruaas-v{{VERSION}}-{{APPLE_TARGET}}.tar.gz opruaas-v{{VERSION}}-{{APPLE_TARGET}})

# console

console-server-run:
	ENV=dev && cargo run --package opraas_server 

console-ui-run:
	cd packages/ui && npm run dev

console-predeploy:
    cargo lambda build --package opraas_server --arm64 --release

console-deploy-staging: console-predeploy
	npx sst deploy --stage staging

console-migrate:
	echo "Ensure tunnel is installed 'sudo npx sst tunnel install --stage staging' and running 'npx sst tunnel --stage staging'"
	npx sst shell --target db --stage staging sqlx migrate run

# utils

clean-apple:
	rm -rf target/{{APPLE_TARGET}}/release/opruaas-v{{VERSION}}-{{APPLE_TARGET}}

clean-linux:
	rm -rf target/{{LINUX_TARGET}}/release/opruaas-v{{VERSION}}-{{LINUX_TARGET}}

clean-windows:
	rm -rf target/{{WINDOWS_TARGET}}/release/opruaas-v{{VERSION}}-{{WINDOWS_TARGET}}



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

cli-build-windows:
	cargo zigbuild --target=${WINDOWS_TARGET} --release
	(cd target/${WINDOW_TARGET}/release && \
	mkdir opruaas-v${VERSION}-${WINDOW_TARGET} && \
	mv opruaas.exe opruaas-v${VERSION}-${WINDOW_TARGET} && \
	zip -r opruaas-v${VERSION}-${WINDOW_TARGET}.zip opruaas-v${VERSION}-${WINDOW_TARGET})

cli-build-linux:
	cargo zigbuild --target=${LINUX_TARGET} --release
	(cd target/${LINUX_TARGET}/release && \
	mkdir opruaas-v${VERSION}-${LINUX_TARGET} && \
	mv opruaas opruaas-v${VERSION}-${LINUX_TARGET} && \
	tar -czf opruaas-v${VERSION}-${LINUX_TARGET}.tar.gz opruaas-v${VERSION}-${LINUX_TARGET})

cli-build-apple:
	cargo zigbuild --target=${APPLE_TARGET} --release
	(cd target/${APPLE_TARGET}/release && \
	mkdir opruaas-v${VERSION}-${APPLE_TARGET} && \
	cp opruaas opruaas-v${VERSION}-${APPLE_TARGET} && \
	tar -czf opruaas-v${VERSION}-${APPLE_TARGET}.tar.gz opruaas-v${VERSION}-${APPLE_TARGET})

# server

server-run:
	ENV=dev && cargo run --package opraas_server

server-predeploy:
    cargo lambda build --package opraas_server --arm64 --release

# sst deployment and management

install-tunnel:
	sudo npx sst tunnel install

tunnel: install-tunnel
	npx sst tunnel
	
deploy: server-predeploy
	npx sst deploy

# utils

clean:
	rm -rf target/${WINDOWS_TARGET}/release/opruaas-v${VERSION}-${WINDOWS_TARGET}
	rm -rf target/${LINUX_TARGET}/release/opruaas-v${VERSION}-${LINUX_TARGET}
	rm -rf target/${APPLE_TARGET}/release/opruaas-v${VERSION}-${APPLE_TARGET}


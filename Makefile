

ifeq (run,$(firstword $(MAKECMDGOALS)))
  # use the rest as arguments for "run"
  RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # ...and turn them into do-nothing targets
  $(eval $(RUN_ARGS):;@:)
endif

VERSION=0.1.4
APPLE_TARGET=x86_64-apple-darwin
WINDOWS_TARGET=x86_64-pc-windows-gnu
LINUX_TARGET=x86_64-unknown-linux-musl

format:
	cargo fmt --all

format-md:
	npx prettier --write "**/*.md"

lint:
	cargo clippy --fix

build-windows:
	cargo zigbuild --target=${WINDOWS_TARGET} --release

build-linux:
	cargo zigbuild --target=${LINUX_TARGET} --release

build-apple:
	cargo zigbuild --target=${APPLE_TARGET} --release

zip-windows:
	(cd target/${WINDOWS_TARGET}/release && mkdir opruaas-v${VERSION}-${WINDOWS_TARGET} && cp opruaas.exe opruaas-v${VERSION}-${WINDOWS_TARGET} && zip -r opruaas-v${VERSION}-${WINDOWS_TARGET}.zip opruaas-v${VERSION}-${WINDOWS_TARGET})

zip-apple:
	(cd target/${APPLE_TARGET}/release && mkdir opruaas-v${VERSION}-${APPLE_TARGET} && cp opruaas opruaas-v${VERSION}-${APPLE_TARGET} && tar -czf opruaas-v${VERSION}-${APPLE_TARGET}.tar.gz opruaas-v${VERSION}-${APPLE_TARGET})

zip-linux:
	(cd target/${LINUX_TARGET}/release && mkdir opruaas-v${VERSION}-${LINUX_TARGET} && cp opruaas opruaas-v${VERSION}-${LINUX_TARGET} && tar -czf opruaas-v${VERSION}-${LINUX_TARGET}.tar.gz opruaas-v${VERSION}-${LINUX_TARGET})

clean:
	rm -rf target/${WINDOWS_TARGET}/release/opruaas-v${VERSION}-${WINDOWS_TARGET}
	rm -rf target/${LINUX_TARGET}/release/opruaas-v${VERSION}-${LINUX_TARGET}
	rm -rf target/${APPLE_TARGET}/release/opruaas-v${VERSION}-${APPLE_TARGET}

server-deploy:
	cargo lambda build --package opraas_server --release
	cargo lambda deploy opraas_server --tag customer=op-ruaas --enable-function-url

server-watch:
	cargo lambda watch --package opraas_server
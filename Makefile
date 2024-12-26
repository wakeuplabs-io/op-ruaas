

ifeq (run,$(firstword $(MAKECMDGOALS)))
  # use the rest as arguments for "run"
  RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # ...and turn them into do-nothing targets
  $(eval $(RUN_ARGS):;@:)
endif

VERSION=0.1.3
APPLE_TARGET=x86_64-apple-darwin
WINDOW_TARGET=x86_64-pc-windows-gnu
LINUX_TARGET=x86_64-unknown-linux-musl

format:
	cargo fmt --all

format-md:
	npx prettier --write "**/*.md"

lint:
	cargo clippy --fix

build-windows:
	cargo zigbuild --target=${WINDOW_TARGET} --release

zip-windows:
	(cd target/${WINDOW_TARGET}/release && mkdir opruaas-v${VERSION}-${WINDOW_TARGET} && mv opruaas.exe opruaas-v${VERSION}-${WINDOW_TARGET} && zip -r opruaas-v${VERSION}-${WINDOW_TARGET}.zip opruaas-v${VERSION}-${WINDOW_TARGET})

build-linux:
	cargo zigbuild --target=${LINUX_TARGET} --release

zip-linux:
	(cd target/${LINUX_TARGET}/release && mkdir opruaas-v${VERSION}-${LINUX_TARGET} && mv opruaas opruaas-v${VERSION}-${LINUX_TARGET} && tar -czf opruaas-v${VERSION}-${LINUX_TARGET}.tar.gz opruaas-v${VERSION}-${LINUX_TARGET})

build-apple:
	cargo zigbuild --target=${APPLE_TARGET} --release

zip-apple:
	(cd target/${APPLE_TARGET}/release && mkdir opruaas-v${VERSION}-${APPLE_TARGET} && mv opruaas opruaas-v${VERSION}-${APPLE_TARGET} && tar -czf opruaas-v${VERSION}-${APPLE_TARGET}.tar.gz opruaas-v${VERSION}-${APPLE_TARGET})

server-deploy:
	cargo lambda build --package opraas_server --release
	cargo lambda deploy opraas_server --tag customer=op-ruaas --enable-function-url

server-watch:
	cargo lambda watch --package opraas_server


ifeq (run,$(firstword $(MAKECMDGOALS)))
  # use the rest as arguments for "run"
  RUN_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # ...and turn them into do-nothing targets
  $(eval $(RUN_ARGS):;@:)
endif

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

build-linux:
	cargo zigbuild --target=${LINUX_TARGET} --release

build-apple:
	cargo zigbuild --target=${APPLE_TARGET} --release

server-deploy:
	cargo lambda build --package opraas_server --release
	cargo lambda deploy opraas_server --tag customer=op-ruaas --enable-function-url

server-watch:
	cargo lambda watch --package opraas_server
ARG TARGET_BASE_IMAGE=alpine:3.20
ARG BUILDPLATFORM=arm64

FROM --platform=$BUILDPLATFORM golang:1.22.7-alpine3.20 AS builder

RUN apk add --no-cache make gcc musl-dev linux-headers git jq bash

# We copy the go.mod/sum first, so the `go mod download` does not have to re-run if dependencies do not change.
COPY ./go.mod /app/go.mod
COPY ./go.sum /app/go.sum

WORKDIR /app

# warm-up the cache
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build go mod download

COPY . /app

FROM --platform=$BUILDPLATFORM builder AS op-node-builder
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build cd op-node && make op-node  

FROM --platform=$TARGETPLATFORM $TARGET_BASE_IMAGE AS op-node-target
COPY --from=op-node-builder /app/op-node/bin/op-node /usr/local/bin/
CMD ["op-node"]

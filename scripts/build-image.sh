#!/usr/bin/env bash

set -euo pipefail

PREFER_PODMAN="${PREFER_PODMAN:-1}"
PUSH="${PUSH:-0}"
TAG="${TAG:-dev}"
REGISTRY_ORG="${REGISTRY_ORG:-jezhu}"

if [[ -x "$(command -v podman)" && $PREFER_PODMAN == 1 ]]; then
    OCI_BIN="podman"
else
    OCI_BIN="docker"
fi

BASE_IMAGE="quay.io/${REGISTRY_ORG}/distributed-tracing-console-plugin"
IMAGE=${BASE_IMAGE}:${TAG}

echo "Building image '${IMAGE}' with ${OCI_BIN}"
$OCI_BIN build -t $IMAGE .

if [[ $PUSH == 1 ]]; then
    echo "Pushing to registry with ${OCI_BIN}"
    $OCI_BIN push $IMAGE
fi

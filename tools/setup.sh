#!/bin/bash
set -euo pipefail

OS=`uname | tr '[:upper:]' '[:lower:]'`
case "${OS}" in
    darwin)
        SDK_PKG="wasi-sdk-8.0-macos.tar.gz"
        WASMER_PKG="wasmer-darwin-amd64.tar.gz"
        ;;
    linux)
        SDK_PKG="wasi-sdk-8.0-linux.tar.gz"
        WASMER_PKG="wasmer-linux-amd64.tar.gz"
        ;;
    *)
        echo "ERROR: Unsupported platform $OS"
        exit 1
        ;;
esac
SDK_URL="https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-8/${SDK_PKG}"
WASMER_URL="https://github.com/wasmerio/wasmer/releases/download/0.16.2/${WASMER_PKG}"

#
# WASI SDK
#
SDK_DIR="./tools/wasi-sdk-8.0"
if [ -x "${SDK_DIR}/bin/clang-9" ]; then
    echo "WASI SDK already installled at ${SDK_DIR}"
else
    set -x
    curl "${SDK_URL}" -sSfL | gzcat | tar -C "./tools" -xf -
    set +x
fi

#
# Wasmer
#
WASM_DIR="./tools/wasmer"
if [ -x "${WASM_DIR}/bin/wasmer" ]; then
    echo "Wasmer already installled at ${WASM_DIR}"
else
    set -x
    mkdir -p "${WASM_DIR}"
    curl "${WASMER_URL}" -sSfL | gzcat | tar -C "${WASM_DIR}" -xf -
    mkdir -p "${WASM_DIR}/cache"
    set +x
fi

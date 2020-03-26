// This uses arraybuffer-loader to load the binary as a Uint8Array
import wasmBinary from '../../build/lib.wasm'

export function Core() {
    return wasmBinary
}

import { WasmMemory, Allocator } from './Allocator'
import { DemoModule } from './DemoModule'

function loadWasmExports(exports) {
    // These must all be defined as `export` symbols in wasm_api.c
    return {
        // System
        memory: exports['memory'],
        malloc: exports['wasm_malloc'],
        free: exports['wasm_free'],

        // Demo Library
        add: exports['add'],
        string_double: exports['string_double'],
        rot13: exports['rot13']
    }
}

// Use this to switch out the callback functions at any time
class CallbackHandler {
    addFunctionHandler(result) {}
}

// Indirect link to callback table in the wasm module
// These are permenantly bound during instantiate and cannot be changed
// So we bind these as functions that simply chain to the CallbackHandler
// we can then swap out the functions on the CallbackHandler on the fly
class DemoHandlers {
    constructor(
    ) {
        this.callbackHandler = new CallbackHandler()

        // These must all be defined as `extern` symbols in wasm_api.c
        this.callbacks = {
            'js_wasm_add_callback': this.addCallback.bind(this)
        }

        // We need to pass this object to WebAssembly.instantiate in order to bind
        // our function pointers to the imports in the wasm module
        this.importObject = {
            'env': this.callbacks
        }
    }

    addCallback(result) {
        this.callbackHandler.addFunctionHandler(result)
    }
}

export async function loadDemoModule(wasmBinary, config) {
    let handlers = new DemoHandlers()
    return WebAssembly.instantiate(wasmBinary, handlers.importObject).then((program) => {
        let wasmApi = loadWasmExports(program.instance.exports)
        let memoryProvider = () => {
            // Provide dynamically as this object may change on the fly
            return wasmApi.memory
        }
        let memory = new WasmMemory(wasmApi.malloc, wasmApi.free, memoryProvider)
        let allocator = new Allocator(memory)
        return new DemoModule(config, program, handlers, wasmApi, allocator)
    })
}

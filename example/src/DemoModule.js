
// This class contains the public Javascript API methods we want to expose
export class DemoModule {
    constructor(
        config,
        program,
        handlers,
        wasmApi,
        allocator
    ) {
        this.config = config
        this.program = program
        this.handlers = handlers
        this.wasmApi = wasmApi
        this.allocator = allocator
    }

    add(a, b) {
        let handler = this.handlers.callbackHandler
        handler.addFunctionHandler = (result) => {
            console.log('Add callback invoked with result: ', result)
        }
        let result = this.wasmApi.add(a, b)
        if (this.config.debug) {
            console.log('Add: ', a, b, ' => ', result)
        }
        return result
    }

    string_double(str) {
        // Allocate a buffer containing our input string as a null terminated C string
        let inputBuf = this.allocator.fromStringAsCString(str)

        // Call the function that returns a newly malloc'd string
        let resultPtr = this.wasmApi.string_double(inputBuf.rawPointer)

        // Copy the result back out from the returned newly malloc'd C string
        let outputBuf = this.allocator.ownedReferenceFromCString(resultPtr)
        let result = outputBuf.toString()

        // Don't forget to free everything
        inputBuf.free()
        outputBuf.free()

        if (this.config.debug) {
            console.log('String double: ', str, ' => ', result)
        }
        return result
    }

    rot13(str) {
        // Allocate a buffer containing our input string (not null terminated)
        let inputBuf = this.allocator.fromString(str)

        // Allocate a destination buffer space
        let resultBuf = this.allocator.allocate(str.length)

        this.wasmApi.rot13(resultBuf.rawPointer, inputBuf.rawPointer, resultBuf.length)

        // Copy the result back out from the destination buffer
        let result = resultBuf.toString()

        // Don't forget to free everything
        inputBuf.free()
        resultBuf.free()

        if (this.config.debug) {
            console.log('Rot13: ', str, ' => ', result)
        }
        return result
    }
}

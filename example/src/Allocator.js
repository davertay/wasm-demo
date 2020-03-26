
// Manage the raw WASM linear memory object and it's malloc/free routines
export class WasmMemory {
    constructor(
        wasmMalloc,
        wasmFree,
        wasmMemoryProvider
    ) {
        this.wasmMalloc = wasmMalloc
        this.wasmFree = wasmFree
        this.wasmMemoryProvider = wasmMemoryProvider
        this.refreshMemoryReference()
    }

    // Update this.wasmMemoryBuffer reference using the WASM memory array export
    // The memory ArrayBuffer object can change so need to get it from the exports each time
    // Note that this represents the *entire* memory including data and stack. The
    // heap area begins above the stack (stack grows down, heap grows up) at address __heap_base
    refreshMemoryReference() {
        let rawWasmMemory = this.wasmMemoryProvider()
        this.linearMemory = new Uint8Array(rawWasmMemory.buffer)
    }

    // When malloc is called it may cause a page fault which can invalidate the
    // WASM exports.memory ArrayBuffer. To handle this we just refresh it every
    // time malloc() is called. Probably could be a lot more efficient...
    malloc(len) {
        let result = this.wasmMalloc(len)
        this.refreshMemoryReference()
        return result
    }

    free(pointer) {
        this.wasmFree(pointer)
    }
}

// A buffer that has it's storage allocated from the Wasm memory space
// Use the Allocator to obtain these
// Be sure to call it's `free` method when you are done
export class WasmBuffer {
    constructor(
        byteArray,
        rawPointer,
        free
    ) {
        this.byteArray = byteArray
        this.rawPointer = rawPointer
        this.free = free
        this.length = byteArray.length
    }

    toString() {
        let utf8decoder = new TextDecoder('utf-8')
        return utf8decoder.decode(this.byteArray)
    }
}

// The Allocator manages the creation and destruction of WasmBuffer objects
// that use the Wasm memory space
export class Allocator {
    constructor(
        memory
    ) {
        this.memory = memory
    }

    // Create a WasmBuffer that references a previously allocated piece of WASM memory
    // Call it's `free` method to deallocate
    ownedReference(pointer, len) {
        let buf = this.memory.linearMemory.subarray(pointer, pointer + len)
        let free = () => {
            this.memory.free(pointer)
        }
        return new WasmBuffer(buf, pointer, free)
    }

    // Magic up an unowned reference to some region of WASM memory
    unownedReference(pointer, len) {
        let buf = this.ownedReference(pointer, len)
        buf.free = () => {
            // Nothing - we do not own this pointer
        }
        return buf
    }

    // Allocate a WasmBuffer in WASM memory
    // Call it's `free` method to deallocate
    allocate(len) {
        let ptr = this.memory.malloc(len)
        return this.ownedReference(ptr, len)
    }

    // Allocates and returns a WasmBuffer in WASM memory containing the array contents
    // Call it's `free` method to deallocate
    fromByteArray(byteArray) {
        let buf = this.allocate(byteArray.length)
        buf.byteArray.set(byteArray)
        return buf
    }

    // Allocates and returns a WasmBuffer in WASM memory containing the array contents 
    // as a C compatible null terminated array of chars
    // Call it's `free` method to deallocate
    fromByteArrayAsCString(byteArray) {
        let len = byteArray.length + 1
        let buf = this.allocate(len)
        buf.byteArray.set(byteArray)
        buf.byteArray[len - 1] = 0
        return buf
    }

    // Allocates and returns a WasmBuffer in WASM memory containing the string contents 
    // Call it's `free` method to deallocate
    fromString(str) {
        let utf8encoder = new TextEncoder(/* 'utf-8' */)
        let chars = utf8encoder.encode(str)
        return this.fromByteArray(chars)
    }

    // Allocates and returns a WasmBuffer in WASM memory containing the string contents 
    // as a C compatible null terminated array of chars
    // Call it's `free` method to deallocate
    fromStringAsCString(str) {
        let utf8encoder = new TextEncoder(/* 'utf-8' */)
        let chars = utf8encoder.encode(str)
        return this.fromByteArrayAsCString(chars)
    }

    // Takes the memory address of a null terminated C string pointer and returns it's length
    // Returns -1 if the null terminator was not found (and we searched the entire memory space!)
    strlen(pointer) {
        // Walk memory from the pointer address to find the end of the string
        let isNullByte = (element, index, array) => {
            return element == 0
        }
        return this.memory.linearMemory.slice(pointer).findIndex(isNullByte)
    }

    // Treats the address as a null terminated C string pointer to a previously allocated piece of WASM memory
    // Call it's `free` method to deallocate
    ownedReferenceFromCString(pointer) {
        let endIndex = this.strlen(pointer)
        if (endIndex >= 0) {
            return this.ownedReference(pointer, endIndex)
        } else {
            throw new Error('String null terminator not found')
        }
    }

    // Treats the address as a null terminated C string pointer whose memory we do not own
    unownedReferenceFromCString(pointer) {
        let endIndex = this.strlen(pointer)
        if (endIndex >= 0) {
            return this.unownedReference(pointer, endIndex)
        } else {
            throw new Error('String null terminator not found')
        }
    }
}

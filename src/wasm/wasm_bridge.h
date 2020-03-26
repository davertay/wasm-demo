#ifndef WASM_BRIDGE_H
#define WASM_BRIDGE_H

// For emscriptem use this for export and include -Wl,--export-dynamic linker flag
// This exports any "non-hidden" symbols so it works by changing their visibility
// #define export __attribute__((visibility("default")))

// For latest llvm can use this instead:
#define export __attribute__((used))

// Types available when bridging to JS land
// We assume the sizes match here it would be bad if not
typedef int i32;
typedef long i64;
typedef float f32;
typedef double f64;

#endif /* WASM_BRIDGE_H */

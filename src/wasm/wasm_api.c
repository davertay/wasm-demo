/**
 * Wasm/JS API
 * 
 * The only types available are i32, i64, f32 and f64.
 * In this file we wrap the regular API with a new API using only those types.
 * 
 * To make functions visible to JS they need to be marked with the `export` macro.
 * 
 * To call JS functions they need to be marked `extern` and added to the .syms file.
 */

#include <stdio.h>
#include <stdlib.h>
#include "wasm_bridge.h"
#include "demo.h"


// Functions imported from javascript
// - must be in wasm.syms
// - ensure function signatures match manually, not compiler enforced
// - Note use 'extern' not 'export'

#ifdef DISABLE_JS_CALLBACKS
// Stub out the callbacks when testing outside browser environment
static i32 js_wasm_add_callback(i32 result) { return 0; }
#else
extern i32 js_wasm_add_callback(i32 result);
#endif


// Functions exported to javascript
// - can only use wasm types
// - Note use 'export' not 'extern'

export i32 wasm_malloc(i32 len)
{
   return (i32)(malloc((size_t)len));
}

export void wasm_free(i32 address) {
    free((void *)address);
}

// Add two ints
// The type conversions are no-ops in this case but demonstrate the technique
export i32 add(i32 a, i32 b)
{
    i32 result = (i32)demo_add((int)a, (int)b);
    js_wasm_add_callback(result);
    return result;
}

// Double a string
// The "strings" are passed as integers representing memory locations
// The javscript will need to interpret the result as a null terminated byte array
// and will also need to free the result when done
export i32 string_double(i32 str)
{
    i32 result = (i32)demo_string_double((const char *)str);
    return result;
}

// Rot13 a string
// Translate as rot13 from src to dst
// Assumes both src and dst are len bytes in size
export void rot13(i32 dst, i32 src, i32 len)
{
    demo_rot13((char *)dst, (const char *)src, (size_t)len);
}

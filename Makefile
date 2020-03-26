# Disable built-in rules and re-define suffixes to speed up processing
MAKEFLAGS += --no-builtin-rules

.SUFFIXES:
.SUFFIXES:.c .o .a .wasm

.PHONY: all clean lib app test example

vpath %.c src
vpath %.h src

# WASI SDK  Setup
WASI_SDK = ./tools/wasi-sdk-8.0
WASI_SYSROOT = $(WASI_SDK)/share/wasi-sysroot
WASI_INCLUDE = $(WASI_SYSROOT)/include
WASI_LIB_DIR = $(WASI_SYSROOT)/lib/wasm32-wasi
CLANG = $(WASI_SDK)/bin/clang
WASMLD = $(WASI_SDK)/bin/wasm-ld

WASM_BARE_TARGET = wasm32
WASM_WASI_TARGET = wasm32-unknown-wasi
WASM_TARGET = $(WASM_WASI_TARGET)

WASMER_ROOT = ./tools/wasmer
WASMER = $(WASMER_ROOT)/bin/wasmer

# Project Setup

outdir = build
wasm_lib_out = $(outdir)/lib
wasm_app_out = $(outdir)/app

lib_headers = $(patsubst src/lib/%.h,lib/%.h,$(wildcard src/lib/*.h))
lib_sources = $(patsubst src/lib/%.c,lib/%.c,$(wildcard src/lib/*.c))

wasm_headers = $(patsubst src/wasm/%.h,wasm/%.h,$(wildcard src/wasm/*.h))
wasm_sources = $(patsubst src/wasm/%.c,wasm/%.c,$(wildcard src/wasm/*.c))

main_headers = $(patsubst src/main/%.h,main/%.h,$(wildcard src/main/*.h))
main_sources = $(patsubst src/main/%.c,main/%.c,$(wildcard src/main/*.c))

headers = $(lib_headers) $(wasm_headers) $(main_headers)

wasm_lib_objs = $(patsubst %.c,$(wasm_lib_out)/%.o,$(lib_sources)) \
				$(patsubst %.c,$(wasm_lib_out)/%.o,$(wasm_sources))

wasm_app_objs = $(patsubst %.c,$(wasm_app_out)/%.o,$(lib_sources)) \
				$(patsubst %.c,$(wasm_app_out)/%.o,$(wasm_sources)) \
				$(patsubst %.c,$(wasm_app_out)/%.o,$(main_sources))

wasm_lib = $(outdir)/lib.wasm
wasm_app = $(outdir)/main.wasm

# The symbols file defines JS functions that we want to call
# This lets the linker know that these are expected to be undefined
wasm_syms = src/wasm/wasm.syms

# wasm target stack size: 8KiB
ssize := $(shell bash -c 'echo $$[ 8 * 1024 ]')

# Flags for wasm target compilation
# --target=$(WASM_TARGET): not needed if using wasi packaged clang binary
# -nostdlib: remove stdlib entirely
# -flto: adds metadata for link-time optimizations
wasm_cc_flags = \
	-O3 \
	-flto \
	-Isrc/lib \
	-Isrc/wasm \
	-D__WASM__=1 \
	--sysroot $(WASI_SYSROOT)

# Flags for wasm target linkage
# --no-entry: no "main" or "start"
# --lto-O3: aggressive link-time optimizations
# --export=__heap_base: need this to access the heap memory
# -z stack-size: specify the stack space
# --allow-undefined-file: ignore missing symbols that we define in the JS layer
wasm_ld_flags = \
	--lto-O3 \
	--export=__heap_base \
	-z stack-size=$(ssize) \
	--allow-undefined-file=$(wasm_syms)

# If instead of exporting __head_base we want to import the memory space from the JS layer:
# --import-memory --initial-memory=4194304
# size is ssize + data + whatever heap we want, rounded up to 64KiB (64k is the page size)

# The same flags formatted for pass through from clang to wasm-ld indirectly
wasm_clang_ld_flags = $(wasm_ld_flags:%=-Wl\,%)

# Include this to pull in wasi libc explicitly
wasi_libc = -L$(WASI_LIB_DIR) -lc

# Include this to pull in the C runtime startup explicitly
wasi_c_runtime = $(WASI_LIB_DIR)/crt1.o

all:
	@echo "make [clean | lib | app | run | test | example]"

clean:
	rm -rf $(outdir)

test:
	$(MAKE) -C test all

example:
	cd example && npm run start-example

lib: $(CLANG) $(wasm_lib)

app: $(CLANG) $(wasm_app)

run: $(WASMER) app
	WASMER_DIR=$(WASMER_ROOT) WASMER_CACHE_DIR=$(WASMER_ROOT)/cache \
	$(WASMER) run $(wasm_app)

$(CLANG) $(WASMER):
	$(error Install tools locally by running ./tools/setup.sh)

# Compile C files for wasm library target
$(wasm_lib_out)/%.o: %.c $(headers)
	@mkdir -p $(@D)
	$(CLANG) -c $(wasm_cc_flags) -o $@ $<

# Link objects for wasm library target
$(wasm_lib): $(wasm_lib_objs)
	$(CLANG) $(wasm_cc_flags) $(wasm_clang_ld_flags) -Wl,--no-entry -o $@ $^
	@echo "Wasm library output as" $@


# Compile C files for wasm application target
# App wasm includes main() and stubs out any javascript callbacks
$(wasm_app_out)/%.o: %.c $(headers)
	@mkdir -p $(@D)
	$(CLANG) -DDISABLE_JS_CALLBACKS=1 -c $(wasm_cc_flags) -o $@ $<

# Link objects for wasm application target
$(wasm_app): $(wasm_app_objs)
	$(CLANG) $(wasm_cc_flags) $(wasm_clang_ld_flags) -o $@ $^
	@echo "Wasm application output as" $@

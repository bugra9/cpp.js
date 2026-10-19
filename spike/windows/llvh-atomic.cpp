// llvh's call_once falls back to these atomics where it is neither MSVC nor Unix, as with llvm-mingw, and Hermes leaves
// out Atomic.cpp, where LLVM defines them.
#include "llvh/Support/Atomic.h"

void llvh::sys::MemoryFence() { __atomic_thread_fence(__ATOMIC_SEQ_CST); }

llvh::sys::cas_flag llvh::sys::CompareAndSwap(volatile cas_flag *ptr, cas_flag new_value, cas_flag old_value) {
    return __sync_val_compare_and_swap(ptr, old_value, new_value);
}

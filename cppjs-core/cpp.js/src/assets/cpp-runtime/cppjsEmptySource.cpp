// Placeholder TU so the static archive always exports at least one symbol;
// otherwise ranlib emits "has no symbols" warnings.
//
// `inline` gives the variable C++17 vague/COMDAT linkage so the same file
// compiled into multiple libraries can be linked into one binary without
// ODR conflicts. `[[gnu::used]]` (clang/gcc) forces the compiler to emit
// the symbol even though nothing references it; without it, the optimizer
// drops the inline variable and the warning persists.
[[maybe_unused, gnu::used]] inline int cppjs_empty_source_marker = 0;

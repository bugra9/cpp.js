---
name: cluster-225
description: "Skill for the Cluster_225 area of crossbind. 14 symbols across 1 files."
---

# Cluster_225

14 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `core/`
- Understanding how enum_tid, class_tid, shared_tid work
- Modifying cluster_225-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-rust/crate/src/lib.rs` | registry, tid, get_actual_type_thunk, enum_tid, class_tid (+9) |

## Entry Points

Start here when exploring this area:

- **`enum_tid`** (Function) — `core/embind-rust/crate/src/lib.rs:452`
- **`class_tid`** (Function) — `core/embind-rust/crate/src/lib.rs:458`
- **`shared_tid`** (Function) — `core/embind-rust/crate/src/lib.rs:465`
- **`enum_`** (Function) — `core/embind-rust/crate/src/lib.rs:684`
- **`value_object_tid`** (Function) — `core/embind-rust/crate/src/lib.rs:705`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `enum_tid` | Function | `core/embind-rust/crate/src/lib.rs` | 452 |
| `class_tid` | Function | `core/embind-rust/crate/src/lib.rs` | 458 |
| `shared_tid` | Function | `core/embind-rust/crate/src/lib.rs` | 465 |
| `enum_` | Function | `core/embind-rust/crate/src/lib.rs` | 684 |
| `value_object_tid` | Function | `core/embind-rust/crate/src/lib.rs` | 705 |
| `value_object_` | Function | `core/embind-rust/crate/src/lib.rs` | 726 |
| `field` | Function | `core/embind-rust/crate/src/lib.rs` | 745 |
| `class_` | Function | `core/embind-rust/crate/src/lib.rs` | 781 |
| `smart_ptr` | Function | `core/embind-rust/crate/src/lib.rs` | 808 |
| `smart_ptr_shared` | Function | `core/embind-rust/crate/src/lib.rs` | 836 |
| `registry` | Function | `core/embind-rust/crate/src/lib.rs` | 101 |
| `tid` | Function | `core/embind-rust/crate/src/lib.rs` | 116 |
| `get_actual_type_thunk` | Function | `core/embind-rust/crate/src/lib.rs` | 446 |
| `crossbind_tid_emval` | Function | `core/embind-rust/crate/src/lib.rs` | 490 |

## How to Explore

1. `context({name: "enum_tid"})` — see callers and callees
2. `query({search_query: "cluster_225"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`

---
name: cluster-231
description: "Skill for the Cluster_231 area of crossbind. 16 symbols across 2 files."
---

# Cluster_231

16 symbols | 2 files | Cohesion: 88%

## When to Use

- Working with code in `core/`
- Understanding how from_f64, from_bool, from_str work
- Modifying cluster_231-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-rust/crate/src/lib.rs` | crossbind_v_from_f64, crossbind_v_from_bool, crossbind_v_from_str, crossbind_v_get_prop, crossbind_v_set_prop (+9) |
| `core/embind-rust/demo/src/lib.rs` | js_probe, js_fire |

## Entry Points

Start here when exploring this area:

- **`from_f64`** (Function) — `core/embind-rust/crate/src/lib.rs:543`
- **`from_bool`** (Function) — `core/embind-rust/crate/src/lib.rs:546`
- **`from_str`** (Function) — `core/embind-rust/crate/src/lib.rs:549`
- **`get`** (Function) — `core/embind-rust/crate/src/lib.rs:552`
- **`set`** (Function) — `core/embind-rust/crate/src/lib.rs:555`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `from_f64` | Function | `core/embind-rust/crate/src/lib.rs` | 543 |
| `from_bool` | Function | `core/embind-rust/crate/src/lib.rs` | 546 |
| `from_str` | Function | `core/embind-rust/crate/src/lib.rs` | 549 |
| `get` | Function | `core/embind-rust/crate/src/lib.rs` | 552 |
| `set` | Function | `core/embind-rust/crate/src/lib.rs` | 555 |
| `as_f64` | Function | `core/embind-rust/crate/src/lib.rs` | 565 |
| `js_probe` | Function | `core/embind-rust/demo/src/lib.rs` | 225 |
| `js_fire` | Function | `core/embind-rust/demo/src/lib.rs` | 244 |
| `crossbind_v_from_f64` | Function | `core/embind-rust/crate/src/lib.rs` | 494 |
| `crossbind_v_from_bool` | Function | `core/embind-rust/crate/src/lib.rs` | 495 |
| `crossbind_v_from_str` | Function | `core/embind-rust/crate/src/lib.rs` | 496 |
| `crossbind_v_get_prop` | Function | `core/embind-rust/crate/src/lib.rs` | 497 |
| `crossbind_v_set_prop` | Function | `core/embind-rust/crate/src/lib.rs` | 498 |
| `crossbind_v_as_f64` | Function | `core/embind-rust/crate/src/lib.rs` | 500 |
| `str_wire` | Function | `core/embind-rust/crate/src/lib.rs` | 507 |
| `own` | Function | `core/embind-rust/crate/src/lib.rs` | 532 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Js_call → JsValue` | cross_community | 5 |
| `Js_probe → JsValue` | intra_community | 4 |
| `Js_probe → Crossbind_v_kind` | cross_community | 4 |
| `Js_probe → Crossbind_v_get_prop` | intra_community | 3 |
| `Js_probe → Str_wire` | intra_community | 3 |
| `Js_probe → Crossbind_v_as_f64` | intra_community | 3 |
| `Js_probe → Crossbind_v_set_prop` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_232 | 1 calls |

## How to Explore

1. `context({name: "from_f64"})` — see callers and callees
2. `query({search_query: "cluster_231"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`

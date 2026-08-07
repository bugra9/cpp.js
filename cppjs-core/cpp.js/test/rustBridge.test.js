import {
    describe, test, expect, beforeAll, afterAll,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import generateRustBridge, {
    createRustBridgeCrate, readCrateName, parseSurface, parseCrateSurface,
} from '../src/utils/rustBridgeGen.js';

// One crate covering the documented v1 surface: enum, value object, class (ctor, factory,
// methods, Display, Result/Option returns, &str/&String/&Class params, i64) and a free fn.
const LIB_RS = `
#[repr(i32)]
pub enum Mode {
    Fast = 0,
    Slow = 1,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

pub struct Counter {
    current: i32,
}

impl Counter {
    pub fn new(start: i32) -> Self {
        Counter { current: start }
    }
    pub fn from_text(text: &str) -> Option<Self> {
        None
    }
    pub fn current(&self) -> i32 {
        self.current
    }
    pub fn bump(&mut self, by: i32) -> i32 {
        self.current += by;
        self.current
    }
    pub fn checked_div(&self, by: i32) -> Result<i32, String> {
        Ok(self.current / by)
    }
    pub fn label(&self, prefix: &String) -> String {
        format!("{}{}", prefix, self.current)
    }
    pub fn distance(&self, other: &Counter) -> i64 {
        (self.current - other.current) as i64
    }
    pub fn mode(&self) -> Mode {
        Mode::Fast
    }
    pub fn origin(&self) -> Point {
        Point::default()
    }
}

impl std::fmt::Display for Counter {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.current)
    }
}

pub fn double_it(value: i32) -> i32 {
    value * 2
}
`;

let work;
let crateDir;

beforeAll(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-rust-bridge-'));
    crateDir = path.join(work, 'demo-crate');
    fs.mkdirSync(path.join(crateDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(crateDir, 'Cargo.toml'), '[package]\nname = "demo-crate"\nversion = "0.1.0"\n');
    fs.writeFileSync(path.join(crateDir, 'src/lib.rs'), LIB_RS);
});

afterAll(() => {
    fs.rmSync(work, { recursive: true, force: true });
});

describe('readCrateName', () => {
    test('reads the package name from Cargo.toml', () => {
        expect(readCrateName(crateDir)).toBe('demo-crate');
    });

    test('throws when the crate has no Cargo.toml', () => {
        expect(() => readCrateName(path.join(work, 'missing'))).toThrow();
    });
});

describe('generateRustBridge', () => {
    let result;
    let bridge;
    let manifest;
    let dts;

    beforeAll(() => {
        const dtsFile = path.join(work, 'demo.d.ts');
        result = generateRustBridge({
            crateDir, vectors: [{ of: 'i32', name: 'VectorInt' }], dtsFile, keepName: 'demo', log: () => {},
        });
        bridge = fs.readFileSync(path.join(result.bridgeDir, 'src/lib.rs'), 'utf8');
        manifest = fs.readFileSync(path.join(result.bridgeDir, 'Cargo.toml'), 'utf8');
        dts = fs.readFileSync(dtsFile, 'utf8');
    });

    test('writes the companion crate next to the user crate', () => {
        expect(result.bridgeDir).toBe(`${crateDir}/.cppjs/bridge-crate`);
        expect(result.crateName).toBe('demo_crate_cppjs_bridge');
    });

    test('manifest depends on the user crate by path and keeps one codegen unit', () => {
        expect(manifest).toContain('name = "demo-crate-cppjs-bridge"');
        expect(manifest).toContain('crate-type = ["staticlib"]');
        expect(manifest).toContain(`demo_crate = { package = "demo-crate", path = "${crateDir}" }`);
        expect(manifest).toContain('embind-rs = { path = ');
        expect(manifest).toContain('codegen-units = 1');
        // Isolated on purpose: a surrounding workspace must never absorb the bridge crate.
        expect(manifest).toContain('[workspace]');
    });

    test('registers the class, its methods and the free function', () => {
        expect(bridge).toContain('class_::<demo_crate::Counter>("Counter")');
        expect(bridge).toContain('.constructor');
        expect(bridge).toContain('"current"');
        expect(bridge).toContain('"bump"');
        expect(bridge).toContain('"checkedDiv"');
        expect(bridge).toContain('"fromText"');
        expect(bridge).toContain('"toString"');
        expect(bridge).toContain('double_it');
    });

    test('registers the enum with its variants and the value object with its fields', () => {
        expect(bridge).toContain('enum_::<ModeW>("Mode")');
        expect(bridge).toContain('demo_crate::Mode::Fast');
        expect(bridge).toContain('value_object_::<PointW>("Point")');
        expect(bridge).toContain('"x"');
        expect(bridge).toContain('"y"');
    });

    test('adapts borrowed params: strings cross as String, class refs through a Ref wrapper', () => {
        expect(bridge).toContain('CounterRef');
        expect(bridge).toMatch(/label[\s\S]*?String/);
    });

    test('emits the vector registration declared by the config', () => {
        expect(bridge).toContain('register_vector::<i32>("VectorInt")');
    });

    test('appends the keep symbol so the lazily linked archive can be pinned', () => {
        expect(bridge).toContain('pub extern "C" fn cppjs_keep_demo()');
    });

    test('writes declarations next to the requested path', () => {
        expect(dts).toContain('export declare class Counter');
        expect(dts).toContain('checkedDiv');
    });

    test('is idempotent: a second run leaves the generated files untouched', () => {
        const before = fs.statSync(path.join(result.bridgeDir, 'src/lib.rs')).mtimeMs;
        generateRustBridge({
            crateDir, vectors: [{ of: 'i32', name: 'VectorInt' }], keepName: 'demo', log: () => {},
        });
        expect(fs.statSync(path.join(result.bridgeDir, 'src/lib.rs')).mtimeMs).toBe(before);
    });

    test('throws when the crate has no src/lib.rs', () => {
        const empty = path.join(work, 'empty-crate');
        fs.mkdirSync(empty, { recursive: true });
        fs.writeFileSync(path.join(empty, 'Cargo.toml'), '[package]\nname = "empty"\n');
        expect(() => generateRustBridge({ crateDir: empty, log: () => {} })).toThrow(/lib\.rs not found/);
    });
});

// Anything outside the v1 surface is skipped WITH a log line - never silently.
describe('parseSurface: what the grammar refuses', () => {
    const OUTSIDE = `
pub enum Loose {
    A(i32),
}

#[repr(C)]
pub struct NotCopy {
    pub x: f64,
}

pub struct Wide;

impl Wide {
    pub fn new() -> Self {
        Wide
    }
    pub fn consuming(self) -> i32 {
        1
    }
    pub fn too_many(&self, a: i32, b: i32, c: i32, d: i32, e: i32) -> i32 {
        a
    }
    pub fn odd_param(&self, other: Vec<String>) -> i32 {
        0
    }
    pub fn odd_return(&self) -> Vec<String> {
        vec![]
    }
    pub fn odd_option(&self) -> Option<Vec<i32>> {
        None
    }
    pub fn factory_wide(a: i32, b: i32, c: i32) -> Self {
        Wide
    }
}

pub struct Bare;

impl Bare {
    fn private_only(&self) -> i32 {
        0
    }
}
`;

    let model;
    let logs;

    beforeAll(() => {
        logs = [];
        model = parseSurface(OUTSIDE, (line) => logs.push(line));
    });

    test('skips an enum that is not a repr(i32) unit enum, and says so', () => {
        expect(model.enums).toEqual([]);
        expect(logs.some((l) => l.includes('enum Loose skipped'))).toBe(true);
    });

    test('skips a repr(C) struct without the required derives, and says so', () => {
        expect(model.valueObjects).toEqual([]);
        expect(logs.some((l) => l.includes('struct NotCopy skipped'))).toBe(true);
    });

    test('skips methods outside the grammar with one reason each', () => {
        const wide = model.classes.find((c) => c.name === 'Wide');
        expect(wide.methods.map((m) => m.name)).toEqual([]);
        expect(logs.some((l) => l.includes('consuming self is not supported'))).toBe(true);
        expect(logs.some((l) => l.includes('too_many'))).toBe(true);
        expect(logs.some((l) => l.includes('unsupported parameter'))).toBe(true);
        expect(logs.some((l) => l.includes("unsupported return 'Vec<String>'"))).toBe(true);
        expect(logs.some((l) => l.includes('Option<Vec<i32>> return is not representable'))).toBe(true);
        expect(logs.some((l) => l.includes('factories take max 2 args'))).toBe(true);
    });

    test('drops a struct whose surface is entirely private, and says so', () => {
        expect(model.classes.map((c) => c.name)).not.toContain('Bare');
        expect(logs.some((l) => l.includes('struct Bare has no exportable pub fns'))).toBe(true);
    });
});

describe('parseCrateSurface', () => {
    let srcDir;

    beforeAll(() => {
        srcDir = path.join(work, 'multi-file/src');
        fs.mkdirSync(srcDir, { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'lib.rs'), [
            'pub struct Counter { current: i32 }',
            '',
            'impl Counter {',
            '    pub fn new(start: i32) -> Self { Counter { current: start } }',
            '}',
            '',
            '#[cfg(feature = "extra")]',
            'mod extra;',
            '',
        ].join('\n'));
        fs.writeFileSync(path.join(srcDir, 'extra.rs'), [
            'use crate::Counter;',
            '',
            'impl Counter {',
            '    pub fn doubled(&self) -> i32 { self.current * 2 }',
            '}',
            '',
        ].join('\n'));
    });

    test('walks the crate root and registers its types', () => {
        const model = parseCrateSurface({ srcDir, log: () => {} });
        expect(model.classes.map((c) => c.name)).toContain('Counter');
    });

    test('skips a feature-gated module unless the feature is resolved on', () => {
        const off = parseCrateSurface({ srcDir, log: () => {} });
        expect(off.classes.find((c) => c.name === 'Counter').methods.map((m) => m.name)).not.toContain('doubled');
        const on = parseCrateSurface({ srcDir, features: ['extra'], log: () => {} });
        expect(on.classes.find((c) => c.name === 'Counter').methods.map((m) => m.name)).toContain('doubled');
    });
});

describe('createRustBridgeCrate', () => {
    let created;
    let bridge;
    let manifest;
    let projectPath;
    let cacheDir;

    beforeAll(() => {
        projectPath = path.join(work, 'app');
        cacheDir = path.join(projectPath, '.cppjs');
        fs.mkdirSync(path.join(projectPath, 'src/native'), { recursive: true });
        const rsFile = path.join(projectPath, 'src/native/counter.rs');
        fs.writeFileSync(rsFile, LIB_RS);
        created = createRustBridgeCrate({
            rsFile,
            cacheDir,
            projectPath,
            vectors: [],
            cargoDependencies: { uuid: '1.11.0', geo: '{ version = "0.29", default-features = false }' },
            log: () => {},
        });
        bridge = fs.readFileSync(path.join(created.bridgeDir, 'src/lib.rs'), 'utf8');
        manifest = fs.readFileSync(path.join(created.bridgeDir, 'Cargo.toml'), 'utf8');
    });

    test('synthesizes a self-contained rlib crate for the app-local source', () => {
        expect(created.bridgeDir).toBe(`${cacheDir}/rust-bridges/counter`);
        expect(created.crateName).toBe('counter_cppjs_app');
        expect(manifest).toContain('crate-type = ["rlib"]');
    });

    test('embeds the user file by path instead of copying it', () => {
        expect(bridge).toContain('#[path = "');
        expect(bridge).toContain('mod user;');
        expect(bridge).toContain('class_::<user::Counter>("Counter")');
    });

    test('renders declared cargo dependencies, both plain versions and verbatim specs', () => {
        expect(manifest).toContain('uuid = "1.11.0"');
        expect(manifest).toContain('geo = { version = "0.29", default-features = false }');
    });

    test('mirrors the declarations under the cache instead of the user source folder', () => {
        const mirrored = path.join(cacheDir, 'types/src/native/counter.rs.d.ts');
        expect(fs.existsSync(mirrored)).toBe(true);
        expect(fs.existsSync(path.join(projectPath, 'src/native/counter.rs.d.ts'))).toBe(false);
        expect(fs.readFileSync(mirrored, 'utf8')).toContain('export declare class Counter');
    });

    test('returns the parsed model so callers can wire the surface', () => {
        expect(created.model.classes.map((c) => c.name)).toContain('Counter');
        expect(created.model.enums.map((e) => e.name)).toContain('Mode');
    });
});

import { describe, test, expect } from 'vitest';
import { parseSurface, emitDts } from '../src/utils/rustBridgeGen.js';

const SOURCE = `
pub struct Counter {
    current: i32,
}

impl Counter {
    pub fn new(start: i32) -> Self {
        Counter { current: start }
    }
    pub fn label(&self) -> String {
        format!("{}", self.current)
    }
    pub fn parse_opt(text: &str) -> Option<Self> {
        None
    }
}
`;

describe('emitDts modes', () => {
    const model = parseSurface(SOURCE, () => {});

    test('sync mode types the direct surface', () => {
        const dts = emitDts(model, [{ of: 'i32', name: 'IntVector' }], 'sync');
        expect(dts).toContain('constructor(start: number);');
        expect(dts).toContain('label(): string;');
        expect(dts).toContain('static parseOpt(text: string): Counter | null;');
        expect(dts).toContain('get(index: number): number;');
    });

    test('promise mode wraps returns but never constructors', () => {
        const dts = emitDts(model, [{ of: 'i32', name: 'IntVector' }], 'promise');
        expect(dts).toContain('constructor(start: number);');
        expect(dts).toContain('label(): Promise<string>;');
        expect(dts).toContain('static parseOpt(text: string): Promise<Counter | null>;');
        expect(dts).toContain('get(index: number): Promise<number>;');
        expect(dts).toContain('size(): Promise<number>;');
        expect(dts).not.toContain('Promise<Promise');
    });
});

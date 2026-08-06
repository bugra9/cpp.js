/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCppJs, Native } from './native/native.h';
// Rust package import: the metro resolver maps the bare package name to the crate's lib.rs and
// the transformer emits the same proxy-module shape as a .h import (exports bind on init).
import {
    initCppJs as initRustDemo,
    RustyCounter,
    Widget,
    Gauge,
    Mode,
    RustIntVector,
    doubleIt,
    greet,
    checkedParse,
    parseEven,
    tag,
} from '@cpp.js/embind-rust-demo';
// App-local Rust file, imported like a .h: the toolchain synthesizes and links its bridge crate.
import { initCppJs as initCounter, Counter } from './native/counter.rs';
// App-local surface over an UPSTREAM crate: geo comes from the app config's
// export.bindings.cargoDependencies declaration - no cpp.js package involved.
import { initCppJs as initHull, Hull } from './native/geo_surface.rs';
// DIRECT crate imports: no surface files - bridges are generated from the crates' own sources
// (declared in cargoDependencies); types come from .cppjs/rust-crates/types.
import { initCppJs as initUuid, Uuid } from 'cargo:uuid';
import { initCppJs as initSemver, Version, VersionReq } from 'cargo:semver';
import { initCppJs as initRegex, Regex } from 'cargo:regex';

function App() {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <AppContent />
        </SafeAreaProvider>
    );
}

function AppContent() {
    const [message, setMessage] = useState('compiling ...');

    useEffect(() => {
        initCppJs().then(async () => {
            // Binds this proxy module's exports (RustyCounter, Mode, ...); boot already happened.
            await initRustDemo();
            // Every type kind of the embind-rust demo, each checked in isolation so one failure
            // never hides the rest. Rust class -> flat C-ABI -> jsi adapter -> embind-jsi.
            const out: string[] = [];
            const check = (name: string, fn: () => any, expected?: any) => {
                try {
                    const got = fn();
                    const ok = expected === undefined || JSON.stringify(got) === JSON.stringify(expected);
                    out.push(`${ok ? 'OK' : 'NO'} ${name}=${JSON.stringify(got)}`);
                } catch (e: any) {
                    out.push(`NO ${name} ERR:${e?.message ?? e}`);
                }
            };

            const c = new RustyCounter(10);
            c.increment(5);
            check('increment', () => c.increment(27), 42);
            check('current', () => c.current(), 42);
            check('addSpan', () => c.addSpan(2, 5), 45); // 42 + (5-2)
            check('isPositive', () => c.isPositive(), true);
            check('setMode', () => c.setMode(Mode.Fast) === Mode.Fast, true);
            check('describe', () => c.describe('v').startsWith('v=45'), true);
            check(
                'asPoint',
                () => {
                    const p = c.asPoint();
                    return [p.x, p.y];
                },
                [45, 0],
            );
            check('sumPoint', () => c.sumPoint({ x: 3, y: 4 }), 7);
            check('scale(f64)', () => c.scale(2.5), 112.5); // 45 * 2.5, double in and out
            c.delete();

            const v = new RustIntVector();
            v.push_back(11);
            v.push_back(22);
            check('vector', () => [v.size(), v.get(1)], [2, 22]);
            v.delete();

            const w = Widget.create(6);
            check('widget', () => w.area(), 36);
            w.delete();

            // Idioms: &str param, Result -> JS exception, Option<Self> -> null.
            check(
                'strParam',
                () => {
                    const t = RustyCounter.fromText(' 42 ');
                    const l = t.label('n=');
                    t.delete();
                    return l;
                },
                'n=42',
            );
            check(
                'resultThrow',
                () => {
                    try {
                        RustyCounter.fromText('nope');
                        return 'no-throw';
                    } catch (e: any) {
                        return String(e?.message ?? e).includes('invalid digit');
                    }
                },
                true,
            );
            check('optionNull', () => RustyCounter.parseOpt('nope'), null);
            check(
                'ctorThrow',
                () => {
                    try {
                        const g = new Gauge(101);
                        g.delete();
                        return 'no-throw';
                    } catch (e: any) {
                        return String(e?.message ?? e).includes('out of range');
                    }
                },
                true,
            );
            check(
                'gauge',
                () => {
                    const g = new Gauge(40);
                    const l = g.level();
                    g.delete();
                    return l;
                },
                40,
            );

            // BigInt (i64/u64), Display -> toString, free functions.
            check(
                'addBig',
                () => {
                    const b = new RustyCounter(42);
                    const r = b.addBig(1000000000000n) === 1000000000042n;
                    b.delete();
                    return r;
                },
                true,
            );
            check(
                'maxU64',
                () => {
                    const b = new RustyCounter(0);
                    const r = b.maxU64() === 18446744073709551615n;
                    b.delete();
                    return r;
                },
                true,
            );
            check(
                'displayStr',
                () => {
                    const g = new Gauge(40);
                    const s = `${g}`;
                    g.delete();
                    return s;
                },
                'gauge(40)',
            );
            check('freeFns', () => [doubleIt(21), greet('rn')], [42, 'hello rn']);
            check(
                'freeThrow',
                () => {
                    try {
                        checkedParse('x');
                        return 'no-throw';
                    } catch (e: any) {
                        return String(e?.message ?? e).includes('invalid digit');
                    }
                },
                true,
            );

            // Optional returns: Some -> plain value, None -> undefined.
            check(
                'optSome',
                () => {
                    const b = new RustyCounter(42);
                    const r: any[] = [b.half(), b.ratio(2), b.maybeLabel()];
                    b.delete();
                    return r;
                },
                [21, 21, 'v42'],
            );
            check(
                'optParam',
                () => {
                    const b = new RustyCounter(10);
                    const r =
                        b.bump(5) === 15 && b.bump(undefined) === 16 && b.bump(null) === 17 && tag('x') === '[x]' && tag(undefined) === '[none]';
                    b.delete();
                    return r;
                },
                true,
            );
            check(
                'classRef',
                () => {
                    const a = new RustyCounter(42);
                    const b = new RustyCounter(10);
                    const r = a.diff(b);
                    a.delete();
                    b.delete();
                    return r;
                },
                32,
            );
            check(
                'optNone',
                () => {
                    const b = new RustyCounter(7);
                    const r = b.half() === undefined && b.ratio(0) === undefined && parseEven('7') === undefined && parseEven(' 8 ') === 8;
                    b.delete();
                    return r;
                },
                true,
            );

            await initCounter();
            check(
                'appLocalRs',
                () => {
                    const k = new Counter(40);
                    k.add(2);
                    const t = k.total();
                    k.delete();
                    return t;
                },
                42,
            );

            await initUuid();
            check(
                'uuidV4',
                () => {
                    const u = Uuid.newV4();
                    const s = `${u}`;
                    u.delete();
                    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s);
                },
                true,
            );
            check(
                'uuidRoundtrip',
                () => {
                    const u = Uuid.parseStr('67e55044-10b1-426f-9247-bb680e5fe0c8');
                    const r: any[] = [`${u}`, u.isNil()];
                    u.delete();
                    const n = Uuid.nil();
                    r.push(n.isNil());
                    n.delete();
                    return r;
                },
                ['67e55044-10b1-426f-9247-bb680e5fe0c8', false, true],
            );
            check(
                'uuidErr',
                () => {
                    try {
                        Uuid.parseStr('nope');
                        return 'no-throw';
                    } catch (e: any) {
                        return String(e?.message ?? e).includes('invalid');
                    }
                },
                true,
            );

            await initSemver();
            check(
                'semver',
                () => {
                    const req = VersionReq.parse('>=1.2.3, <2');
                    const ok = Version.parse('1.5.0');
                    const no = Version.parse('2.1.0');
                    const r = req.matches(ok) === true && req.matches(no) === false;
                    ok.delete();
                    no.delete();
                    req.delete();
                    try {
                        Version.parse('nope');
                        return 'no-throw';
                    } catch (e: any) {
                        return r && String(e?.message ?? e).includes('unexpected');
                    }
                },
                true,
            );

            await initRegex();
            check(
                'regex',
                () => {
                    const re = new Regex('^a+$');
                    const r = re.isMatch('aaaa') === true && re.isMatch('bbb') === false;
                    re.delete();
                    try {
                        const bad = new Regex('(');
                        bad.delete();
                        return 'no-throw';
                    } catch (e: any) {
                        return r && String(e?.message ?? e).length > 0;
                    }
                },
                true,
            );

            await initHull();
            check(
                'hullRs',
                () => {
                    const h = Hull.fromWkt('MULTIPOINT((0 0),(4 0),(0 4),(4 4),(2 2))');
                    const r = [h.isValid(), h.hullArea(), h.hullWkt().startsWith('POLYGON')];
                    h.delete();
                    return r;
                },
                [true, 16, true],
            );

            const pass = out.filter(l => l.startsWith('OK')).length;
            const summary = `rust ${pass}/${out.length}\n${out.join('\n')}`;
            console.log(`SMOKE_RESULT ${summary}`);
            setMessage(`${Native.sample()}\n${summary}`);
        });
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#242424',
    },
    text: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        fontFamily: 'Menlo',
    },
});

export default App;

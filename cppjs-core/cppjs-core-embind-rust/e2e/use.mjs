import factory from './demo.mjs';

const m = await factory();
const c = new m.RustyCounter(10);
c.increment(5);
c.increment(27);
c.addSpan(2, 10);   // two-arg method (N-arity): +8
console.log('current:', c.current());
console.log('scale:', c.scale(2.5));        // f64 in/out
console.log('positive:', c.isPositive());   // bool out
console.log('mode:', c.setMode(m.Mode.Fast) === m.Mode.Fast);   // enum in/out (identity)
console.log('point.x:', c.asPoint().x);         // value object out ({x,y})
console.log('sum:', c.sumPoint({ x: 3, y: 4 })); // value object in
console.log('describe:', c.describe('count'));
c.delete();

// smart_ptr + static factory: no `new`, freed on delete()
const w = m.Widget.create(6);
console.log('area:', w.area());
w.delete();

// vector: registered as a class with size/get/push_back
const v = new m.RustIntVector();
v.push_back(10);
v.push_back(20);
console.log('vec:', v.size(), v.get(1));
console.log('void:', v.push_back(30));   // void method returns undefined in JS
v.delete();

// Idioms: &str params, Result -> JS exception, Option<Self> -> JS null.
const t = m.RustyCounter.fromText(' 42 ');
console.log('fromText:', t.current());
console.log('label:', t.label('n='));
console.log('checkedDiv:', t.checkedDiv(2));
try { t.checkedDiv(0); console.log('checkedDiv0: NO-THROW'); } catch (e) { console.log('checkedDiv0 threw:', e.message); }
t.delete();
try { m.RustyCounter.fromText('nope'); console.log('fromTextBad: NO-THROW'); } catch (e) { console.log('fromTextBad threw:', e.message); }
console.log('parseOpt none:', m.RustyCounter.parseOpt('nope'));
const s = m.RustyCounter.parseOpt('7');
console.log('parseOpt some:', s.current());
s.delete();
try { new m.Gauge(101); console.log('gaugeBad: NO-THROW'); } catch (e) { console.log('gaugeBad threw:', e.message); }
const g = new m.Gauge(40);
console.log('gauge level:', g.level());
console.log('gaugeStr:', `${g}`);   // impl Display -> toString()
g.delete();

// BigInt (i64/u64) and free functions.
const b = new m.RustyCounter(42);
console.log('addBig:', b.addBig(1000000000000n) === 1000000000042n);
console.log('maxU64:', b.maxU64() === 18446744073709551615n);
b.delete();
console.log('doubleIt:', m.doubleIt(21));
console.log('greet:', m.greet('rust'));
console.log('checkedParse:', m.checkedParse(' 7 '));
try { m.checkedParse('x'); console.log('checkedParseBad: NO-THROW'); } catch (e) { console.log('checkedParseBad threw:', e.message); }

// Optional returns: None surfaces as undefined, Some as the plain value.
const oc = new m.RustyCounter(42);
console.log('half:', oc.half());
console.log('ratio:', oc.ratio(2));
console.log('ratio0:', oc.ratio(0));
console.log('maybeLabel:', oc.maybeLabel());
oc.delete();
const o7 = new m.RustyCounter(7);
console.log('half7:', o7.half());
o7.delete();
console.log('parseEven:', m.parseEven(' 8 '));
console.log('parseEvenOdd:', m.parseEven('7'));

// Optional parameters: undefined/null arrive as None, values as Some.
const op = new m.RustyCounter(10);
console.log('bump5:', op.bump(5));
console.log('bumpU:', op.bump(undefined));
console.log('bumpN:', op.bump(null));
op.delete();
console.log('tag:', m.tag('x'));
console.log('tagU:', m.tag(undefined));
console.log('tagN:', m.tag(null));

// Class-typed parameter: pass one bound instance into another's method.
const da = new m.RustyCounter(42);
const db = new m.RustyCounter(10);
console.log('diff:', da.diff(db));
da.delete();
db.delete();

console.log('EMBIND-RS: PASS');

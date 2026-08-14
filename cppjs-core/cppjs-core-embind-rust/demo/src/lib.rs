// Plain Rust - no cpp.js coupling. The toolchain parses this pub surface and generates the
// embind bridge as a companion crate (.cppjs/bridge-crate), the Rust analog of C++ .i.cpp files.

use serde_json::Value;
use std::sync::Arc;
use std::sync::atomic::{AtomicI32, Ordering};
use embind_rs::{JsFunction, JsValue};

// A by-value data struct: crosses as a plain `{x, y}` object in JS.
#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

// A C-like enum, usable as a method argument/return.
#[repr(i32)]
#[derive(Clone, Copy)]
pub enum Mode {
    Slow = 0,
    Fast = 1,
}

pub struct RustyCounter {
    value: i64,
    log: Vec<String>,
}

impl RustyCounter {
    pub fn new(start: i32) -> Self {
        RustyCounter { value: start as i64, log: Vec::new() }
    }
    pub fn increment(&mut self, by: i32) -> i32 {
        self.value += by as i64;
        self.log.push(format!("+{by}"));
        self.value as i32
    }
    pub fn current(&mut self) -> i32 {
        self.value as i32
    }
    // Two args: exercises N-arity (function2) end to end.
    pub fn add_span(&mut self, from: i32, to: i32) -> i32 {
        self.value += (to - from) as i64;
        self.log.push(format!("span {from}..{to}"));
        self.value as i32
    }
    pub fn describe(&mut self, prefix: String) -> String {
        format!("{prefix}={} (log: {})", self.value, self.log.join(" "))
    }
    // f64 in and out.
    pub fn scale(&mut self, factor: f64) -> f64 {
        self.value as f64 * factor
    }
    // bool out.
    pub fn is_positive(&mut self) -> bool {
        self.value > 0
    }
    // enum in and out.
    pub fn set_mode(&mut self, m: Mode) -> Mode {
        self.log.push(format!("mode {}", m as i32));
        m
    }
    // value object out.
    pub fn as_point(&mut self) -> Point {
        Point { x: self.value as i32, y: 0 }
    }
    // value object in.
    pub fn sum_point(&mut self, p: Point) -> i32 {
        p.x + p.y
    }
    // Fallible factory: Err surfaces as a JS exception (the error type only needs Display).
    pub fn from_text(text: &str) -> Result<Self, std::num::ParseIntError> {
        Ok(RustyCounter { value: text.trim().parse::<i32>()? as i64, log: Vec::new() })
    }
    // Nullable factory: None surfaces as JS null.
    pub fn parse_opt(text: &str) -> Option<Self> {
        text.trim().parse::<i32>().ok().map(|v| RustyCounter { value: v as i64, log: Vec::new() })
    }
    // Fallible method: Err throws in JS, Ok is a plain number.
    pub fn checked_div(&self, divisor: i32) -> Result<i32, String> {
        if divisor == 0 {
            return Err("division by zero".to_string());
        }
        Ok((self.value / divisor as i64) as i32)
    }
    // Borrowed-str parameter: String on the wire, borrowed at the call site.
    pub fn label(&self, prefix: &str) -> String {
        format!("{prefix}{}", self.value)
    }
    // i64 in and out: crosses as a JS BigInt, full 64-bit range.
    pub fn add_big(&mut self, v: i64) -> i64 {
        self.value += v;
        self.value
    }
    // u64 out: u64::MAX proves the unsigned path (a signed read would yield -1).
    pub fn max_u64(&self) -> u64 {
        u64::MAX
    }
    // Optional returns: None surfaces as JS undefined.
    pub fn half(&self) -> Option<i32> {
        if self.value % 2 == 0 { Some((self.value / 2) as i32) } else { None }
    }
    pub fn ratio(&self, divisor: i32) -> Option<f64> {
        if divisor == 0 { None } else { Some(self.value as f64 / divisor as f64) }
    }
    pub fn maybe_label(&self) -> Option<String> {
        if self.value == 0 { None } else { Some(format!("v{}", self.value)) }
    }
    // Optional parameter: JS undefined/null arrive as None.
    pub fn bump(&mut self, by: Option<i32>) -> i32 {
        self.value += by.unwrap_or(1) as i64;
        self.value as i32
    }
    // Class-typed parameter: another bound instance arrives as a plain borrow.
    pub fn diff(&self, other: &RustyCounter) -> i32 {
        (self.value - other.value) as i32
    }
    // JSON parameter + return on a method: arbitrary structured data both ways.
    pub fn snapshot(&self, extra: serde_json::Value) -> serde_json::Value {
        serde_json::json!({ "value": self.value, "extra": extra })
    }
}

// Static-factory pattern: JS gets the object from `Widget.create(n)` and the runtime frees it
// on delete() - no `new`.
pub struct Widget {
    size: i32,
}

impl Widget {
    pub fn create(size: i32) -> Self {
        Widget { size }
    }
    pub fn area(&mut self) -> i32 {
        self.size * self.size
    }
}

// Fallible `new`: `new Gauge(x)` throws in JS when the input is rejected.
pub struct Gauge {
    level: i32,
}

impl Gauge {
    pub fn new(level: i32) -> Result<Self, String> {
        if !(0..=100).contains(&level) {
            return Err(format!("level {level} out of range"));
        }
        Ok(Gauge { level })
    }
    pub fn level(&self) -> i32 {
        self.level
    }
}

// Display becomes a JS toString(), so `${gauge}` prints "gauge(40)".
impl std::fmt::Display for Gauge {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "gauge({})", self.level)
    }
}

// Top-level pub fns surface as module-level JS functions.
pub fn double_it(x: i32) -> i32 {
    x * 2
}

pub fn greet(name: &str) -> String {
    format!("hello {name}")
}

pub fn checked_parse(text: &str) -> Result<i32, std::num::ParseIntError> {
    Ok(text.trim().parse()?)
}

pub fn parse_even(text: &str) -> Option<i32> {
    text.trim().parse::<i32>().ok().filter(|v| v % 2 == 0)
}

pub fn tag(word: Option<String>) -> String {
    format!("[{}]", word.unwrap_or_else(|| "none".to_string()))
}

static SHARED_DROPS: AtomicI32 = AtomicI32::new(0);

// Shared ownership (Arc<T>): created only through Arc factories, &self methods only; several
// JS handles may co-own one instance, and the last delete() drops it.
pub struct SharedDoc {
    label: String,
}

impl SharedDoc {
    pub fn create(label: &str) -> Arc<Self> {
        Arc::new(SharedDoc { label: label.to_string() })
    }
    pub fn label(&self) -> String {
        self.label.clone()
    }
    // Arc parameter: instance identity is observable from Rust.
    pub fn same_as(&self, other: Arc<SharedDoc>) -> bool {
        std::ptr::eq(self, Arc::as_ptr(&other))
    }
}

impl Drop for SharedDoc {
    fn drop(&mut self) {
        SHARED_DROPS.fetch_add(1, Ordering::SeqCst);
    }
}

// Same instance out (one more strong count on the wire): JS gets a second co-owning handle.
pub fn dup_doc(doc: Arc<SharedDoc>) -> Arc<SharedDoc> {
    doc
}

pub fn shared_drop_count() -> i32 {
    SHARED_DROPS.load(Ordering::SeqCst)
}

// Live JS values (JsValue/JsFunction): identity-preserving handles and callbacks into JS.
pub fn js_pass(v: JsValue) -> JsValue {
    v
}

pub fn js_probe(v: JsValue) -> JsValue {
    let a = v.get("a").as_f64().unwrap_or(-1.0);
    v.set("b", &JsValue::from_f64(a * 2.0));
    v.set("note", &JsValue::from_str("set-by-rust"));
    v
}

pub fn js_call(f: JsFunction, x: f64) -> Result<JsValue, String> {
    f.call1(&JsValue::from_f64(x))
}

thread_local! {
    static STORED_CB: std::cell::RefCell<Option<JsFunction>> = const { std::cell::RefCell::new(None) };
}

pub fn js_store(f: JsFunction) {
    STORED_CB.with(|c| *c.borrow_mut() = Some(f));
}

pub fn js_fire(x: f64) -> Result<JsValue, String> {
    STORED_CB.with(|c| match &*c.borrow() {
        Some(f) => f.call1(&JsValue::from_f64(x)),
        None => Err(String::from("no stored callback")),
    })
}

// JSON values (serde_json::Value): cross as real JS values, deep-copied at the boundary.
pub fn json_echo(v: serde_json::Value) -> serde_json::Value {
    v
}

// Bare `Value` spelling works because of the `use serde_json::Value` import above.
pub fn json_tally(v: Value) -> Value {
    let total: i64 = v.get("items").and_then(|i| i.as_array())
        .map(|a| a.iter().filter_map(|x| x.as_i64()).sum()).unwrap_or(0);
    serde_json::json!({ "hasItems": v.get("items").is_some(), "total": total })
}

pub fn json_pick(v: serde_json::Value, key: &str) -> Result<serde_json::Value, String> {
    v.get(key).cloned().ok_or_else(|| format!("missing key {key}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_text_parses_and_rejects() {
        assert_eq!(RustyCounter::from_text(" 42 ").unwrap().value, 42);
        assert!(RustyCounter::from_text("nope").is_err());
    }

    #[test]
    fn parse_opt_is_none_on_garbage() {
        assert!(RustyCounter::parse_opt("x").is_none());
        assert_eq!(RustyCounter::parse_opt("7").unwrap().value, 7);
    }

    #[test]
    fn checked_div_guards_zero() {
        let c = RustyCounter::new(10);
        assert_eq!(c.checked_div(2).unwrap(), 5);
        assert!(c.checked_div(0).is_err());
    }

    #[test]
    fn label_prefixes_value() {
        assert_eq!(RustyCounter::new(3).label("n="), "n=3");
    }

    #[test]
    fn gauge_new_validates_range() {
        assert!(Gauge::new(101).is_err());
        assert_eq!(Gauge::new(40).unwrap().level(), 40);
    }

    #[test]
    fn big_values_use_full_64_bits() {
        let mut c = RustyCounter::new(42);
        assert_eq!(c.add_big(1_000_000_000_000), 1_000_000_000_042);
        assert_eq!(c.max_u64(), u64::MAX);
    }

    #[test]
    fn gauge_display_formats() {
        assert_eq!(Gauge::new(40).unwrap().to_string(), "gauge(40)");
    }

    #[test]
    fn free_fns_work() {
        assert_eq!(double_it(21), 42);
        assert_eq!(greet("rust"), "hello rust");
        assert_eq!(checked_parse(" 7 ").unwrap(), 7);
        assert!(checked_parse("x").is_err());
    }

    #[test]
    fn optional_returns() {
        let c = RustyCounter::new(42);
        assert_eq!(c.half(), Some(21));
        assert_eq!(c.ratio(2), Some(21.0));
        assert_eq!(c.ratio(0), None);
        assert_eq!(c.maybe_label(), Some("v42".to_string()));
        assert_eq!(RustyCounter::new(7).half(), None);
        assert_eq!(RustyCounter::new(0).maybe_label(), None);
        assert_eq!(parse_even(" 8 "), Some(8));
        assert_eq!(parse_even("7"), None);
    }

    #[test]
    fn optional_params() {
        let mut c = RustyCounter::new(10);
        assert_eq!(c.bump(Some(5)), 15);
        assert_eq!(c.bump(None), 16);
        assert_eq!(tag(Some("x".to_string())), "[x]");
        assert_eq!(tag(None), "[none]");
    }

    #[test]
    fn class_ref_param() {
        assert_eq!(RustyCounter::new(42).diff(&RustyCounter::new(10)), 32);
    }

    #[test]
    fn shared_doc_arc_semantics() {
        let before = shared_drop_count();
        let a = SharedDoc::create("x");
        let b = dup_doc(a.clone());
        assert!(a.same_as(b.clone()));
        assert_eq!(b.label(), "x");
        drop(a);
        assert_eq!(shared_drop_count(), before);
        drop(b);
        assert_eq!(shared_drop_count(), before + 1);
    }

    #[test]
    fn json_helpers_work() {
        let v = serde_json::json!({ "items": [1, 2, 3] });
        assert_eq!(json_echo(v.clone()), v);
        assert_eq!(json_tally(v.clone())["total"], serde_json::json!(6));
        assert!(json_tally(v.clone())["hasItems"].as_bool().unwrap());
        assert_eq!(json_pick(v, "items").unwrap(), serde_json::json!([1, 2, 3]));
        assert!(json_pick(serde_json::json!({}), "zz").is_err());
        assert_eq!(RustyCounter::new(42).snapshot(serde_json::json!({ "t": 1 }))["value"], serde_json::json!(42));
    }
}

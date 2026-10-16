// embind frees an object when JavaScript's handle to it is collected only behind a smart pointer. A value a call
// returns, which embind copied for JavaScript, and an object JavaScript made through a raw constructor (a vector, a
// Rust class) were freed by .delete() alone, though they are as much JavaScript's own. This rewrite marks both on the
// count a handle shares with its clones and gives them the same finalizer. A copy is known only where its converter
// makes the handle, since embind then types the handle as a pointer to the object's own class. A raw pointer stays
// its library's. The debug glue's leak warning goes: a collected handle is freed by design. Without
// FinalizationRegistry (Hermes) nothing is registered, as before.

// The release glue spells each on one line, the debug glue one statement per line with comments.
const FINALIZER = /if\s*\(hasSmartPtr\)\s*\{[\s\S]*?finalizationRegistry\.register\(handle,\s*info,\s*handle\);?/;
const OWNED_FINALIZER = 'if(hasSmartPtr||$$.count.owned){finalizationRegistry.register(handle,{$$},handle);';
const LEAK_WARNING = /console\.warn\(info\.leakWarning\);?\s*/;
const FROM_WIRE = /function RegisteredPointer_fromWireType\(ptr\)\s*\{/g;
const OWN_FROM_WIRE = 'function crossbindOwnHandle(handle){var $$=handle.$$;if(!$$.smartPtr&&!$$.count.owned){$$.count.owned=true;'
    + 'if(finalizationRegistry)finalizationRegistry.register(handle,{$$},handle)}return handle}'
    + 'function RegisteredPointer_fromWireType(ptr){var handle=crossbindHandleFromWire.call(this,ptr);'
    + 'return this.isReference&&handle?crossbindOwnHandle(handle):handle}'
    + 'function crossbindHandleFromWire(ptr){';
const CONSTRUCTED = /return body\.apply\(this,\s*args\);?/g;
const OWN_CONSTRUCTED = 'return crossbindOwnHandle(body.apply(this,args));';

const count = (text, pattern) => text.match(pattern)?.length ?? 0;

// Returns the rewritten glue and whether it holds embind classes this rewrite does not recognise.
export function releaseOwnedHandles(glue) {
    if (!glue.includes('attachFinalizer')) return { text: glue, missed: false };
    const recognised = count(glue, FROM_WIRE) === 1 && count(glue, CONSTRUCTED) === 1;
    // Functions, not strings: `$$` in a replacement string is a lone `$`.
    const text = glue
        .replace(FINALIZER, () => OWNED_FINALIZER)
        .replace(LEAK_WARNING, '')
        .replace(FROM_WIRE, () => OWN_FROM_WIRE)
        .replace(CONSTRUCTED, () => OWN_CONSTRUCTED);
    return { text, missed: !recognised || !text.includes(OWNED_FINALIZER) };
}

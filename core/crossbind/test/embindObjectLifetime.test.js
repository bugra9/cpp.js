import { describe, test, expect, afterEach } from 'vitest';
import { releaseOwnedHandles } from '../src/utils/embindObjectLifetime.js';

// attachFinalizer, the converter that makes a handle for a value C++ hands over, and the end of a class constructor,
// as emscripten 6.0.9 writes them into a release glue (the converter's body cut down to its last step).
const RELEASE = 'var finalizationRegistry=false;var detachFinalizer=handle=>{};'
    + 'var attachFinalizer=handle=>{if(!globalThis.FinalizationRegistry){attachFinalizer=handle=>handle;return handle}'
    + 'finalizationRegistry=new FinalizationRegistry(info=>{releaseClassHandle(info.$$);});'
    + 'attachFinalizer=handle=>{var $$=handle.$$;var hasSmartPtr=!!$$.smartPtr;if(hasSmartPtr){var info={$$};'
    + 'finalizationRegistry.register(handle,info,handle);}return handle};'
    + 'detachFinalizer=handle=>finalizationRegistry.unregister(handle);return attachFinalizer(handle)};'
    + 'function RegisteredPointer_fromWireType(ptr){return attachFinalizer({$$:ptr})}'
    + 'var constructor=function(...args){var body=registeredClass.constructor_body[args.length];'
    + 'if(undefined===body){throw new BindingError(`no constructor`)}return body.apply(this,args)};';

// The same code in the debug glue, which builds a leak warning for each handle it registers and prints it when the
// handle is collected (comments dropped).
const DEBUG = [
    'var finalizationRegistry = false;',
    'var detachFinalizer = (handle) => {};',
    'var attachFinalizer = (handle) => {',
    '    if (!globalThis.FinalizationRegistry) {',
    '      attachFinalizer = (handle) => handle;',
    '      return handle;',
    '    }',
    '    finalizationRegistry = new FinalizationRegistry((info) => {',
    '      console.warn(info.leakWarning);',
    '      releaseClassHandle(info.$$);',
    '    });',
    '    attachFinalizer = (handle) => {',
    '      var $$ = handle.$$;',
    '      var hasSmartPtr = !!$$.smartPtr;',
    '      if (hasSmartPtr) {',
    '        // We should not call the destructor on raw pointers in case other code expects the pointee to live',
    '        var info = { $$: $$ };',
    '        var cls = $$.ptrType.registeredClass;',
    '        var err = new Error(`Embind found a leaked C++ instance ${cls.name} <${ptrToString($$.ptr)}>.',
    'Make sure to invoke .delete() manually once you\'re done with the instance instead.',
    'Originally allocated`);',
    "        if ('captureStackTrace' in Error) {",
    '          Error.captureStackTrace(err, RegisteredPointer_fromWireType);',
    '        }',
    "        info.leakWarning = err.stack.replace(/^Error: /, '');",
    '        finalizationRegistry.register(handle, info, handle);',
    '      }',
    '      return handle;',
    '    };',
    '    detachFinalizer = (handle) => finalizationRegistry.unregister(handle);',
    '    return attachFinalizer(handle);',
    '  };',
    'function RegisteredPointer_fromWireType(ptr) {',
    '    return attachFinalizer({ $$: ptr });',
    '  }',
    'var constructor = function(...args) {',
    '    var body = registeredClass.constructor_body[args.length];',
    '    if (undefined === body) {',
    '      throw new BindingError(`no constructor`);',
    '    }',
    '    return body.apply(this, args);',
    '  };',
].join('\n');

const originalRegistry = globalThis.FinalizationRegistry;

afterEach(() => {
    globalThis.FinalizationRegistry = originalRegistry;
});

// Runs a glue with a FinalizationRegistry that records what it is given (none at all, as on Hermes, without
// `registry`). A converter is `this` to fromWireType: `isReference` on the one for a value C++ returns by copy.
function load(glue, { registry = true } = {}) {
    const registered = [];
    const released = [];
    const warnings = [];
    globalThis.FinalizationRegistry = registry ? class {
        constructor(cleanup) {
            this.cleanup = cleanup;
        }

        register(target, held) {
            registered.push({ target, held, cleanup: this.cleanup });
        }
    } : undefined;
    const registeredClass = { constructor_body: {} };
    const glueApi = new Function('registeredClass', 'releaseClassHandle', 'console', `${glue}\nreturn { attachFinalizer, RegisteredPointer_fromWireType, constructor };`)(
        registeredClass,
        ($$) => released.push($$),
        { warn: (text) => warnings.push(text) },
    );
    return {
        registered,
        released,
        warnings,
        targets: () => registered.map(({ target }) => target),
        copied: (record) => glueApi.RegisteredPointer_fromWireType.call({ isReference: true }, record),
        pointedAt: (record) => glueApi.RegisteredPointer_fromWireType.call({ isReference: false }, record),
        clone: (handle) => glueApi.attachFinalizer({ $$: { ...handle.$$ } }),
        construct: (record) => {
            registeredClass.constructor_body[0] = () => glueApi.attachFinalizer({ $$: record });
            return new glueApi.constructor();
        },
    };
}

const smartPointer = () => ({ smartPtr: 8, ptr: 16, count: { value: 1 } });
const rawObject = () => ({ ptr: 16, count: { value: 1 } });

describe.each([['release', RELEASE], ['debug', DEBUG]])('in a %s glue', (_, glue) => {
    const rewritten = releaseOwnedHandles(glue);

    test('the rewrite applies and drops the leak warning', () => {
        expect(rewritten.missed).toBe(false);
        expect(rewritten.text).not.toContain('leakWarning');
    });

    test('a handle behind a smart pointer is released when it is collected, as before', () => {
        const glueApi = load(rewritten.text);
        const shared = glueApi.pointedAt(smartPointer());

        expect(glueApi.targets()).toEqual([shared]);
        const { cleanup, held } = glueApi.registered[0];
        cleanup(held);
        expect(glueApi.released).toEqual([shared.$$]);
        expect(glueApi.warnings).toEqual([]);
    });

    test('a copy embind made of a returned value is released, and so is a clone of its handle', () => {
        const glueApi = load(rewritten.text);
        const copy = glueApi.copied(rawObject());
        const clone = glueApi.clone(copy);

        expect(copy.$$.count.owned).toBe(true);
        expect(glueApi.targets()).toEqual([copy, clone]);
    });

    test('a raw pointer stays its library\'s', () => {
        const glueApi = load(rewritten.text);
        glueApi.pointedAt(rawObject());

        expect(glueApi.targets()).toEqual([]);
    });

    test('an object constructed through a raw constructor is released, and so is a clone of its handle', () => {
        const glueApi = load(rewritten.text);
        const made = glueApi.construct(rawObject());
        const clone = glueApi.clone(made);

        expect(made.$$.count.owned).toBe(true);
        expect(glueApi.targets()).toEqual([made, clone]);
    });

    test('an object constructed behind a smart pointer is registered once', () => {
        const glueApi = load(rewritten.text);
        const made = glueApi.construct(smartPointer());

        expect(glueApi.targets()).toEqual([made]);
    });

    test('without FinalizationRegistry, as on Hermes, values and constructors work as before', () => {
        const glueApi = load(rewritten.text, { registry: false });

        expect(glueApi.construct(rawObject()).$$.ptr).toBe(16);
        expect(glueApi.copied(rawObject()).$$.ptr).toBe(16);
        expect(glueApi.targets()).toEqual([]);
    });
});

test('a glue whose embind classes the rewrite does not recognise is reported', () => {
    expect(releaseOwnedHandles('var attachFinalizer=handle=>handle;return body.apply(this,args)').missed).toBe(true);
});

test('a glue without embind classes is left as it is', () => {
    const glue = 'var x=1;';
    expect(releaseOwnedHandles(glue)).toEqual({ text: glue, missed: false });
});

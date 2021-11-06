var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "jest", "./unify"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("jest");
    var unify_1 = require("./unify");
    test('groundJsonNoSharing', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(7), 2), _b = __read(_a[0], 7), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], A = _b[4], B = _b[5], U = _b[6], sub = _a[1];
        var s = sub.bind(X, { foo: 1, bar: void (0), baz: [1, 2], quux: {} });
        s = s.bind(B, 1);
        s = s.bind(Y, [1, void (0), [1, 2], {}]);
        s = s.bind(Z, { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
        s = s.bind(W, [1, void (0), [1, 2], {}, X, Y, B, U]);
        s = s.bind(A, [W, Z]);
        expect((0, unify_1.groundJsonNoSharing)(A, s)).toEqual([
            [1, void (0), [1, 2], {}, { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, [1, void (0), [1, 2], {}], 1, U],
            { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, arrVar: [1, void (0), [1, 2], {}], primVar: 1, unboundVar: U }
        ]);
    });
    test('groundJson', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(7), 2), _b = __read(_a[0], 7), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], A = _b[4], B = _b[5], U = _b[6], sub = _a[1];
        var s = sub.bind(X, { foo: 1, bar: void (0), baz: [1, 2], quux: {} });
        s = s.bind(B, 1);
        s = s.bind(Y, [1, void (0), [1, 2], {}]);
        s = s.bind(Z, { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
        s = s.bind(W, [1, void (0), [1, 2], {}, X, Y, B, U]);
        s = s.bind(A, [W, Z]);
        expect((0, unify_1.groundJson)(A, s)).toEqual([
            [1, void (0), [1, 2], {}, { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, [1, void (0), [1, 2], {}], 1, U],
            { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, arrVar: [1, void (0), [1, 2], {}], primVar: 1, unboundVar: U }
        ]);
    });
    test('completelyGroundJson success', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(6), 2), _b = __read(_a[0], 6), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], A = _b[4], B = _b[5], sub = _a[1];
        var s = sub.bind(X, { foo: 1, bar: void (0), baz: [1, 2], quux: {} });
        s = s.bind(B, 1);
        s = s.bind(Y, [1, void (0), [1, 2], {}]);
        s = s.bind(Z, { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: X, arrVar: Y, primVar: B });
        s = s.bind(W, [1, void (0), [1, 2], {}, X, Y, B]);
        s = s.bind(A, [W, Z]);
        expect((0, unify_1.completelyGroundJson)(A, s)).toEqual([
            [1, void (0), [1, 2], {}, { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, [1, void (0), [1, 2], {}], 1],
            { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: { foo: 1, bar: void (0), baz: [1, 2], quux: {} }, arrVar: [1, void (0), [1, 2], {}], primVar: 1 }
        ]);
    });
    test('completelyGroundJson unbound variables', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(7), 2), _b = __read(_a[0], 7), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], A = _b[4], B = _b[5], U = _b[6], sub = _a[1];
        var s = sub.bind(X, { foo: 1, bar: void (0), baz: [1, 2], quux: {} });
        s = s.bind(B, 1);
        s = s.bind(Y, [1, void (0), [1, 2], {}]);
        s = s.bind(Z, { foo: 1, bar: void (0), baz: [1, 2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
        s = s.bind(W, [1, void (0), [1, 2], {}, X, Y, B, U]);
        s = s.bind(A, [W, Z]);
        expect(function () { return (0, unify_1.completelyGroundJson)(A, s); }).toThrow('completelyGroundJson: term contains unbound variables');
    });
    test('refreshJson simple linear', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(4), 2), _b = __read(_a[0], 4), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], sub = _a[1];
        var _c = __read((0, unify_1.refreshJson)([Z, W], sub), 2), t = _c[0], subResult = _c[1];
        var _d = __read(subResult.freshVar(), 2), v = _d[0], _ = _d[1];
        expect([t, v]).toEqual([
            [new unify_1.Variable(4), new unify_1.Variable(5)],
            new unify_1.Variable(6)
        ]);
    });
    test('refreshJson simple non-linear', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(4), 2), _b = __read(_a[0], 4), X = _b[0], Y = _b[1], Z = _b[2], W = _b[3], sub = _a[1];
        var _c = __read((0, unify_1.refreshJson)([Z, Z], sub), 2), t = _c[0], subResult = _c[1];
        var _d = __read(subResult.freshVar(), 2), v = _d[0], _ = _d[1];
        expect([t, v]).toEqual([
            [new unify_1.Variable(4), new unify_1.Variable(4)],
            new unify_1.Variable(5)
        ]);
    });
    test('lookup undefined', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().freshVar(), 2), X = _a[0], sub = _a[1];
        var s = sub.bind(X, void (0));
        expect(s.lookupAsVar(X)).toBe(void (0));
    });
    test('simple lookup unbound', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().freshVar(), 2), X = _a[0], sub = _a[1];
        expect(typeof sub.lookup(X)).toBe('number');
    });
    test('simple lookup bound', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().freshVar(), 2), X = _a[0], sub = _a[1];
        var s = sub.bind(X, 'foo');
        expect(s.lookup(X)).toBe('foo');
    });
    test('persistence test', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().freshVar(), 2), X = _a[0], sub = _a[1];
        var s = sub.bind(X, 'foo');
        expect(s.lookup(X)).toBe('foo');
        expect(typeof sub.lookup(X)).toBe('number');
    });
    test('unify unbound', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
        var s = sub.unifyVar(X, Y);
        expect(s).not.toBeNull();
        expect(sub.lookup(X)).not.toEqual(sub.lookup(Y));
        expect(s.lookup(X)).toEqual(s.lookup(Y));
    });
    test('unify then bind', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
        var s = sub.unifyVar(X, Y);
        expect(s).not.toBeNull();
        s = s.bind(X, 'foo');
        expect(s.lookup(X)).toBe('foo');
        expect(s.lookup(Y)).toBe('foo');
    });
    test('bind then unify', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
        var s = sub.bind(X, 'foo');
        s = s.unifyVar(X, Y);
        expect(s).not.toBeNull();
        expect(s.lookup(X)).toBe('foo');
        expect(s.lookup(Y)).toBe('foo');
    });
    test('unification failed', function () {
        var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
        var s = sub.bind(X, 'foo');
        s = s.bind(Y, 'bar');
        var s2 = s.unifyVar(X, Y);
        expect(s2).toBeNull();
        expect(s.lookup(X)).toBe('foo');
        expect(s.lookup(Y)).toBe('bar');
    });
});
//# sourceMappingURL=unify.spec.js.map
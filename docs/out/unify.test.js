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
//# sourceMappingURL=unify.test.js.map
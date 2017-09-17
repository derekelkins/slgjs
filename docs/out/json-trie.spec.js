var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
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
        define(["require", "exports", "./unify", "./json-trie", "jest"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unify_1 = require("./unify");
    var json_trie_1 = require("./json-trie");
    require("jest");
    describe('JsonTrie tests', function () {
        var trie = json_trie_1.JsonTrie.create();
        trie.insert([null, { start: 1, end: 2 }], void (0));
        trie.insert([null, { start: 1, end: 3 }], 1);
        trie.insert(['foo', { start: 1, end: 3 }], 2);
        trie.insert({ start: 1, end: 2 }, 3);
        trie.insert({ start: 1, end: 3 }, 4);
        trie.insert([1, 2], 5);
        trie.insert([1, 3], 6);
        trie.insert({}, 7);
        trie.insert({ foo: { start: 1, end: 2 }, end: 3 }, 8);
        trie.insert({ foo: { start: 1, end: 3 }, end: 3 }, 9);
        test('successful lookup', function () {
            expect(trie.lookup([1, 2])).toBe(5);
        });
        test('successful undefined lookup', function () {
            expect(trie.lookup([null, { start: 1, end: 2 }])).toBeUndefined();
        });
        test('successful undefined contains', function () {
            expect(trie.contains([null, { start: 1, end: 2 }])).toBeTruthy();
        });
        test('unsuccessful lookup', function () {
            expect(trie.lookup([1, 5])).toBeUndefined();
        });
        test('unsuccessful contains', function () {
            expect(trie.contains([1, 5])).toBeFalsy();
        });
        test('successful array lookup', function () {
            expect(trie.contains([1, 2])).toBeTruthy();
        });
        test('unsuccessful array lookup', function () {
            expect(trie.contains([1, 4])).not.toBeTruthy();
        });
        test('successful object lookup', function () {
            expect(trie.contains({ start: 1, end: 3 })).toBeTruthy();
        });
        test('unsuccessful object lookup', function () {
            expect(trie.contains({ start: 2, end: 3 })).not.toBeTruthy();
        });
        test('successful complex lookup', function () {
            expect(trie.contains(['foo', { start: 1, end: 3 }])).toBeTruthy();
        });
        test('unsuccessful complex lookup', function () {
            expect(trie.contains(['foo', { start: 2, end: 3 }])).not.toBeTruthy();
        });
        test('correct number of entries', function () {
            var rows = [];
            try {
                for (var _a = __values(trie.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var row = _b.value;
                    rows.push(row);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            expect(rows.length).toBe(10);
            var e_1, _c;
        });
        test('correct number of entries, entriesCont', function () {
            var rows = [];
            trie.entriesCont(function (row) { rows.push(row); });
            expect(rows.length).toBe(10);
        });
        test('match object pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            try {
                for (var _c = __values(trie.match({ start: X, end: Y }, sub)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var s = _d.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_e = _c.return)) _e.call(_c);
                }
                finally { if (e_2) throw e_2.error; }
            }
            expect(matches).toEqual([
                [1, 2],
                [1, 3]
            ]);
            var e_2, _e;
        });
        test('match array pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            try {
                for (var _c = __values(trie.match([X, Y], sub)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var s = _d.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_e = _c.return)) _e.call(_c);
                }
                finally { if (e_3) throw e_3.error; }
            }
            expect(matches).toEqual([
                [null, { end: 2, start: 1 }],
                [null, { end: 3, start: 1 }],
                ['foo', { end: 3, start: 1 }],
                [1, 2],
                [1, 3]
            ]);
            var e_3, _e;
        });
        test('match nonlinear pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            try {
                for (var _c = __values(trie.match({ foo: { start: X, end: Y }, end: Y }, sub)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var s = _d.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_e = _c.return)) _e.call(_c);
                }
                finally { if (e_4) throw e_4.error; }
            }
            expect(matches).toEqual([
                [1, 3]
            ]);
            var e_4, _e;
        });
        test('matchCont object pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            trie.matchCont({ start: X, end: Y }, sub, function (s) {
                matches.push([s.lookup(X), s.lookup(Y)]);
            });
            expect(matches).toEqual([
                [1, 2],
                [1, 3]
            ]);
        });
        test('matchCont array pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            trie.matchCont([X, Y], sub, function (s) {
                matches.push([s.lookup(X), s.lookup(Y)]);
            });
            expect(matches).toEqual([
                [null, { end: 2, start: 1 }],
                [null, { end: 3, start: 1 }],
                ['foo', { end: 3, start: 1 }],
                [1, 2],
                [1, 3]
            ]);
        });
        test('matchCont nonlinear pattern', function () {
            var matches = [];
            var _a = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _b = __read(_a[0], 2), X = _b[0], Y = _b[1], sub = _a[1];
            trie.matchCont({ foo: { start: X, end: Y }, end: Y }, sub, function (s) {
                matches.push([s.lookup(X), s.lookup(Y)]);
            });
            expect(matches).toEqual([
                [1, 3]
            ]);
        });
    });
    describe('JsonTrieTerm tests', function () {
        var trie = json_trie_1.JsonTrieTerm.create();
        trie.insert([null, { start: 1, end: 2 }], void (0));
        trie.insert([null, { start: 1, end: 3 }], 1);
        trie.insert(['foo', { start: 1, end: 3 }], 2);
        trie.insert({ start: 1, end: 2 }, 3);
        trie.insert({ start: 1, end: 3 }, 4);
        trie.insert([1, 2], 5);
        trie.insert([1, 3], 6);
        trie.insert({}, 7);
        trie.insert({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, 8);
        test('successful lookup', function () {
            expect(trie.lookup([1, 2])).toBe(5);
        });
        test('successful undefined lookup', function () {
            expect(trie.lookup([null, { start: 1, end: 2 }])).toBeUndefined();
        });
        test('successful undefined contains', function () {
            expect(trie.contains([null, { start: 1, end: 2 }])).toBeTruthy();
        });
        test('unsuccessful lookup', function () {
            expect(trie.lookup([1, 5])).toBeUndefined();
        });
        test('unsuccessful contains', function () {
            expect(trie.contains([1, 5])).toBeFalsy();
        });
        test('successful array lookup', function () {
            expect(trie.contains([1, 2])).toBeTruthy();
        });
        test('unsuccessful array lookup', function () {
            expect(trie.contains([1, 4])).not.toBeTruthy();
        });
        test('successful object lookup', function () {
            expect(trie.contains({ start: 1, end: 3 })).toBeTruthy();
        });
        test('unsuccessful object lookup', function () {
            expect(trie.contains({ start: 2, end: 3 })).not.toBeTruthy();
        });
        test('successful complex lookup', function () {
            expect(trie.contains(['foo', { start: 1, end: 3 }])).toBeTruthy();
        });
        test('unsuccessful complex lookup', function () {
            expect(trie.contains(['foo', { start: 2, end: 3 }])).not.toBeTruthy();
        });
        test('successful non-linear variant lookup matching variables', function () {
            expect(trie.contains({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) })).toBeTruthy();
        });
        test('unsuccessful non-linear variant lookup first variable doesn\'t match', function () {
            expect(trie.contains({ foo: new unify_1.Variable(1), bar: new unify_1.Variable(0) })).not.toBeTruthy();
        });
        test('unsuccessful non-linear variant lookup first variable matches', function () {
            expect(trie.contains({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(1) })).not.toBeTruthy();
        });
        test('successful non-linear variant lookup unmatching variables', function () {
            expect(trie.contains({ foo: new unify_1.Variable(1), bar: new unify_1.Variable(1) })).toBeTruthy();
        });
        test('correct number of entries', function () {
            var rows = [];
            try {
                for (var _a = __values(trie.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var row = _b.value;
                    rows.push(row);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_5) throw e_5.error; }
            }
            expect(rows.length).toBe(9);
            var e_5, _c;
        });
        test('correct number of entries, entriesCont', function () {
            var rows = [];
            trie.entriesCont(function (row) { rows.push(row); });
            expect(rows.length).toBe(9);
        });
    });
});
//# sourceMappingURL=json-trie.spec.js.map
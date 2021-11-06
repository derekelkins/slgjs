var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
    function makeTestJsonTrie() {
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
        return trie;
    }
    describe('JsonTrie tests', function () {
        var trie = makeTestJsonTrie();
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
            var e_1, _a;
            var rows = [];
            try {
                for (var _b = __values(trie.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var row = _c.value;
                    rows.push(row);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            expect(rows.length).toBe(10);
        });
        test('correct number of entries, entriesCont', function () {
            var rows = [];
            trie.entriesCont(function (k, v) { rows.push([k, v]); });
            expect(rows).toEqual([
                [[null, { end: 2, start: 1 }], void (0)],
                [[null, { end: 3, start: 1 }], 1],
                [['foo', { end: 3, start: 1 }], 2],
                [[1, 2], 5],
                [[1, 3], 6],
                [{}, 7],
                [{ end: 2, start: 1 }, 3],
                [{ end: 3, start: 1 }, 4],
                [{ end: 3, foo: { end: 2, start: 1 } }, 8],
                [{ end: 3, foo: { end: 3, start: 1 } }, 9]
            ]);
        });
        test('match object pattern', function () {
            var e_2, _a;
            var matches = [];
            var _b = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _c = __read(_b[0], 2), X = _c[0], Y = _c[1], sub = _b[1];
            try {
                for (var _d = __values(trie.match({ start: X, end: Y }, sub)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var s = _e.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_2) throw e_2.error; }
            }
            expect(matches).toEqual([
                [1, 2],
                [1, 3]
            ]);
        });
        test('match array pattern', function () {
            var e_3, _a;
            var matches = [];
            var _b = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _c = __read(_b[0], 2), X = _c[0], Y = _c[1], sub = _b[1];
            try {
                for (var _d = __values(trie.match([X, Y], sub)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var s = _e.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
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
        });
        test('match nonlinear pattern', function () {
            var e_4, _a;
            var matches = [];
            var _b = __read(unify_1.Substitution.emptyPersistent().fresh(2), 2), _c = __read(_b[0], 2), X = _c[0], Y = _c[1], sub = _b[1];
            try {
                for (var _d = __values(trie.match({ foo: { start: X, end: Y }, end: Y }, sub)), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var s = _e.value;
                    matches.push([s.lookup(X), s.lookup(Y)]);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_4) throw e_4.error; }
            }
            expect(matches).toEqual([
                [1, 3]
            ]);
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
        test('double insert', function () {
            var localTrie = json_trie_1.JsonTrie.create();
            localTrie.insert(null, false);
            localTrie.insert(null, true);
            var rows = [];
            localTrie.entriesCont(function (k, v) { rows.push([k, v]); });
            expect(rows).toEqual([
                [null, true],
            ]);
        });
        test('modify test', function () {
            var localTrie = makeTestJsonTrie();
            localTrie.modify([null, { start: 1, end: 2 }], function () { return 100; });
            localTrie.modify(['foo', { start: 1, end: 3 }], function () { return 100; });
            localTrie.modify({ start: 1, end: 2 }, function () { return 100; });
            localTrie.modify([1, 3], function (x) { return x + 100; });
            localTrie.modify({}, function () { return 100; });
            localTrie.modify({ foo: { start: 1, end: 3 }, end: 3 }, function () { return 100; });
            var results = [];
            localTrie.entriesCont(function (k, v) { return results.push([k, v]); });
            expect(results).toEqual([
                [[null, { end: 2, start: 1 }], 100],
                [[null, { end: 3, start: 1 }], 1],
                [['foo', { end: 3, start: 1 }], 100],
                [[1, 2], 5],
                [[1, 3], 106],
                [{}, 100],
                [{ end: 2, start: 1 }, 100],
                [{ end: 3, start: 1 }, 4],
                [{ end: 3, foo: { end: 2, start: 1 } }, 8],
                [{ end: 3, foo: { end: 3, start: 1 } }, 100]
            ]);
        });
        test('modify insert test', function () {
            var localTrie = makeTestJsonTrie();
            localTrie.modify([1, 9], function () { return 100; });
            var results = [];
            localTrie.entriesCont(function (k, v) { return results.push([k, v]); });
            expect(results).toEqual([
                [[null, { end: 2, start: 1 }], void (0)],
                [[null, { end: 3, start: 1 }], 1],
                [['foo', { end: 3, start: 1 }], 2],
                [[1, 2], 5],
                [[1, 3], 6],
                [[1, 9], 100],
                [{}, 7],
                [{ end: 2, start: 1 }, 3],
                [{ end: 3, start: 1 }, 4],
                [{ end: 3, foo: { end: 2, start: 1 } }, 8],
                [{ end: 3, foo: { end: 3, start: 1 } }, 9]
            ]);
        });
        test('minus test', function () {
            var localTrie = makeTestJsonTrie();
            var minusTrie = json_trie_1.JsonTrie.create();
            minusTrie.insert([null, { start: 1, end: 2 }], null);
            minusTrie.insert(['foo', { start: 1, end: 3 }], null);
            minusTrie.insert({ start: 1, end: 2 }, null);
            minusTrie.insert([1, 3], null);
            minusTrie.insert({}, null);
            minusTrie.insert({ foo: { start: 1, end: 3 }, end: 3 }, null);
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([
                [null, { start: 1, end: 3 }],
                [1, 2],
                { start: 1, end: 3 },
                { foo: { start: 1, end: 2 }, end: 3 }
            ]);
        });
        test('minus extra keys', function () {
            var localTrie = makeTestJsonTrie();
            var minusTrie = json_trie_1.JsonTrie.create();
            minusTrie.insert([null, { start: 1, end: 2 }], null);
            minusTrie.insert(['foo', { start: 1, end: 3 }], null);
            minusTrie.insert(['foo', { start: 1, end: 4 }], null);
            minusTrie.insert({ start: 1, end: 2 }, null);
            minusTrie.insert([1, 3], null);
            minusTrie.insert([1, 4], null);
            minusTrie.insert({}, null);
            minusTrie.insert({ foo: { start: 1, end: 3 }, end: 3 }, null);
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([
                [null, { start: 1, end: 3 }],
                [1, 2],
                { start: 1, end: 3 },
                { foo: { start: 1, end: 2 }, end: 3 }
            ]);
        });
        test('minus all', function () {
            var localTrie = makeTestJsonTrie();
            var minusTrie = makeTestJsonTrie();
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([]);
        });
    });
    function makeTestJsonTrieTerm() {
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
        return trie;
    }
    describe('JsonTrieTerm tests', function () {
        var trie = makeTestJsonTrieTerm();
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
            var e_5, _a;
            var rows = [];
            try {
                for (var _b = __values(trie.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var row = _c.value;
                    rows.push(row);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
            expect(rows.length).toBe(9);
        });
        test('correct number of entries, entriesCont', function () {
            var rows = [];
            trie.entriesCont(function (row) { rows.push(row); });
            expect(rows.length).toBe(9);
        });
        test('double insert', function () {
            var localTrie = json_trie_1.JsonTrieTerm.create();
            localTrie.insert(null, false);
            localTrie.insert(null, true);
            var rows = [];
            localTrie.entriesCont(function (k, v) { rows.push([k, v]); });
            expect(rows).toEqual([
                [null, true],
            ]);
        });
        test('modify test', function () {
            var localTrie = makeTestJsonTrieTerm();
            localTrie.modify([null, { start: 1, end: 2 }], function () { return 100; });
            localTrie.modify(['foo', { start: 1, end: 3 }], function () { return 100; });
            localTrie.modify({ start: 1, end: 2 }, function () { return 100; });
            localTrie.modify([1, 3], function (x) { return x + 100; });
            localTrie.modify({}, function () { return 100; });
            localTrie.modify({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, function () { return 100; });
            var results = [];
            localTrie.entriesCont(function (k, v) { return results.push([k, v]); });
            expect(results).toEqual([
                [[null, { end: 2, start: 1 }], 100],
                [[null, { end: 3, start: 1 }], 1],
                [['foo', { end: 3, start: 1 }], 100],
                [[1, 2], 5],
                [[1, 3], 106],
                [{}, 100],
                [{ end: 2, start: 1 }, 100],
                [{ end: 3, start: 1 }, 4],
                [{ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, 100]
            ]);
        });
        test('modify insert test', function () {
            var localTrie = makeTestJsonTrieTerm();
            localTrie.modify([1, 9], function () { return 100; });
            var results = [];
            localTrie.entriesCont(function (k, v) { return results.push([k, v]); });
            expect(results).toEqual([
                [[null, { end: 2, start: 1 }], void (0)],
                [[null, { end: 3, start: 1 }], 1],
                [['foo', { end: 3, start: 1 }], 2],
                [[1, 2], 5],
                [[1, 3], 6],
                [[1, 9], 100],
                [{}, 7],
                [{ end: 2, start: 1 }, 3],
                [{ end: 3, start: 1 }, 4],
                [{ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, 8]
            ]);
        });
        test('minus test', function () {
            var localTrie = makeTestJsonTrieTerm();
            var minusTrie = json_trie_1.JsonTrieTerm.create();
            minusTrie.insert([null, { start: 1, end: 2 }], null);
            minusTrie.insert(['foo', { start: 1, end: 3 }], null);
            minusTrie.insert({ start: 1, end: 2 }, null);
            minusTrie.insert([1, 3], null);
            minusTrie.insert({}, null);
            minusTrie.insert({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, null);
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([
                [null, { start: 1, end: 3 }],
                [1, 2],
                { start: 1, end: 3 }
            ]);
        });
        test('minus extra keys', function () {
            var localTrie = makeTestJsonTrieTerm();
            var minusTrie = json_trie_1.JsonTrieTerm.create();
            minusTrie.insert([null, { start: 1, end: 2 }], null);
            minusTrie.insert(['foo', { start: 1, end: 3 }], null);
            minusTrie.insert(['foo', { start: 1, end: 4 }], null);
            minusTrie.insert({ start: 1, end: 2 }, null);
            minusTrie.insert([1, 3], null);
            minusTrie.insert([1, 4], null);
            minusTrie.insert({}, null);
            minusTrie.insert({ foo: new unify_1.Variable(0), bar: new unify_1.Variable(0) }, null);
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([
                [null, { start: 1, end: 3 }],
                [1, 2],
                { start: 1, end: 3 }
            ]);
        });
        test('minus all', function () {
            var localTrie = makeTestJsonTrieTerm();
            var minusTrie = makeTestJsonTrieTerm();
            var results = [];
            localTrie.minus(minusTrie).entriesCont(function (k) { return results.push(k); });
            expect(results).toEqual([]);
        });
    });
});
//# sourceMappingURL=json-trie.spec.js.map
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
        define(["require", "exports", "jest", "./unify", "./slg"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("jest");
    var unify_1 = require("./unify");
    var slg_1 = require("./slg");
    describe('non-monotonic aggregation', function () {
        test('non-ground results throw an error', function () {
            var p = new slg_1.TabledPredicate(function (X) { return slg_1.fresh(function (Y) { return slg_1.unify(X, Y); }); });
            expect(function () { return slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (X) { return p.count(X, Q); }); }); }).toThrow('completelyGroundJson: term contains unbound variables');
        });
        test('sum', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var fst = new slg_1.TabledPredicate(function (X) { return slg_1.fresh(function (Y) { return path.match([X, Y]); }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return fst.sum(S, Q); }); });
            expect(result).toEqual([6]);
        });
        test('min', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var fst = new slg_1.TabledPredicate(function (X) { return slg_1.fresh(function (Y) { return path.match([X, Y]); }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return fst.min(S, Q); }); });
            expect(result).toEqual([1]);
        });
        test('max', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var fst = new slg_1.TabledPredicate(function (X) { return slg_1.fresh(function (Y) { return path.match([X, Y]); }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return fst.max(S, Q); }); });
            expect(result).toEqual([3]);
        });
        test('count', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S, E) { return path.count([S, E], Q); }); });
            expect(result).toEqual([9]);
        });
        test('and true', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var p = new slg_1.TabledPredicate(function (Q) { return slg_1.clause(function (X, Y) { return [path.match([X, Y]), slg_1.apply(function (_a) {
                    var _b = __read(_a, 2), x = _b[0], _ = _b[1];
                    return x > 0;
                })([X, Y], Q)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return p.and(S, Q); }); });
            expect(result).toEqual([true]);
        });
        test('and false', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var p = new slg_1.TabledPredicate(function (Q) { return slg_1.clause(function (X, Y) { return [path.match([X, Y]), slg_1.apply(function (_a) {
                    var _b = __read(_a, 2), x = _b[0], y = _b[1];
                    return x === y;
                })([X, Y], Q)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return p.and(S, Q); }); });
            expect(result).toEqual([false]);
        });
        test('or true', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var p = new slg_1.TabledPredicate(function (Q) { return slg_1.clause(function (X, Y) { return [path.match([X, Y]), slg_1.apply(function (_a) {
                    var _b = __read(_a, 2), x = _b[0], y = _b[1];
                    return x === y;
                })([X, Y], Q)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return p.or(S, Q); }); });
            expect(result).toEqual([true]);
        });
        test('or false', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Z = _b[1];
                return slg_1.rule(function () { return [edge.match([X, Z])]; }, function (Y) { return [path.match([X, Y]), path.match([Y, Z])]; });
            });
            var p = new slg_1.TabledPredicate(function (Q) { return slg_1.clause(function (X, Y) { return [path.match([X, Y]), slg_1.apply(function (_a) {
                    var _b = __read(_a, 2), x = _b[0], _ = _b[1];
                    return x < 0;
                })([X, Y], Q)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.fresh(function (S) { return p.or(S, Q); }); });
            expect(result).toEqual([false]);
        });
    });
    describe('LRD-stratified negation', function () {
        test('LRD-stratified example', function () {
            var p = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [q.match(X), r.notMatch(X), s.notMatch(X)]; }); });
            var q = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [r.match(X), p.notMatch(X)]; }); });
            var r = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [p.match(X), q.notMatch(X)]; }); });
            var s = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [p.notMatch(X), q.notMatch(X), r.notMatch(X)]; }); });
            var results = slg_1.toArrayQ(function (Q) { return slg_1.conj(s.match(null), slg_1.unify(Q, true)); });
            expect(results).toEqual([true]);
        });
        test('non-LRD-stratified example', function () {
            var p = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [s.notMatch(X), r.notMatch(X), q.match(X)]; }); });
            var q = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [r.match(X), p.notMatch(X)]; }); });
            var r = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [p.match(X), q.notMatch(X)]; }); });
            var s = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [p.notMatch(X), q.notMatch(X), r.notMatch(X)]; }); });
            expect(function () { return slg_1.toArrayQ(function (Q) { return slg_1.conj(s.match(null), slg_1.unify(Q, true)); }); }).toThrow();
        });
        test('floundering', function () {
            var p = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return []; }); });
            expect(function () { return slg_1.toArrayQ(function (Q) { return slg_1.conj(p.notMatch(Q), slg_1.unify(Q, true)); }); }).toThrow('TabledPredicate.notMatch: negation of non-ground atom (floundering)');
        });
        test('non-trivial LRD-stratified example', function () {
            var p = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [slg_1.unify(X, 'a'), p.match('b'), p.notMatch('d')]; }, function () { return [slg_1.unify(X, 'b'), p.match('c')]; }, function () { return [slg_1.unify(X, 'b'), p.notMatch('d')]; }, function () { return [slg_1.unify(X, 'b')]; }, function () { return [slg_1.unify(X, 'b'), p.notMatch('a')]; }, function () { return [slg_1.unify(X, 'c'), p.match('b'), p.match('e')]; }, function () { return [slg_1.unify(X, 'd'), p.notMatch('c'), p.match('d')]; }, function () { return [slg_1.unify(X, 'e'), p.match('c')]; }, function () { return [slg_1.unify(X, 'e'), p.notMatch('b'), p.notMatch('e')]; }); });
            var results = slg_1.toArrayQ(function (Q) { return slg_1.conj(p.match('a'), slg_1.unify(Q, true)); });
            expect(results).toEqual([true]);
        });
    });
    describe('traditional Prolog append example', function () {
        test('untabled (which is preferable for this)', function () {
            var append = new slg_1.UntabledPredicate(function (_a) {
                var _b = __read(_a, 3), Xs = _b[0], Ys = _b[1], Zs = _b[2];
                return slg_1.rule(function () {
                    return [slg_1.unify([], Xs), slg_1.unify(Ys, Zs)];
                }, function (X1, Xs1, Zs1) {
                    return [slg_1.unify([X1, Xs1], Xs), slg_1.unify([X1, Zs1], Zs), append.match([Xs1, Ys, Zs1])];
                });
            });
            function list() {
                var xs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    xs[_i] = arguments[_i];
                }
                var ys = [];
                for (var i = xs.length - 1; i >= 0; --i) {
                    ys = [xs[i], ys];
                }
                return ys;
            }
            var results = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (L, R) { return [append.match([L, R, list(1, 2, 3, 4, 5)]), slg_1.unify(Q, [L, R])]; }); });
            expect(results).toEqual([
                [[], [1, [2, [3, [4, [5, []]]]]]],
                [[1, []], [2, [3, [4, [5, []]]]]],
                [[1, [2, []]], [3, [4, [5, []]]]],
                [[1, [2, [3, []]]], [4, [5, []]]],
                [[1, [2, [3, [4, []]]]], [5, []]],
                [[1, [2, [3, [4, [5, []]]]]], []]
            ]);
        });
        test('tabled (which is not recommended for this, but should still work)', function () {
            var append = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 3), Xs = _b[0], Ys = _b[1], Zs = _b[2];
                return slg_1.rule(function () {
                    return [slg_1.unify([], Xs), slg_1.unify(Ys, Zs)];
                }, function (X1, Xs1, Zs1) {
                    return [slg_1.unify([X1, Xs1], Xs), slg_1.unify([X1, Zs1], Zs), append.match([Xs1, Ys, Zs1])];
                });
            });
            function list() {
                var xs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    xs[_i] = arguments[_i];
                }
                var ys = [];
                for (var i = xs.length - 1; i >= 0; --i) {
                    ys = [xs[i], ys];
                }
                return ys;
            }
            var results = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (L, R) { return [append.match([L, R, list(1, 2, 3, 4, 5)]), slg_1.unify(Q, [L, R])]; }); });
            expect(results).toEqual([
                [[], [1, [2, [3, [4, [5, []]]]]]],
                [[1, []], [2, [3, [4, [5, []]]]]],
                [[1, [2, []]], [3, [4, [5, []]]]],
                [[1, [2, [3, []]]], [4, [5, []]]],
                [[1, [2, [3, [4, []]]]], [5, []]],
                [[1, [2, [3, [4, [5, []]]]]], []]
            ]);
        });
    });
    describe('transitive closure', function () {
        test('chain, double recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [path.match([row[0], Y]), path.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 4], [1, 3], [1, 4], [2, 4]
            ]);
        });
        test('chain, double recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [path.match([row[0], Y]), path.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 4], [1, 3], [1, 4], [2, 4]
            ]);
        });
        test('chain, left recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [path.match([row[0], Y]), edge.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 4], [1, 3], [2, 4], [1, 4]
            ]);
        });
        test('chain, left recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [path.match([row[0], Y]), edge.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 4], [1, 3], [2, 4], [1, 4]
            ]);
        });
        test('chain, right recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [edge.match([row[0], Y]), path.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 4], [1, 3], [1, 4], [2, 4]
            ]);
        });
        test('chain, right recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 4]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [edge.match([row[0], Y]), path.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 4], [1, 3], [2, 4], [1, 2], [2, 3], [3, 4]
            ]);
        });
        test('cycle, double recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [path.match([row[0], Y]), path.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 1], [1, 3], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]
            ]);
        });
        test('cycle, double recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [path.match([row[0], Y]), path.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 1], [1, 3], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]
            ]);
        });
        test('cycle, left recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [path.match([row[0], Y]), edge.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 1], [1, 3], [2, 1], [3, 2], [1, 1], [2, 2], [3, 3]
            ]);
        });
        test('cycle, left recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [path.match([row[0], Y]), edge.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 1], [1, 3], [2, 1], [3, 2], [1, 1], [2, 2], [3, 3]
            ]);
        });
        test('cycle, right recursive, edges first', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [edge.match(row)]; }, function (Y) { return [edge.match([row[0], Y]), path.match([Y, row[1]])]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 2], [2, 3], [3, 1], [1, 3], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]
            ]);
        });
        test('cycle, right recursive, edges second', function () {
            var edge = new slg_1.EdbPredicate([[1, 2], [2, 3], [3, 1]]);
            var path = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function (Y) { return [edge.match([row[0], Y]), path.match([Y, row[1]])]; }, function () { return [edge.match(row)]; }); });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [path.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [1, 3], [1, 1], [1, 2], [2, 1], [2, 2], [2, 3], [3, 2], [3, 3], [3, 1]
            ]);
        });
    });
    test('trivial unsupported positive loop', function () {
        var r = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [r.match(row)]; }); });
        var result = slg_1.toArrayQ(function (Q) { return r.match(null); });
        expect(result).toEqual([]);
    });
    test('slightly less trivial unsupported positive loop', function () {
        var p = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [q.match(row)]; }); });
        var q = new slg_1.TabledPredicate(function (row) { return slg_1.rule(function () { return [p.match(row)]; }); });
        var result = slg_1.toArrayQ(function (Q) { return p.match(null); });
        expect(result).toEqual([]);
    });
    test('looseUnify success', function () {
        var objects = new slg_1.EdbPredicate([
            { foo: 1, bar: 2 },
            { foo: 3, bar: 4 }
        ]);
        var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (X) { return [objects.match(X), slg_1.looseUnify({ foo: Q }, X)]; }); });
        expect(result).toEqual([1, 3]);
    });
    test('trapped subgoal', function () {
        var p = new slg_1.TabledPredicate(function (_a) {
            var _b = __read(_a, 2), X = _b[0], Y = _b[1];
            return slg_1.rule(function () { return [q.match(X), r.match(Y)]; }, function () { return [slg_1.unify([X, Y], ['c', 'a'])]; });
        });
        var q = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [slg_1.unify(X, 'a')]; }, function () { return [slg_1.unify(X, 'b')]; }); });
        var r = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return [slg_1.unify(X, 'c')]; }, function (Y) { return [p.match([X, Y])]; }); });
        var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (X, Y) { return [p.match([X, Y]), slg_1.unify(Q, [X, Y])]; }); });
        expect(result).toEqual([
            ['c', 'a'], ['a', 'c'], ['b', 'c'], ['a', 'a'], ['a', 'b'], ['b', 'a'], ['b', 'b']
        ]);
    });
    describe('tests for independence of variables between consumers and generators', function () {
        test('', function () {
            var vp = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return []; }); });
            var _a = __read(slg_1.toArrayQ(function (Q) { return slg_1.clause(function (Y, X) { return [slg_1.unify(1, X), vp.match(X), slg_1.unify(Q, [Y, X])]; }); }), 1), _b = __read(_a[0], 2), y = _b[0], x = _b[1];
            expect(y).toBeInstanceOf(unify_1.Variable);
            expect(x).toBe(1);
        });
        test('', function () {
            var vp = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return []; }); });
            var _a = __read(slg_1.toArrayQ(function (Q) { return slg_1.clause(function (Y, X) { return [vp.match(X), slg_1.unify(1, Y), slg_1.unify(Q, [Y, X])]; }); }), 1), _b = __read(_a[0], 2), y = _b[0], x = _b[1];
            expect(x).toBeInstanceOf(unify_1.Variable);
            expect(y).toBe(1);
        });
        test('', function () {
            var vp = new slg_1.TabledPredicate(function (X) { return slg_1.rule(function () { return []; }); });
            var _a = __read(slg_1.toArrayQ(function (Q) { return slg_1.clause(function (Y, X) { return [vp.match(X), slg_1.unify(1, X), slg_1.unify(Q, [Y, X])]; }); }), 1), _b = __read(_a[0], 2), y = _b[0], x = _b[1];
            expect(y).toBeInstanceOf(unify_1.Variable);
            expect(x).toBe(1);
        });
    });
    describe('same generation', function () {
        var largeSgExampleData = [
            [1, 30], [1, 40], [2, 43], [2, 34], [3, 30], [3, 33], [4, 45], [4, 40], [5, 31],
            [5, 45], [6, 31], [6, 48], [7, 31], [7, 41], [8, 25], [8, 30], [9, 40], [9, 31],
            [10, 35], [10, 46], [11, 32], [11, 28], [12, 35], [12, 43], [13, 46], [13, 48],
            [14, 39], [14, 35], [15, 46], [15, 28], [16, 28], [16, 42], [17, 33], [17, 25],
            [18, 46], [18, 27], [19, 38], [19, 47], [20, 27], [20, 41], [21, 34], [21, 38],
            [22, 27], [22, 33], [23, 26], [23, 35], [24, 36], [24, 25], [25, 70], [25, 52],
            [26, 59], [26, 71], [27, 61], [27, 58], [28, 61], [28, 54], [29, 63], [29, 70],
            [30, 58], [30, 53], [31, 56], [31, 60], [32, 58], [32, 50], [33, 62], [33, 66],
            [34, 55], [34, 72], [35, 63], [35, 58], [36, 55], [36, 64], [37, 56], [37, 58],
            [38, 68], [38, 61], [39, 64], [39, 52], [40, 57], [40, 70], [41, 69], [41, 55],
            [42, 62], [42, 53], [43, 68], [43, 65], [44, 56], [44, 62], [45, 67], [45, 71],
            [46, 71], [46, 66], [47, 61], [47, 60], [48, 60], [48, 54], [49, 93], [49, 88],
            [50, 90], [50, 93], [51, 95], [51, 92], [52, 93], [52, 94], [53, 83], [53, 90],
            [54, 78], [54, 79], [55, 79], [55, 92], [56, 96], [56, 94], [57, 94], [57, 80],
            [58, 79], [58, 83], [59, 75], [59, 96], [60, 86], [60, 79], [61, 85], [61, 75],
            [62, 82], [62, 95], [63, 85], [63, 78], [64, 92], [64, 86], [65, 76], [65, 78],
            [66, 78], [66, 81], [67, 96], [67, 78], [68, 88], [68, 77], [69, 86], [69, 90],
            [70, 93], [70, 80], [71, 92], [71, 74], [72, 88], [72, 81], [73, 113], [73, 116],
            [74, 101], [74, 100], [75, 113], [75, 109], [76, 112], [76, 98], [77, 109],
            [77, 108], [78, 112], [78, 117], [79, 101], [79, 110], [80, 110], [80, 119],
            [81, 108], [81, 98], [82, 111], [82, 113], [83, 116], [83, 111], [84, 114],
            [84, 103], [85, 97], [85, 114], [86, 107], [86, 120], [87, 116], [87, 105],
            [88, 99], [88, 105], [89, 118], [89, 110], [90, 104], [90, 108], [91, 98],
            [91, 106], [92, 100], [92, 108], [93, 117], [93, 114], [94, 115], [94, 118],
            [95, 99], [95, 108], [96, 111], [96, 98], [97, 125], [97, 132], [98, 134],
            [98, 131], [99, 124], [99, 136], [100, 122], [100, 129], [101, 140], [101, 125],
            [102, 142], [102, 137], [103, 137], [103, 141], [104, 135], [104, 132],
            [105, 126], [105, 137], [106, 142], [106, 128], [107, 123], [107, 143],
            [108, 126], [108, 132], [109, 128], [109, 130], [110, 124], [110, 136],
            [111, 123], [111, 141], [112, 128], [112, 142], [113, 130], [113, 128],
            [114, 144], [114, 139], [115, 141], [115, 139], [116, 134], [116, 126],
            [117, 135], [117, 131], [118, 137], [118, 142], [119, 133], [119, 125],
            [120, 135], [120, 139], [121, 154], [121, 151], [122, 150], [122, 156],
            [123, 158], [123, 168], [124, 160], [124, 168], [125, 159], [125, 161],
            [126, 167], [126, 156], [127, 151], [127, 167], [128, 164], [128, 152],
            [129, 154], [129, 158], [130, 164], [130, 150], [131, 165], [131, 155],
            [132, 154], [132, 157], [133, 163], [133, 161], [134, 147], [134, 160],
            [135, 156], [135, 148], [136, 153], [136, 157], [137, 159], [137, 152],
            [138, 149], [138, 152], [139, 161], [139, 157], [140, 167], [140, 161],
            [141, 168], [141, 145], [142, 161], [142, 160], [143, 146], [143, 150],
            [144, 160], [144, 163], [145, 184], [145, 171], [146, 187], [146, 171],
            [147, 179], [147, 182], [148, 185], [148, 180], [149, 187], [149, 174],
            [150, 175], [150, 190], [151, 176], [151, 185], [152, 169], [152, 182],
            [153, 181], [153, 188], [154, 190], [154, 179], [155, 184], [155, 187],
            [156, 169], [156, 184], [157, 183], [157, 186], [158, 174], [158, 179],
            [159, 175], [159, 172], [160, 190], [160, 189], [161, 180], [161, 175],
            [162, 192], [162, 182], [163, 179], [163, 175], [164, 174], [164, 181],
            [165, 178], [165, 185], [166, 170], [166, 169], [167, 183], [167, 178],
            [168, 180], [168, 181], [169, 213], [169, 207], [170, 206], [170, 203],
            [171, 195], [171, 209], [172, 214], [172, 197], [173, 205], [173, 206],
            [174, 212], [174, 214], [175, 201], [175, 204], [176, 206], [176, 200],
            [177, 202], [177, 207], [178, 202], [178, 203], [179, 216], [179, 196],
            [180, 211], [180, 197], [181, 193], [181, 207], [182, 196], [182, 194],
            [183, 215], [183, 199], [184, 203], [184, 204], [185, 196], [185, 208],
            [186, 195], [186, 212], [187, 193], [187, 194], [188, 204], [188, 200],
            [189, 205], [189, 201], [190, 210], [190, 194], [191, 193], [191, 209],
            [192, 208], [192, 209], [193, 227], [193, 223], [194, 240], [194, 227],
            [195, 239], [195, 230], [196, 228], [196, 230], [197, 234], [197, 221],
            [198, 240], [198, 222], [199, 221], [199, 235], [200, 230], [200, 235],
            [201, 230], [201, 225], [202, 238], [202, 217], [203, 224], [203, 217],
            [204, 221], [204, 234], [205, 228], [205, 217], [206, 221], [206, 230],
            [207, 220], [207, 240], [208, 224], [208, 219], [209, 217], [209, 237],
            [210, 232], [210, 239], [211, 235], [211, 223], [212, 228], [212, 220],
            [213, 229], [213, 234], [214, 230], [214, 228], [215, 223], [215, 219],
            [216, 221], [216, 240], [217, 243], [217, 256], [218, 246], [218, 252],
            [219, 250], [219, 247], [220, 257], [220, 243], [221, 245], [221, 261],
            [222, 254], [222, 245], [223, 258], [223, 252], [224, 244], [224, 242],
            [225, 253], [225, 250], [226, 263], [226, 248], [227, 251], [227, 262],
            [228, 249], [228, 248], [229, 258], [229, 257], [230, 258], [230, 256],
            [231, 262], [231, 254], [232, 242], [232, 251], [233, 244], [233, 257],
            [234, 256], [234, 260], [235, 262], [235, 253], [236, 259], [236, 264],
            [237, 261], [237, 242], [238, 260], [238, 243], [239, 260], [239, 246],
            [240, 254], [240, 263], [241, 265], [241, 269], [242, 283], [242, 267],
            [243, 270], [243, 288], [244, 280], [244, 278], [245, 271], [245, 287],
            [246, 284], [246, 277], [247, 288], [247, 281], [248, 280], [248, 277],
            [249, 273], [249, 270], [250, 277], [250, 270], [251, 286], [251, 280],
            [252, 279], [252, 268], [253, 283], [253, 279], [254, 277], [254, 276],
            [255, 265], [255, 285], [256, 277], [256, 276], [257, 284], [257, 283],
            [258, 270], [258, 271], [259, 277], [259, 279], [260, 284], [260, 268],
            [261, 267], [261, 279], [262, 271], [262, 279], [263, 268], [263, 273],
            [264, 272], [264, 277], [265, 297], [265, 300], [266, 302], [266, 304],
            [267, 292], [267, 308], [268, 296], [268, 307], [269, 306], [269, 304],
            [270, 300], [270, 308], [271, 293], [271, 291], [272, 294], [272, 305],
            [273, 293], [273, 291], [274, 303], [274, 312], [275, 294], [275, 299],
            [276, 292], [276, 305], [277, 303], [277, 299], [278, 297], [278, 302],
            [279, 302], [279, 294], [280, 291], [280, 289], [281, 294], [281, 307],
            [282, 293], [282, 296], [283, 308], [283, 294], [284, 302], [284, 310],
            [285, 289], [285, 308], [286, 292], [286, 307], [287, 293], [287, 295],
            [288, 296], [288, 292], [289, 322], [289, 331], [290, 333], [290, 313],
            [291, 326], [291, 314], [292, 334], [292, 317], [293, 317], [293, 315],
            [294, 333], [294, 331], [295, 321], [295, 335], [296, 314], [296, 322],
            [297, 321], [297, 322], [298, 332], [298, 316], [299, 321], [299, 330],
            [300, 320], [300, 315], [301, 317], [301, 326], [302, 335], [302, 318],
            [303, 336], [303, 325], [304, 325], [304, 322], [305, 332], [305, 321],
            [306, 335], [306, 325], [307, 323], [307, 326], [308, 316], [308, 320],
            [309, 321], [309, 336], [310, 322], [310, 328], [311, 332], [311, 335],
            [312, 332], [312, 322], [313, 359], [313, 347], [314, 348], [314, 349],
            [315, 350], [315, 352], [316, 351], [316, 342], [317, 354], [317, 349],
            [318, 340], [318, 358], [319, 359], [319, 339], [320, 357], [320, 355],
            [321, 357], [321, 341], [322, 344], [322, 355], [323, 340], [323, 338],
            [324, 342], [324, 356], [325, 355], [325, 342], [326, 345], [326, 353],
            [327, 345], [327, 339], [328, 360], [328, 356], [329, 358], [329, 351],
            [330, 359], [330, 353], [331, 341], [331, 356], [332, 344], [332, 339],
            [333, 351], [333, 355], [334, 355], [334, 359], [335, 350], [335, 339],
            [336, 342], [336, 354], [337, 365], [337, 374], [338, 364], [338, 384],
            [339, 373], [339, 375], [340, 380], [340, 368], [341, 372], [341, 362],
            [342, 368], [342, 367], [343, 364], [343, 369], [344, 382], [344, 373],
            [345, 367], [345, 375], [346, 370], [346, 372], [347, 363], [347, 381],
            [348, 371], [348, 365], [349, 372], [349, 364], [350, 379], [350, 372],
            [351, 381], [351, 364], [352, 381], [352, 362], [353, 370], [353, 377],
            [354, 373], [354, 362], [355, 367], [355, 382], [356, 370], [356, 384],
            [357, 371], [357, 372], [358, 361], [358, 378], [359, 371], [359, 366],
            [360, 382], [360, 364], [361, 407], [361, 408], [362, 392], [362, 393],
            [363, 393], [363, 394], [364, 387], [364, 400], [365, 397], [365, 392],
            [366, 400], [366, 408], [367, 401], [367, 388], [368, 389], [368, 394],
            [369, 388], [369, 399], [370, 405], [370, 385], [371, 398], [371, 397],
            [372, 404], [372, 387], [373, 404], [373, 390], [374, 396], [374, 397],
            [375, 401], [375, 397], [376, 399], [376, 395], [377, 397], [377, 391],
            [378, 392], [378, 385], [379, 390], [379, 386], [380, 408], [380, 394],
            [381, 398], [381, 403], [382, 385], [382, 403], [383, 385], [383, 386],
            [384, 397], [384, 387], [385, 418], [385, 429], [386, 419], [386, 415],
            [387, 413], [387, 429], [388, 415], [388, 418], [389, 429], [389, 417],
            [390, 417], [390, 424], [391, 409], [391, 425], [392, 418], [392, 409],
            [393, 428], [393, 414], [394, 427], [394, 431], [395, 429], [395, 430],
            [396, 418], [396, 419], [397, 432], [397, 419], [398, 420], [398, 414],
            [399, 419], [399, 412], [400, 415], [400, 410], [401, 420], [401, 424],
            [402, 426], [402, 412], [403, 431], [403, 419], [404, 428], [404, 422],
            [405, 417], [405, 428], [406, 422], [406, 411], [407, 424], [407, 427],
            [408, 410], [408, 416], [409, 436], [409, 435], [410, 442], [410, 439],
            [411, 456], [411, 436], [412, 449], [412, 456], [413, 453], [413, 449],
            [414, 440], [414, 434], [415, 436], [415, 437], [416, 433], [416, 452],
            [417, 433], [417, 444], [418, 436], [418, 452], [419, 445], [419, 444],
            [420, 451], [420, 455], [421, 439], [421, 455], [422, 445], [422, 454],
            [423, 456], [423, 445], [424, 445], [424, 448], [425, 434], [425, 448],
            [426, 442], [426, 440], [427, 437], [427, 438], [428, 453], [428, 446],
            [429, 437], [429, 452], [430, 444], [430, 438], [431, 449], [431, 443],
            [432, 442], [432, 450], [433, 469], [433, 476], [434, 476], [434, 479],
            [435, 478], [435, 461], [436, 467], [436, 471], [437, 479], [437, 468],
            [438, 474], [438, 467], [439, 459], [439, 473], [440, 458], [440, 459],
            [441, 467], [441, 458], [442, 470], [442, 472], [443, 477], [443, 460],
            [444, 475], [444, 474], [445, 471], [445, 480], [446, 477], [446, 474],
            [447, 472], [447, 476], [448, 469], [448, 474], [449, 465], [449, 471],
            [450, 465], [450, 459], [451, 458], [451, 475], [452, 457], [452, 462],
            [453, 478], [453, 459], [454, 472], [454, 461], [455, 469], [455, 479],
            [456, 457], [456, 458], [457, 482], [457, 500], [458, 492], [458, 488],
            [459, 488], [459, 489], [460, 483], [460, 500], [461, 504], [461, 486],
            [462, 491], [462, 492], [463, 499], [463, 493], [464, 483], [464, 502],
            [465, 495], [465, 502], [466, 483], [466, 487], [467, 491], [467, 503],
            [468, 492], [468, 498], [469, 501], [469, 504], [470, 484], [470, 487],
            [471, 502], [471, 487], [472, 499], [472, 490], [473, 500], [473, 495],
            [474, 481], [474, 487], [475, 488], [475, 494], [476, 488], [476, 500],
            [477, 492], [477, 489], [478, 504], [478, 481], [479, 502], [479, 491],
            [480, 497], [480, 487], [481, 528], [481, 522], [482, 522], [482, 520],
            [483, 516], [483, 515], [484, 526], [484, 514], [485, 511], [485, 508],
            [486, 512], [486, 524], [487, 525], [487, 520], [488, 508], [488, 520],
            [489, 526], [489, 527], [490, 517], [490, 505], [491, 514], [491, 512],
            [492, 524], [492, 522], [493, 524], [493, 517], [494, 520], [494, 518],
            [495, 516], [495, 508], [496, 508], [496, 525], [497, 523], [497, 505],
            [498, 507], [498, 505], [499, 510], [499, 523], [500, 522], [500, 518],
            [501, 511], [501, 517], [502, 506], [502, 513], [503, 505], [503, 514],
            [504, 525], [504, 519], [505, 547], [505, 534], [506, 551], [506, 538],
            [507, 538], [507, 530], [508, 551], [508, 544], [509, 550], [509, 551],
            [510, 529], [510, 539], [511, 544], [511, 549], [512, 543], [512, 549],
            [513, 540], [513, 533], [514, 551], [514, 550], [515, 536], [515, 547],
            [516, 544], [516, 531], [517, 535], [517, 549], [518, 546], [518, 542],
            [519, 537], [519, 547], [520, 547], [520, 544], [521, 531], [521, 544],
            [522, 533], [522, 530], [523, 538], [523, 546], [524, 541], [524, 531],
            [525, 530], [525, 533], [526, 530], [526, 529], [527, 550], [527, 529],
            [528, 541], [528, 534], [529, 564], [529, 574], [530, 554], [530, 564],
            [531, 564], [531, 556], [532, 569], [532, 554], [533, 561], [533, 566],
            [534, 565], [534, 576], [535, 570], [535, 558], [536, 572], [536, 571],
            [537, 555], [537, 569], [538, 564], [538, 555], [539, 558], [539, 566],
            [540, 571], [540, 576], [541, 567], [541, 561], [542, 573], [542, 570],
            [543, 576], [543, 565], [544, 572], [544, 565], [545, 553], [545, 554],
            [546, 556], [546, 574], [547, 553], [547, 575], [548, 571], [548, 573],
            [549, 556], [549, 574], [550, 575], [550, 555], [551, 558], [551, 569],
            [552, 569], [552, 564]
        ];
        test.skip('large example with TrieEdbPredicate', function () {
            var cyl = slg_1.TrieEdbPredicate.fromArray(largeSgExampleData);
            var sg = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Y = _b[1];
                return slg_1.rule(function () { return [slg_1.unify(X, Y)]; }, function (Z) { return [cyl.match([X, Z]), sg.match([Z, Z]), cyl.match([Y, Z])]; });
            });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [sg.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [new unify_1.Variable(2), new unify_1.Variable(2)],
                [1, 1], [1, 3], [1, 8], [1, 4], [1, 9], [2, 2], [2, 21], [2, 12], [3, 1],
                [3, 3], [3, 8], [3, 17], [3, 22], [4, 1], [4, 4], [4, 9], [4, 5], [5, 5],
                [5, 6], [5, 7], [5, 9], [5, 4], [6, 5], [6, 6], [6, 7], [6, 9], [6, 13],
                [7, 5], [7, 6], [7, 7], [7, 9], [7, 20], [8, 8], [8, 17], [8, 24], [8, 1],
                [8, 3], [9, 5], [9, 6], [9, 7], [9, 9], [9, 1], [9, 4], [10, 10], [10, 12],
                [10, 14], [10, 23], [10, 13], [10, 15], [10, 18], [11, 11], [11, 15],
                [11, 16], [12, 10], [12, 12], [12, 14], [12, 23], [12, 2], [13, 10],
                [13, 13], [13, 15], [13, 18], [13, 6], [14, 10], [14, 12], [14, 14],
                [14, 23], [15, 11], [15, 15], [15, 16], [15, 10], [15, 13], [15, 18],
                [16, 11], [16, 15], [16, 16], [17, 8], [17, 17], [17, 24], [17, 3],
                [17, 22], [18, 18], [18, 20], [18, 22], [18, 10], [18, 13], [18, 15],
                [19, 19], [19, 21], [20, 18], [20, 20], [20, 22], [20, 7], [21, 2],
                [21, 21], [21, 19], [22, 18], [22, 20], [22, 22], [22, 3], [22, 17],
                [23, 23], [23, 10], [23, 12], [23, 14], [24, 8], [24, 17], [24, 24],
                [25, 25], [25, 39], [25, 29], [25, 40], [26, 26], [26, 45], [26, 46],
                [27, 27], [27, 30], [27, 32], [27, 35], [27, 37], [27, 28], [27, 38],
                [27, 47], [28, 28], [28, 48], [28, 27], [28, 38], [28, 47], [29, 29],
                [29, 35], [29, 25], [29, 40], [30, 30], [30, 42], [30, 27], [30, 32],
                [30, 35], [30, 37], [31, 31], [31, 37], [31, 44], [31, 47], [31, 48],
                [32, 32], [32, 27], [32, 30], [32, 35], [32, 37], [33, 33], [33, 42],
                [33, 44], [33, 46], [34, 34], [34, 36], [34, 41], [35, 27], [35, 30],
                [35, 32], [35, 35], [35, 37], [35, 29], [36, 34], [36, 36], [36, 41],
                [36, 39], [37, 31], [37, 37], [37, 44], [37, 27], [37, 30], [37, 32],
                [37, 35], [38, 27], [38, 28], [38, 38], [38, 47], [38, 43], [39, 25],
                [39, 39], [39, 36], [40, 40], [40, 25], [40, 29], [41, 34], [41, 36],
                [41, 41], [42, 30], [42, 42], [42, 33], [42, 44], [43, 43], [43, 38],
                [44, 31], [44, 37], [44, 44], [44, 33], [44, 42], [45, 45], [45, 26],
                [45, 46], [46, 33], [46, 46], [46, 26], [46, 45], [47, 31], [47, 47],
                [47, 48], [47, 27], [47, 28], [47, 38], [48, 28], [48, 48], [48, 31],
                [48, 47], [49, 49], [49, 68], [49, 72], [49, 50], [49, 52], [49, 70],
                [50, 50], [50, 53], [50, 69], [50, 49], [50, 52], [50, 70], [51, 51],
                [51, 55], [51, 64], [51, 71], [51, 62], [52, 49], [52, 50], [52, 52],
                [52, 70], [52, 56], [52, 57], [53, 53], [53, 58], [53, 50], [53, 69],
                [54, 54], [54, 63], [54, 65], [54, 66], [54, 67], [54, 55], [54, 58],
                [54, 60], [55, 54], [55, 55], [55, 58], [55, 60], [55, 51], [55, 64],
                [55, 71], [56, 52], [56, 56], [56, 57], [56, 59], [56, 67], [57, 57],
                [57, 70], [57, 52], [57, 56], [58, 54], [58, 55], [58, 58], [58, 60],
                [58, 53], [59, 59], [59, 61], [59, 56], [59, 67], [60, 54], [60, 55],
                [60, 58], [60, 60], [60, 64], [60, 69], [61, 59], [61, 61], [61, 63],
                [62, 62], [62, 51], [63, 54], [63, 63], [63, 65], [63, 66], [63, 67],
                [63, 61], [64, 60], [64, 64], [64, 69], [64, 51], [64, 55], [64, 71],
                [65, 65], [65, 54], [65, 63], [65, 66], [65, 67], [66, 54], [66, 63],
                [66, 65], [66, 66], [66, 67], [66, 72], [67, 54], [67, 63], [67, 65],
                [67, 66], [67, 67], [67, 56], [67, 59], [68, 68], [68, 49], [68, 72],
                [69, 60], [69, 64], [69, 69], [69, 50], [69, 53], [70, 57], [70, 70],
                [70, 49], [70, 50], [70, 52], [71, 71], [71, 51], [71, 55], [71, 64],
                [72, 66], [72, 72], [72, 49], [72, 68], [73, 73], [73, 75], [73, 82],
                [73, 83], [73, 87], [74, 74], [74, 92], [74, 79], [75, 75], [75, 77],
                [75, 73], [75, 82], [76, 76], [76, 81], [76, 91], [76, 96], [76, 78],
                [77, 77], [77, 81], [77, 90], [77, 92], [77, 95], [77, 75], [78, 76],
                [78, 78], [78, 93], [79, 74], [79, 79], [79, 80], [79, 89], [80, 79],
                [80, 80], [80, 89], [81, 76], [81, 81], [81, 91], [81, 96], [81, 77],
                [81, 90], [81, 92], [81, 95], [82, 82], [82, 83], [82, 96], [82, 73],
                [82, 75], [83, 82], [83, 83], [83, 96], [83, 73], [83, 87], [84, 84],
                [84, 85], [84, 93], [85, 85], [85, 84], [85, 93], [86, 86], [87, 87],
                [87, 88], [87, 73], [87, 83], [88, 88], [88, 95], [88, 87], [89, 79],
                [89, 80], [89, 89], [89, 94], [90, 90], [90, 77], [90, 81], [90, 92],
                [90, 95], [91, 76], [91, 81], [91, 91], [91, 96], [92, 74], [92, 92],
                [92, 77], [92, 81], [92, 90], [92, 95], [93, 84], [93, 85], [93, 93],
                [93, 78], [94, 94], [94, 89], [95, 88], [95, 95], [95, 77], [95, 81],
                [95, 90], [95, 92], [96, 76], [96, 81], [96, 91], [96, 96], [96, 82],
                [96, 83], [97, 97], [97, 101], [97, 119], [97, 104], [97, 108], [98, 98],
                [98, 117], [98, 116], [99, 99], [99, 110], [100, 100], [101, 97],
                [101, 101], [101, 119], [102, 102], [102, 103], [102, 105], [102, 118],
                [102, 106], [102, 112], [103, 102], [103, 103], [103, 105], [103, 118],
                [103, 111], [103, 115], [104, 97], [104, 104], [104, 108], [104, 117],
                [104, 120], [105, 105], [105, 108], [105, 116], [105, 102], [105, 103],
                [105, 118], [106, 106], [106, 109], [106, 112], [106, 113], [106, 102],
                [106, 118], [107, 107], [107, 111], [108, 105], [108, 108], [108, 116],
                [108, 97], [108, 104], [109, 106], [109, 109], [109, 112], [109, 113],
                [110, 99], [110, 110], [111, 107], [111, 111], [111, 103], [111, 115],
                [112, 106], [112, 109], [112, 112], [112, 113], [112, 102], [112, 118],
                [113, 106], [113, 109], [113, 112], [113, 113], [114, 114], [114, 115],
                [114, 120], [115, 114], [115, 115], [115, 120], [115, 103], [115, 111],
                [116, 105], [116, 108], [116, 116], [116, 98], [117, 98], [117, 117],
                [117, 104], [117, 120], [118, 102], [118, 103], [118, 105], [118, 118],
                [118, 106], [118, 112], [119, 97], [119, 101], [119, 119], [120, 104],
                [120, 117], [120, 120], [120, 114], [120, 115], [121, 121], [121, 127],
                [121, 129], [121, 132], [122, 122], [122, 130], [122, 143], [122, 126],
                [122, 135], [123, 123], [123, 129], [123, 124], [123, 141], [124, 124],
                [124, 134], [124, 142], [124, 144], [124, 123], [124, 141], [125, 125],
                [125, 137], [125, 133], [125, 139], [125, 140], [125, 142], [126, 122],
                [126, 126], [126, 135], [126, 127], [126, 140], [127, 121], [127, 127],
                [127, 126], [127, 140], [128, 128], [128, 137], [128, 138], [128, 130],
                [129, 121], [129, 129], [129, 132], [129, 123], [130, 122], [130, 130],
                [130, 143], [130, 128], [131, 131], [132, 121], [132, 129], [132, 132],
                [132, 136], [132, 139], [133, 125], [133, 133], [133, 139], [133, 140],
                [133, 142], [133, 144], [134, 134], [134, 124], [134, 142], [134, 144],
                [135, 135], [135, 122], [135, 126], [136, 136], [136, 132], [136, 139],
                [137, 128], [137, 137], [137, 138], [137, 125], [138, 138], [138, 128],
                [138, 137], [139, 132], [139, 136], [139, 139], [139, 125], [139, 133],
                [139, 140], [139, 142], [140, 125], [140, 133], [140, 139], [140, 140],
                [140, 142], [140, 126], [140, 127], [141, 141], [141, 123], [141, 124],
                [142, 124], [142, 134], [142, 142], [142, 144], [142, 125], [142, 133],
                [142, 139], [142, 140], [143, 143], [143, 122], [143, 130], [144, 124],
                [144, 134], [144, 142], [144, 144], [144, 133], [145, 145], [145, 146],
                [145, 155], [145, 156], [146, 145], [146, 146], [146, 149], [146, 155],
                [147, 147], [147, 154], [147, 158], [147, 163], [147, 152], [147, 162],
                [148, 148], [148, 161], [148, 168], [148, 151], [148, 165], [149, 149],
                [149, 158], [149, 164], [149, 146], [149, 155], [150, 150], [150, 159],
                [150, 161], [150, 163], [150, 154], [150, 160], [151, 151], [151, 148],
                [151, 165], [152, 152], [152, 156], [152, 166], [152, 147], [152, 162],
                [153, 153], [153, 164], [153, 168], [154, 147], [154, 154], [154, 158],
                [154, 163], [154, 150], [154, 160], [155, 145], [155, 155], [155, 156],
                [155, 146], [155, 149], [156, 152], [156, 156], [156, 166], [156, 145],
                [156, 155], [157, 157], [157, 167], [158, 149], [158, 158], [158, 164],
                [158, 147], [158, 154], [158, 163], [159, 159], [159, 150], [159, 161],
                [159, 163], [160, 160], [160, 150], [160, 154], [161, 150], [161, 159],
                [161, 161], [161, 163], [161, 148], [161, 168], [162, 147], [162, 152],
                [162, 162], [163, 150], [163, 159], [163, 161], [163, 163], [163, 147],
                [163, 154], [163, 158], [164, 149], [164, 158], [164, 164], [164, 153],
                [164, 168], [165, 165], [165, 167], [165, 148], [165, 151], [166, 152],
                [166, 156], [166, 166], [167, 165], [167, 167], [167, 157], [168, 148],
                [168, 161], [168, 168], [168, 153], [168, 164], [169, 169], [169, 177],
                [169, 181], [170, 170], [170, 178], [170, 184], [170, 173], [170, 176],
                [171, 171], [171, 186], [171, 191], [171, 192], [172, 172], [172, 180],
                [172, 174], [173, 173], [173, 189], [173, 170], [173, 176], [174, 174],
                [174, 186], [174, 172], [175, 175], [175, 189], [175, 184], [175, 188],
                [176, 176], [176, 188], [176, 170], [176, 173], [177, 177], [177, 178],
                [177, 169], [177, 181], [178, 177], [178, 178], [178, 170], [178, 184],
                [179, 179], [179, 182], [179, 185], [180, 172], [180, 180], [181, 181],
                [181, 187], [181, 191], [181, 169], [181, 177], [182, 182], [182, 187],
                [182, 190], [182, 179], [182, 185], [183, 183], [184, 170], [184, 178],
                [184, 184], [184, 175], [184, 188], [185, 179], [185, 182], [185, 185],
                [185, 192], [186, 171], [186, 186], [186, 174], [187, 181], [187, 187],
                [187, 191], [187, 182], [187, 190], [188, 176], [188, 188], [188, 175],
                [188, 184], [189, 175], [189, 189], [189, 173], [190, 182], [190, 187],
                [190, 190], [191, 181], [191, 187], [191, 191], [191, 171], [191, 192],
                [192, 185], [192, 192], [192, 171], [192, 191], [193, 193], [193, 211],
                [193, 215], [193, 194], [194, 193], [194, 194], [194, 198], [194, 207],
                [194, 216], [195, 195], [195, 196], [195, 200], [195, 201], [195, 206],
                [195, 214], [195, 210], [196, 196], [196, 205], [196, 212], [196, 214],
                [196, 195], [196, 200], [196, 201], [196, 206], [197, 197], [197, 199],
                [197, 204], [197, 206], [197, 216], [197, 213], [198, 198], [198, 194],
                [198, 207], [198, 216], [199, 197], [199, 199], [199, 204], [199, 206],
                [199, 216], [199, 200], [199, 211], [200, 195], [200, 196], [200, 200],
                [200, 201], [200, 206], [200, 214], [200, 199], [200, 211], [201, 201],
                [201, 195], [201, 196], [201, 200], [201, 206], [201, 214], [202, 202],
                [202, 203], [202, 205], [202, 209], [203, 202], [203, 203], [203, 205],
                [203, 209], [203, 208], [204, 197], [204, 199], [204, 204], [204, 206],
                [204, 216], [204, 213], [205, 202], [205, 203], [205, 205], [205, 209],
                [205, 196], [205, 212], [205, 214], [206, 197], [206, 199], [206, 204],
                [206, 206], [206, 216], [206, 195], [206, 196], [206, 200], [206, 201],
                [206, 214], [207, 207], [207, 212], [207, 194], [207, 198], [207, 216],
                [208, 208], [208, 215], [208, 203], [209, 202], [209, 203], [209, 205],
                [209, 209], [210, 210], [210, 195], [211, 193], [211, 211], [211, 215],
                [211, 199], [211, 200], [212, 207], [212, 212], [212, 196], [212, 205],
                [212, 214], [213, 213], [213, 197], [213, 204], [214, 196], [214, 205],
                [214, 212], [214, 214], [214, 195], [214, 200], [214, 201], [214, 206],
                [215, 208], [215, 215], [215, 193], [215, 211], [216, 197], [216, 199],
                [216, 204], [216, 206], [216, 216], [216, 194], [216, 198], [216, 207],
                [217, 217], [217, 220], [217, 238], [217, 230], [217, 234], [218, 218],
                [218, 239], [218, 223], [219, 219], [219, 225], [220, 217], [220, 220],
                [220, 238], [220, 229], [220, 233], [221, 221], [221, 222], [221, 237],
                [222, 221], [222, 222], [222, 231], [222, 240], [223, 218], [223, 223],
                [223, 229], [223, 230], [224, 224], [224, 232], [224, 237], [224, 233],
                [225, 219], [225, 225], [225, 235], [226, 226], [226, 228], [226, 240],
                [227, 227], [227, 232], [227, 231], [227, 235], [228, 226], [228, 228],
                [229, 220], [229, 229], [229, 233], [229, 223], [229, 230], [230, 217],
                [230, 230], [230, 234], [230, 223], [230, 229], [231, 222], [231, 231],
                [231, 240], [231, 227], [231, 235], [232, 224], [232, 232], [232, 237],
                [232, 227], [233, 224], [233, 233], [233, 220], [233, 229], [234, 217],
                [234, 230], [234, 234], [234, 238], [234, 239], [235, 225], [235, 235],
                [235, 227], [235, 231], [236, 236], [237, 224], [237, 232], [237, 237],
                [237, 221], [238, 217], [238, 220], [238, 238], [238, 234], [238, 239],
                [239, 218], [239, 239], [239, 234], [239, 238], [240, 222], [240, 231],
                [240, 240], [240, 226], [241, 241], [241, 255], [242, 242], [242, 261],
                [242, 253], [242, 257], [243, 243], [243, 249], [243, 250], [243, 258],
                [243, 247], [244, 244], [244, 248], [244, 251], [245, 245], [245, 258],
                [245, 262], [246, 246], [246, 248], [246, 250], [246, 254], [246, 256],
                [246, 259], [246, 264], [246, 257], [246, 260], [247, 247], [247, 243],
                [248, 246], [248, 248], [248, 250], [248, 254], [248, 256], [248, 259],
                [248, 264], [248, 244], [248, 251], [249, 243], [249, 249], [249, 250],
                [249, 258], [249, 263], [250, 243], [250, 249], [250, 250], [250, 258],
                [250, 246], [250, 248], [250, 254], [250, 256], [250, 259], [250, 264],
                [251, 244], [251, 248], [251, 251], [252, 252], [252, 260], [252, 263],
                [252, 253], [252, 259], [252, 261], [252, 262], [253, 252], [253, 253],
                [253, 259], [253, 261], [253, 262], [253, 242], [253, 257], [254, 254],
                [254, 256], [254, 246], [254, 248], [254, 250], [254, 259], [254, 264],
                [255, 241], [255, 255], [256, 254], [256, 256], [256, 246], [256, 248],
                [256, 250], [256, 259], [256, 264], [257, 242], [257, 253], [257, 257],
                [257, 246], [257, 260], [258, 243], [258, 249], [258, 250], [258, 258],
                [258, 245], [258, 262], [259, 246], [259, 248], [259, 250], [259, 254],
                [259, 256], [259, 259], [259, 264], [259, 252], [259, 253], [259, 261],
                [259, 262], [260, 252], [260, 260], [260, 263], [260, 246], [260, 257],
                [261, 242], [261, 261], [261, 252], [261, 253], [261, 259], [261, 262],
                [262, 245], [262, 258], [262, 262], [262, 252], [262, 253], [262, 259],
                [262, 261], [263, 252], [263, 260], [263, 263], [263, 249], [264, 264],
                [264, 246], [264, 248], [264, 250], [264, 254], [264, 256], [264, 259],
                [265, 265], [265, 278], [265, 270], [266, 266], [266, 278], [266, 279],
                [266, 284], [266, 269], [267, 267], [267, 276], [267, 286], [267, 288],
                [267, 270], [267, 283], [267, 285], [268, 268], [268, 282], [268, 288],
                [268, 281], [268, 286], [269, 266], [269, 269], [270, 265], [270, 270],
                [270, 267], [270, 283], [270, 285], [271, 271], [271, 273], [271, 280],
                [271, 282], [271, 287], [272, 272], [272, 275], [272, 279], [272, 281],
                [272, 283], [272, 276], [273, 271], [273, 273], [273, 280], [273, 282],
                [273, 287], [274, 274], [274, 277], [275, 272], [275, 275], [275, 279],
                [275, 281], [275, 283], [275, 277], [276, 267], [276, 276], [276, 286],
                [276, 288], [276, 272], [277, 275], [277, 277], [277, 274], [278, 265],
                [278, 278], [278, 266], [278, 279], [278, 284], [279, 272], [279, 275],
                [279, 279], [279, 281], [279, 283], [279, 266], [279, 278], [279, 284],
                [280, 280], [280, 285], [280, 271], [280, 273], [281, 272], [281, 275],
                [281, 279], [281, 281], [281, 283], [281, 268], [281, 286], [282, 271],
                [282, 273], [282, 282], [282, 287], [282, 268], [282, 288], [283, 272],
                [283, 275], [283, 279], [283, 281], [283, 283], [283, 267], [283, 270],
                [283, 285], [284, 266], [284, 278], [284, 279], [284, 284], [285, 280],
                [285, 285], [285, 267], [285, 270], [285, 283], [286, 267], [286, 276],
                [286, 286], [286, 288], [286, 268], [286, 281], [287, 271], [287, 273],
                [287, 282], [287, 287], [288, 267], [288, 276], [288, 286], [288, 288],
                [288, 268], [288, 282], [289, 289], [289, 296], [289, 297], [289, 304],
                [289, 310], [289, 312], [289, 294], [290, 290], [290, 294], [291, 291],
                [291, 296], [291, 301], [291, 307], [292, 292], [292, 293], [292, 301],
                [293, 293], [293, 300], [293, 292], [293, 301], [294, 289], [294, 294],
                [294, 290], [295, 295], [295, 297], [295, 299], [295, 305], [295, 309],
                [295, 302], [295, 306], [295, 311], [296, 291], [296, 296], [296, 289],
                [296, 297], [296, 304], [296, 310], [296, 312], [297, 295], [297, 297],
                [297, 299], [297, 305], [297, 309], [297, 289], [297, 296], [297, 304],
                [297, 310], [297, 312], [298, 298], [298, 308], [298, 305], [298, 311],
                [298, 312], [299, 295], [299, 297], [299, 299], [299, 305], [299, 309],
                [300, 293], [300, 300], [300, 308], [301, 292], [301, 293], [301, 301],
                [301, 291], [301, 307], [302, 302], [302, 295], [302, 306], [302, 311],
                [303, 303], [303, 304], [303, 306], [303, 309], [304, 289], [304, 296],
                [304, 297], [304, 304], [304, 310], [304, 312], [304, 303], [304, 306],
                [305, 295], [305, 297], [305, 299], [305, 305], [305, 309], [305, 298],
                [305, 311], [305, 312], [306, 303], [306, 304], [306, 306], [306, 295],
                [306, 302], [306, 311], [307, 307], [307, 291], [307, 301], [308, 298],
                [308, 308], [308, 300], [309, 295], [309, 297], [309, 299], [309, 305],
                [309, 309], [309, 303], [310, 289], [310, 296], [310, 297], [310, 304],
                [310, 310], [310, 312], [311, 298], [311, 305], [311, 311], [311, 312],
                [311, 295], [311, 302], [311, 306], [312, 289], [312, 296], [312, 297],
                [312, 304], [312, 310], [312, 312], [312, 298], [312, 305], [312, 311],
                [313, 313], [313, 319], [313, 330], [313, 334], [314, 314], [314, 317],
                [315, 315], [315, 335], [316, 316], [316, 324], [316, 325], [316, 336],
                [316, 329], [316, 333], [317, 314], [317, 317], [317, 336], [318, 318],
                [318, 323], [318, 329], [319, 319], [319, 327], [319, 332], [319, 335],
                [319, 313], [319, 330], [319, 334], [320, 320], [320, 322], [320, 325],
                [320, 333], [320, 334], [320, 321], [321, 321], [321, 331], [321, 320],
                [322, 322], [322, 332], [322, 320], [322, 325], [322, 333], [322, 334],
                [323, 323], [323, 318], [324, 316], [324, 324], [324, 325], [324, 336],
                [324, 328], [324, 331], [325, 316], [325, 324], [325, 325], [325, 336],
                [325, 320], [325, 322], [325, 333], [325, 334], [326, 326], [326, 327],
                [326, 330], [327, 319], [327, 327], [327, 332], [327, 335], [327, 326],
                [328, 324], [328, 328], [328, 331], [329, 316], [329, 329], [329, 333],
                [329, 318], [330, 326], [330, 330], [330, 313], [330, 319], [330, 334],
                [331, 321], [331, 331], [331, 324], [331, 328], [332, 319], [332, 327],
                [332, 332], [332, 335], [332, 322], [333, 316], [333, 329], [333, 333],
                [333, 320], [333, 322], [333, 325], [333, 334], [334, 320], [334, 322],
                [334, 325], [334, 333], [334, 334], [334, 313], [334, 319], [334, 330],
                [335, 319], [335, 327], [335, 332], [335, 335], [335, 315], [336, 316],
                [336, 324], [336, 325], [336, 336], [336, 317], [337, 337], [337, 348],
                [338, 338], [338, 343], [338, 349], [338, 351], [338, 360], [338, 356],
                [339, 339], [339, 344], [339, 354], [339, 345], [340, 340], [340, 342],
                [341, 341], [341, 352], [341, 354], [341, 346], [341, 349], [341, 350],
                [341, 357], [342, 342], [342, 345], [342, 355], [342, 340], [343, 338],
                [343, 343], [343, 349], [343, 351], [343, 360], [344, 339], [344, 344],
                [344, 354], [344, 355], [344, 360], [345, 342], [345, 345], [345, 355],
                [345, 339], [346, 346], [346, 353], [346, 356], [346, 341], [346, 349],
                [346, 350], [346, 357], [347, 347], [347, 351], [347, 352], [348, 337],
                [348, 348], [348, 357], [348, 359], [349, 338], [349, 343], [349, 349],
                [349, 351], [349, 360], [349, 341], [349, 346], [349, 350], [349, 357],
                [350, 341], [350, 346], [350, 349], [350, 350], [350, 357], [351, 338],
                [351, 343], [351, 349], [351, 351], [351, 360], [351, 347], [351, 352],
                [352, 341], [352, 352], [352, 354], [352, 347], [352, 351], [353, 346],
                [353, 353], [353, 356], [354, 341], [354, 352], [354, 354], [354, 339],
                [354, 344], [355, 342], [355, 345], [355, 355], [355, 344], [355, 360],
                [356, 346], [356, 353], [356, 356], [356, 338], [357, 348], [357, 357],
                [357, 359], [357, 341], [357, 346], [357, 349], [357, 350], [358, 358],
                [359, 359], [359, 348], [359, 357], [360, 338], [360, 343], [360, 349],
                [360, 351], [360, 360], [360, 344], [360, 355], [361, 361], [361, 366],
                [361, 380], [362, 362], [362, 365], [362, 378], [362, 363], [363, 362],
                [363, 363], [363, 368], [363, 380], [364, 364], [364, 372], [364, 384],
                [364, 366], [365, 362], [365, 365], [365, 378], [365, 371], [365, 374],
                [365, 375], [365, 377], [365, 384], [366, 364], [366, 366], [366, 361],
                [366, 380], [367, 367], [367, 369], [367, 375], [368, 368], [368, 363],
                [368, 380], [369, 367], [369, 369], [369, 376], [370, 370], [370, 378],
                [370, 382], [370, 383], [371, 365], [371, 371], [371, 374], [371, 375],
                [371, 377], [371, 384], [371, 381], [372, 364], [372, 372], [372, 384],
                [372, 373], [373, 373], [373, 379], [373, 372], [374, 374], [374, 365],
                [374, 371], [374, 375], [374, 377], [374, 384], [375, 365], [375, 371],
                [375, 374], [375, 375], [375, 377], [375, 384], [375, 367], [376, 376],
                [376, 369], [377, 377], [377, 365], [377, 371], [377, 374], [377, 375],
                [377, 384], [378, 370], [378, 378], [378, 382], [378, 383], [378, 362],
                [378, 365], [379, 379], [379, 383], [379, 373], [380, 363], [380, 368],
                [380, 380], [380, 361], [380, 366], [381, 371], [381, 381], [381, 382],
                [382, 370], [382, 378], [382, 382], [382, 383], [382, 381], [383, 370],
                [383, 378], [383, 382], [383, 383], [383, 379], [384, 364], [384, 372],
                [384, 384], [384, 365], [384, 371], [384, 374], [384, 375], [384, 377],
                [385, 385], [385, 388], [385, 392], [385, 396], [385, 387], [385, 389],
                [385, 395], [386, 386], [386, 388], [386, 400], [386, 396], [386, 397],
                [386, 399], [386, 403], [387, 387], [387, 385], [387, 389], [387, 395],
                [388, 386], [388, 388], [388, 400], [388, 385], [388, 392], [388, 396],
                [389, 389], [389, 390], [389, 405], [389, 385], [389, 387], [389, 395],
                [390, 389], [390, 390], [390, 405], [390, 401], [390, 407], [391, 391],
                [391, 392], [392, 391], [392, 392], [392, 385], [392, 388], [392, 396],
                [393, 393], [393, 398], [393, 404], [393, 405], [394, 394], [394, 407],
                [394, 403], [395, 385], [395, 387], [395, 389], [395, 395], [396, 385],
                [396, 388], [396, 392], [396, 396], [396, 386], [396, 397], [396, 399],
                [396, 403], [397, 386], [397, 396], [397, 397], [397, 399], [397, 403],
                [398, 393], [398, 398], [398, 401], [399, 399], [399, 402], [399, 386],
                [399, 396], [399, 397], [399, 403], [400, 400], [400, 408], [400, 386],
                [400, 388], [401, 398], [401, 401], [401, 390], [401, 407], [402, 399],
                [402, 402], [403, 386], [403, 396], [403, 397], [403, 399], [403, 403],
                [403, 394], [404, 404], [404, 406], [404, 393], [404, 405], [405, 389],
                [405, 390], [405, 405], [405, 393], [405, 404], [406, 406], [406, 404],
                [407, 390], [407, 401], [407, 407], [407, 394], [408, 400], [408, 408],
                [409, 409], [409, 411], [409, 415], [409, 418], [410, 410], [410, 421],
                [410, 426], [410, 432], [411, 409], [411, 411], [411, 415], [411, 418],
                [411, 412], [411, 423], [412, 412], [412, 413], [412, 431], [412, 411],
                [412, 423], [413, 412], [413, 413], [413, 431], [413, 428], [414, 414],
                [414, 425], [414, 426], [415, 409], [415, 411], [415, 415], [415, 418],
                [415, 427], [415, 429], [416, 416], [416, 417], [416, 418], [416, 429],
                [417, 416], [417, 417], [417, 419], [417, 430], [418, 409], [418, 411],
                [418, 415], [418, 418], [418, 416], [418, 429], [419, 417], [419, 419],
                [419, 430], [419, 422], [419, 423], [419, 424], [420, 420], [420, 421],
                [421, 410], [421, 421], [421, 420], [422, 419], [422, 422], [422, 423],
                [422, 424], [423, 419], [423, 422], [423, 423], [423, 424], [423, 411],
                [423, 412], [424, 419], [424, 422], [424, 423], [424, 424], [424, 425],
                [425, 414], [425, 425], [425, 424], [426, 414], [426, 426], [426, 410],
                [426, 432], [427, 415], [427, 427], [427, 429], [427, 430], [428, 428],
                [428, 413], [429, 415], [429, 427], [429, 429], [429, 416], [429, 418],
                [430, 427], [430, 430], [430, 417], [430, 419], [431, 431], [431, 412],
                [431, 413], [432, 410], [432, 426], [432, 432], [433, 433], [433, 448],
                [433, 455], [433, 434], [433, 447], [434, 433], [434, 434], [434, 447],
                [434, 437], [434, 455], [435, 435], [435, 454], [435, 453], [436, 436],
                [436, 438], [436, 441], [436, 445], [436, 449], [437, 437], [437, 434],
                [437, 455], [438, 436], [438, 438], [438, 441], [438, 444], [438, 446],
                [438, 448], [439, 439], [439, 440], [439, 450], [439, 453], [440, 440],
                [440, 441], [440, 451], [440, 456], [440, 439], [440, 450], [440, 453],
                [441, 440], [441, 441], [441, 451], [441, 456], [441, 436], [441, 438],
                [442, 442], [442, 447], [442, 454], [443, 443], [443, 446], [444, 438],
                [444, 444], [444, 446], [444, 448], [444, 451], [445, 436], [445, 445],
                [445, 449], [446, 438], [446, 444], [446, 446], [446, 448], [446, 443],
                [447, 442], [447, 447], [447, 454], [447, 433], [447, 434], [448, 433],
                [448, 448], [448, 455], [448, 438], [448, 444], [448, 446], [449, 449],
                [449, 450], [449, 436], [449, 445], [450, 439], [450, 440], [450, 450],
                [450, 453], [450, 449], [451, 440], [451, 441], [451, 451], [451, 456],
                [451, 444], [452, 452], [452, 456], [453, 439], [453, 440], [453, 450],
                [453, 453], [453, 435], [454, 435], [454, 454], [454, 442], [454, 447],
                [455, 433], [455, 448], [455, 455], [455, 434], [455, 437], [456, 452],
                [456, 456], [456, 440], [456, 441], [456, 451], [457, 457], [457, 460],
                [457, 473], [457, 476], [458, 458], [458, 459], [458, 475], [458, 476],
                [458, 462], [458, 468], [458, 477], [459, 458], [459, 459], [459, 475],
                [459, 476], [459, 477], [460, 460], [460, 464], [460, 466], [460, 457],
                [460, 473], [460, 476], [461, 461], [461, 469], [461, 478], [462, 462],
                [462, 467], [462, 479], [462, 458], [462, 468], [462, 477], [463, 463],
                [463, 472], [464, 460], [464, 464], [464, 466], [464, 465], [464, 471],
                [464, 479], [465, 465], [465, 473], [465, 464], [465, 471], [465, 479],
                [466, 460], [466, 464], [466, 466], [466, 470], [466, 471], [466, 474],
                [466, 480], [467, 462], [467, 467], [467, 479], [468, 458], [468, 462],
                [468, 468], [468, 477], [469, 469], [469, 461], [469, 478], [470, 470],
                [470, 466], [470, 471], [470, 474], [470, 480], [471, 466], [471, 470],
                [471, 471], [471, 474], [471, 480], [471, 464], [471, 465], [471, 479],
                [472, 472], [472, 463], [473, 465], [473, 473], [473, 457], [473, 460],
                [473, 476], [474, 474], [474, 478], [474, 466], [474, 470], [474, 471],
                [474, 480], [475, 458], [475, 459], [475, 475], [475, 476], [476, 458],
                [476, 459], [476, 475], [476, 476], [476, 457], [476, 460], [476, 473],
                [477, 459], [477, 477], [477, 458], [477, 462], [477, 468], [478, 474],
                [478, 478], [478, 461], [478, 469], [479, 462], [479, 467], [479, 479],
                [479, 464], [479, 465], [479, 471], [480, 466], [480, 470], [480, 471],
                [480, 474], [480, 480], [481, 481], [481, 482], [481, 492], [481, 500],
                [482, 482], [482, 487], [482, 488], [482, 494], [482, 481], [482, 492],
                [482, 500], [483, 483], [483, 495], [484, 484], [484, 491], [484, 503],
                [484, 489], [485, 485], [485, 488], [485, 495], [485, 496], [485, 501],
                [486, 486], [486, 491], [486, 492], [486, 493], [487, 482], [487, 487],
                [487, 488], [487, 494], [487, 496], [487, 504], [488, 485], [488, 488],
                [488, 495], [488, 496], [488, 482], [488, 487], [488, 494], [489, 484],
                [489, 489], [490, 490], [490, 497], [490, 498], [490, 503], [490, 493],
                [490, 501], [491, 486], [491, 491], [491, 484], [491, 503], [492, 481],
                [492, 482], [492, 492], [492, 500], [492, 486], [492, 493], [493, 490],
                [493, 493], [493, 501], [493, 486], [493, 492], [494, 494], [494, 500],
                [494, 482], [494, 487], [494, 488], [495, 485], [495, 488], [495, 495],
                [495, 496], [495, 483], [496, 485], [496, 488], [496, 495], [496, 496],
                [496, 487], [496, 504], [497, 490], [497, 497], [497, 498], [497, 503],
                [497, 499], [498, 490], [498, 497], [498, 498], [498, 503], [499, 499],
                [499, 497], [500, 494], [500, 500], [500, 481], [500, 482], [500, 492],
                [501, 485], [501, 501], [501, 490], [501, 493], [502, 502], [503, 490],
                [503, 497], [503, 498], [503, 503], [503, 484], [503, 491], [504, 504],
                [504, 487], [504, 496], [505, 505], [505, 528], [505, 515], [505, 519],
                [505, 520], [506, 506], [506, 507], [506, 523], [506, 508], [506, 509],
                [506, 514], [507, 507], [507, 522], [507, 525], [507, 526], [507, 506],
                [507, 523], [508, 508], [508, 511], [508, 516], [508, 520], [508, 521],
                [508, 506], [508, 509], [508, 514], [509, 509], [509, 514], [509, 527],
                [509, 506], [509, 508], [510, 510], [510, 526], [510, 527], [511, 508],
                [511, 511], [511, 516], [511, 520], [511, 521], [511, 512], [511, 517],
                [512, 512], [512, 511], [512, 517], [513, 513], [513, 522], [513, 525],
                [514, 509], [514, 514], [514, 527], [514, 506], [514, 508], [515, 515],
                [515, 505], [515, 519], [515, 520], [516, 516], [516, 521], [516, 524],
                [516, 508], [516, 511], [516, 520], [517, 517], [517, 511], [517, 512],
                [518, 518], [518, 523], [519, 519], [519, 505], [519, 515], [519, 520],
                [520, 508], [520, 511], [520, 516], [520, 520], [520, 521], [520, 505],
                [520, 515], [520, 519], [521, 516], [521, 521], [521, 524], [521, 508],
                [521, 511], [521, 520], [522, 507], [522, 522], [522, 525], [522, 526],
                [522, 513], [523, 506], [523, 507], [523, 523], [523, 518], [524, 516],
                [524, 521], [524, 524], [524, 528], [525, 507], [525, 522], [525, 525],
                [525, 526], [525, 513], [526, 510], [526, 526], [526, 527], [526, 507],
                [526, 522], [526, 525], [527, 510], [527, 526], [527, 527], [527, 509],
                [527, 514], [528, 505], [528, 528], [528, 524], [529, 529], [529, 530],
                [529, 531], [529, 538], [529, 552], [529, 546], [529, 549], [530, 530],
                [530, 532], [530, 545], [530, 529], [530, 531], [530, 538], [530, 552],
                [531, 531], [531, 546], [531, 549], [531, 529], [531, 530], [531, 538],
                [531, 552], [532, 530], [532, 532], [532, 545], [532, 537], [532, 551],
                [532, 552], [533, 533], [533, 541], [533, 539], [534, 534], [534, 543],
                [534, 544], [534, 540], [535, 535], [535, 539], [535, 551], [535, 542],
                [536, 536], [536, 540], [536, 548], [536, 544], [537, 537], [537, 538],
                [537, 550], [537, 532], [537, 551], [537, 552], [538, 537], [538, 538],
                [538, 550], [538, 529], [538, 530], [538, 531], [538, 552], [539, 535],
                [539, 539], [539, 551], [539, 533], [540, 536], [540, 540], [540, 548],
                [540, 534], [540, 543], [541, 533], [541, 541], [542, 535], [542, 542],
                [542, 548], [543, 534], [543, 543], [543, 544], [543, 540], [544, 534],
                [544, 543], [544, 544], [544, 536], [545, 545], [545, 547], [545, 530],
                [545, 532], [546, 531], [546, 546], [546, 549], [546, 529], [547, 545],
                [547, 547], [547, 550], [548, 536], [548, 540], [548, 548], [548, 542],
                [549, 531], [549, 546], [549, 549], [549, 529], [550, 537], [550, 538],
                [550, 550], [550, 547], [551, 535], [551, 539], [551, 551], [551, 532],
                [551, 537], [551, 552], [552, 529], [552, 530], [552, 531], [552, 538],
                [552, 552], [552, 532], [552, 537], [552, 551]
            ]);
        });
        test.skip('large example with EdbPredicate', function () {
            var cyl = new slg_1.EdbPredicate(largeSgExampleData);
            var sg = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Y = _b[1];
                return slg_1.rule(function () { return [slg_1.unify(X, Y)]; }, function (Z) { return [cyl.match([X, Z]), sg.match([Z, Z]), cyl.match([Y, Z])]; });
            });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [sg.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [new unify_1.Variable(2), new unify_1.Variable(2)],
                [1, 1], [1, 3], [1, 8], [1, 4], [1, 9], [2, 2],
                [2, 12], [2, 21], [3, 1], [3, 3], [3, 8], [3, 17], [3, 22], [4, 4], [4, 5],
                [4, 1], [4, 9], [5, 5], [5, 6], [5, 7], [5, 9], [5, 4], [6, 5], [6, 6],
                [6, 7], [6, 9], [6, 13], [7, 5], [7, 6], [7, 7], [7, 9], [7, 20], [8, 8],
                [8, 17], [8, 24], [8, 1], [8, 3], [9, 1], [9, 4], [9, 9], [9, 5], [9, 6],
                [9, 7], [10, 10], [10, 12], [10, 14], [10, 23], [10, 13], [10, 15],
                [10, 18], [11, 11], [11, 15], [11, 16], [12, 10], [12, 12], [12, 14],
                [12, 23], [12, 2], [13, 10], [13, 13], [13, 15], [13, 18], [13, 6],
                [14, 14], [14, 10], [14, 12], [14, 23], [15, 10], [15, 13], [15, 15],
                [15, 18], [15, 11], [15, 16], [16, 11], [16, 15], [16, 16], [17, 3],
                [17, 17], [17, 22], [17, 8], [17, 24], [18, 10], [18, 13], [18, 15],
                [18, 18], [18, 20], [18, 22], [19, 19], [19, 21], [20, 18], [20, 20],
                [20, 22], [20, 7], [21, 2], [21, 21], [21, 19], [22, 18], [22, 20],
                [22, 22], [22, 3], [22, 17], [23, 23], [23, 10], [23, 12], [23, 14],
                [24, 24], [24, 8], [24, 17], [25, 25], [25, 29], [25, 40], [25, 39],
                [26, 26], [26, 45], [26, 46], [27, 27], [27, 28], [27, 38], [27, 47],
                [27, 30], [27, 32], [27, 35], [27, 37], [28, 27], [28, 28], [28, 38],
                [28, 47], [28, 48], [29, 29], [29, 35], [29, 25], [29, 40], [30, 27],
                [30, 30], [30, 32], [30, 35], [30, 37], [30, 42], [31, 31], [31, 37],
                [31, 44], [31, 47], [31, 48], [32, 27], [32, 30], [32, 32], [32, 35],
                [32, 37], [33, 33], [33, 42], [33, 44], [33, 46], [34, 34], [34, 36],
                [34, 41], [35, 29], [35, 35], [35, 27], [35, 30], [35, 32], [35, 37],
                [36, 34], [36, 36], [36, 41], [36, 39], [37, 31], [37, 37], [37, 44],
                [37, 27], [37, 30], [37, 32], [37, 35], [38, 38], [38, 43], [38, 27],
                [38, 28], [38, 47], [39, 36], [39, 39], [39, 25], [40, 40], [40, 25],
                [40, 29], [41, 41], [41, 34], [41, 36], [42, 33], [42, 42], [42, 44],
                [42, 30], [43, 38], [43, 43], [44, 31], [44, 37], [44, 44], [44, 33],
                [44, 42], [45, 45], [45, 26], [45, 46], [46, 26], [46, 45], [46, 46],
                [46, 33], [47, 27], [47, 28], [47, 38], [47, 47], [47, 31], [47, 48],
                [48, 31], [48, 47], [48, 48], [48, 28], [49, 49], [49, 50], [49, 52],
                [49, 70], [49, 68], [49, 72], [50, 50], [50, 53], [50, 69], [50, 49],
                [50, 52], [50, 70], [51, 51], [51, 62], [51, 55], [51, 64], [51, 71],
                [52, 49], [52, 50], [52, 52], [52, 70], [52, 56], [52, 57], [53, 53],
                [53, 58], [53, 50], [53, 69], [54, 54], [54, 63], [54, 65], [54, 66],
                [54, 67], [54, 55], [54, 58], [54, 60], [55, 54], [55, 55], [55, 58],
                [55, 60], [55, 51], [55, 64], [55, 71], [56, 56], [56, 59], [56, 67],
                [56, 52], [56, 57], [57, 52], [57, 56], [57, 57], [57, 70], [58, 54],
                [58, 55], [58, 58], [58, 60], [58, 53], [59, 59], [59, 61], [59, 56],
                [59, 67], [60, 60], [60, 64], [60, 69], [60, 54], [60, 55], [60, 58],
                [61, 61], [61, 63], [61, 59], [62, 62], [62, 51], [63, 61], [63, 63],
                [63, 54], [63, 65], [63, 66], [63, 67], [64, 51], [64, 55], [64, 64],
                [64, 71], [64, 60], [64, 69], [65, 65], [65, 54], [65, 63], [65, 66],
                [65, 67], [66, 54], [66, 63], [66, 65], [66, 66], [66, 67], [66, 72],
                [67, 56], [67, 59], [67, 67], [67, 54], [67, 63], [67, 65], [67, 66],
                [68, 49], [68, 68], [68, 72], [69, 60], [69, 64], [69, 69], [69, 50],
                [69, 53], [70, 49], [70, 50], [70, 52], [70, 70], [70, 57], [71, 51],
                [71, 55], [71, 64], [71, 71], [72, 49], [72, 68], [72, 72], [72, 66],
                [73, 73], [73, 75], [73, 82], [73, 83], [73, 87], [74, 74], [74, 79],
                [74, 92], [75, 73], [75, 75], [75, 82], [75, 77], [76, 76], [76, 78],
                [76, 81], [76, 91], [76, 96], [77, 75], [77, 77], [77, 81], [77, 90],
                [77, 92], [77, 95], [78, 76], [78, 78], [78, 93], [79, 74], [79, 79],
                [79, 80], [79, 89], [80, 79], [80, 80], [80, 89], [81, 77], [81, 81],
                [81, 90], [81, 92], [81, 95], [81, 76], [81, 91], [81, 96], [82, 82],
                [82, 83], [82, 96], [82, 73], [82, 75], [83, 73], [83, 83], [83, 87],
                [83, 82], [83, 96], [84, 84], [84, 85], [84, 93], [85, 85], [85, 84],
                [85, 93], [86, 86], [87, 73], [87, 83], [87, 87], [87, 88], [88, 88],
                [88, 95], [88, 87], [89, 89], [89, 94], [89, 79], [89, 80], [90, 90],
                [90, 77], [90, 81], [90, 92], [90, 95], [91, 76], [91, 81], [91, 91],
                [91, 96], [92, 74], [92, 92], [92, 77], [92, 81], [92, 90], [92, 95],
                [93, 78], [93, 93], [93, 84], [93, 85], [94, 94], [94, 89], [95, 88],
                [95, 95], [95, 77], [95, 81], [95, 90], [95, 92], [96, 82], [96, 83],
                [96, 96], [96, 76], [96, 81], [96, 91], [97, 97], [97, 101], [97, 119],
                [97, 104], [97, 108], [98, 98], [98, 116], [98, 117], [99, 99], [99, 110],
                [100, 100], [101, 101], [101, 97], [101, 119], [102, 102], [102, 106],
                [102, 112], [102, 118], [102, 103], [102, 105], [103, 102], [103, 103],
                [103, 105], [103, 118], [103, 111], [103, 115], [104, 104], [104, 117],
                [104, 120], [104, 97], [104, 108], [105, 105], [105, 108], [105, 116],
                [105, 102], [105, 103], [105, 118], [106, 102], [106, 106], [106, 112],
                [106, 118], [106, 109], [106, 113], [107, 107], [107, 111], [108, 105],
                [108, 108], [108, 116], [108, 97], [108, 104], [109, 106], [109, 109],
                [109, 112], [109, 113], [110, 99], [110, 110], [111, 107], [111, 111],
                [111, 103], [111, 115], [112, 106], [112, 109], [112, 112], [112, 113],
                [112, 102], [112, 118], [113, 109], [113, 113], [113, 106], [113, 112],
                [114, 114], [114, 115], [114, 120], [115, 103], [115, 111], [115, 115],
                [115, 114], [115, 120], [116, 98], [116, 116], [116, 105], [116, 108],
                [117, 104], [117, 117], [117, 120], [117, 98], [118, 102], [118, 103],
                [118, 105], [118, 118], [118, 106], [118, 112], [119, 119], [119, 97],
                [119, 101], [120, 104], [120, 117], [120, 120], [120, 114], [120, 115],
                [121, 121], [121, 129], [121, 132], [121, 127], [122, 122], [122, 130],
                [122, 143], [122, 126], [122, 135], [123, 123], [123, 129], [123, 124],
                [123, 141], [124, 124], [124, 134], [124, 142], [124, 144], [124, 123],
                [124, 141], [125, 125], [125, 137], [125, 133], [125, 139], [125, 140],
                [125, 142], [126, 126], [126, 127], [126, 140], [126, 122], [126, 135],
                [127, 121], [127, 127], [127, 126], [127, 140], [128, 128], [128, 130],
                [128, 137], [128, 138], [129, 121], [129, 129], [129, 132], [129, 123],
                [130, 128], [130, 130], [130, 122], [130, 143], [131, 131], [132, 121],
                [132, 129], [132, 132], [132, 136], [132, 139], [133, 133], [133, 144],
                [133, 125], [133, 139], [133, 140], [133, 142], [134, 134], [134, 124],
                [134, 142], [134, 144], [135, 122], [135, 126], [135, 135], [136, 136],
                [136, 132], [136, 139], [137, 125], [137, 137], [137, 128], [137, 138],
                [138, 138], [138, 128], [138, 137], [139, 125], [139, 133], [139, 139],
                [139, 140], [139, 142], [139, 132], [139, 136], [140, 126], [140, 127],
                [140, 140], [140, 125], [140, 133], [140, 139], [140, 142], [141, 123],
                [141, 124], [141, 141], [142, 125], [142, 133], [142, 139], [142, 140],
                [142, 142], [142, 124], [142, 134], [142, 144], [143, 143], [143, 122],
                [143, 130], [144, 124], [144, 134], [144, 142], [144, 144], [144, 133],
                [145, 145], [145, 155], [145, 156], [145, 146], [146, 146], [146, 149],
                [146, 155], [146, 145], [147, 147], [147, 154], [147, 158], [147, 163],
                [147, 152], [147, 162], [148, 148], [148, 151], [148, 165], [148, 161],
                [148, 168], [149, 146], [149, 149], [149, 155], [149, 158], [149, 164],
                [150, 150], [150, 159], [150, 161], [150, 163], [150, 154], [150, 160],
                [151, 151], [151, 148], [151, 165], [152, 152], [152, 156], [152, 166],
                [152, 147], [152, 162], [153, 153], [153, 164], [153, 168], [154, 150],
                [154, 154], [154, 160], [154, 147], [154, 158], [154, 163], [155, 145],
                [155, 155], [155, 156], [155, 146], [155, 149], [156, 152], [156, 156],
                [156, 166], [156, 145], [156, 155], [157, 157], [157, 167], [158, 149],
                [158, 158], [158, 164], [158, 147], [158, 154], [158, 163], [159, 150],
                [159, 159], [159, 161], [159, 163], [160, 150], [160, 154], [160, 160],
                [161, 148], [161, 161], [161, 168], [161, 150], [161, 159], [161, 163],
                [162, 162], [162, 147], [162, 152], [163, 147], [163, 154], [163, 158],
                [163, 163], [163, 150], [163, 159], [163, 161], [164, 149], [164, 158],
                [164, 164], [164, 153], [164, 168], [165, 165], [165, 167], [165, 148],
                [165, 151], [166, 166], [166, 152], [166, 156], [167, 157], [167, 167],
                [167, 165], [168, 148], [168, 161], [168, 168], [168, 153], [168, 164],
                [169, 169], [169, 177], [169, 181], [170, 170], [170, 173], [170, 176],
                [170, 178], [170, 184], [171, 171], [171, 186], [171, 191], [171, 192],
                [172, 172], [172, 174], [172, 180], [173, 173], [173, 189], [173, 170],
                [173, 176], [174, 174], [174, 186], [174, 172], [175, 175], [175, 189],
                [175, 184], [175, 188], [176, 170], [176, 173], [176, 176], [176, 188],
                [177, 177], [177, 178], [177, 169], [177, 181], [178, 177], [178, 178],
                [178, 170], [178, 184], [179, 179], [179, 182], [179, 185], [180, 180],
                [180, 172], [181, 181], [181, 187], [181, 191], [181, 169], [181, 177],
                [182, 179], [182, 182], [182, 185], [182, 187], [182, 190], [183, 183],
                [184, 170], [184, 178], [184, 184], [184, 175], [184, 188], [185, 179],
                [185, 182], [185, 185], [185, 192], [186, 171], [186, 186], [186, 174],
                [187, 181], [187, 187], [187, 191], [187, 182], [187, 190], [188, 175],
                [188, 184], [188, 188], [188, 176], [189, 173], [189, 189], [189, 175],
                [190, 190], [190, 182], [190, 187], [191, 181], [191, 187], [191, 191],
                [191, 171], [191, 192], [192, 185], [192, 192], [192, 171], [192, 191],
                [193, 193], [193, 194], [193, 211], [193, 215], [194, 194], [194, 198],
                [194, 207], [194, 216], [194, 193], [195, 195], [195, 210], [195, 196],
                [195, 200], [195, 201], [195, 206], [195, 214], [196, 196], [196, 205],
                [196, 212], [196, 214], [196, 195], [196, 200], [196, 201], [196, 206],
                [197, 197], [197, 204], [197, 213], [197, 199], [197, 206], [197, 216],
                [198, 194], [198, 198], [198, 207], [198, 216], [199, 197], [199, 199],
                [199, 204], [199, 206], [199, 216], [199, 200], [199, 211], [200, 195],
                [200, 196], [200, 200], [200, 201], [200, 206], [200, 214], [200, 199],
                [200, 211], [201, 195], [201, 196], [201, 200], [201, 201], [201, 206],
                [201, 214], [202, 202], [202, 203], [202, 205], [202, 209], [203, 203],
                [203, 208], [203, 202], [203, 205], [203, 209], [204, 197], [204, 199],
                [204, 204], [204, 206], [204, 216], [204, 213], [205, 196], [205, 205],
                [205, 212], [205, 214], [205, 202], [205, 203], [205, 209], [206, 197],
                [206, 199], [206, 204], [206, 206], [206, 216], [206, 195], [206, 196],
                [206, 200], [206, 201], [206, 214], [207, 207], [207, 212], [207, 194],
                [207, 198], [207, 216], [208, 203], [208, 208], [208, 215], [209, 202],
                [209, 203], [209, 205], [209, 209], [210, 210], [210, 195], [211, 199],
                [211, 200], [211, 211], [211, 193], [211, 215], [212, 196], [212, 205],
                [212, 212], [212, 214], [212, 207], [213, 213], [213, 197], [213, 204],
                [214, 195], [214, 196], [214, 200], [214, 201], [214, 206], [214, 214],
                [214, 205], [214, 212], [215, 193], [215, 211], [215, 215], [215, 208],
                [216, 197], [216, 199], [216, 204], [216, 206], [216, 216], [216, 194],
                [216, 198], [216, 207], [217, 217], [217, 220], [217, 238], [217, 230],
                [217, 234], [218, 218], [218, 239], [218, 223], [219, 219], [219, 225],
                [220, 220], [220, 229], [220, 233], [220, 217], [220, 238], [221, 221],
                [221, 222], [221, 237], [222, 222], [222, 231], [222, 240], [222, 221],
                [223, 223], [223, 229], [223, 230], [223, 218], [224, 224], [224, 233],
                [224, 232], [224, 237], [225, 225], [225, 235], [225, 219], [226, 226],
                [226, 240], [226, 228], [227, 227], [227, 232], [227, 231], [227, 235],
                [228, 228], [228, 226], [229, 223], [229, 229], [229, 230], [229, 220],
                [229, 233], [230, 223], [230, 229], [230, 230], [230, 217], [230, 234],
                [231, 227], [231, 231], [231, 235], [231, 222], [231, 240], [232, 224],
                [232, 232], [232, 237], [232, 227], [233, 224], [233, 233], [233, 220],
                [233, 229], [234, 217], [234, 230], [234, 234], [234, 238], [234, 239],
                [235, 227], [235, 231], [235, 235], [235, 225], [236, 236], [237, 221],
                [237, 237], [237, 224], [237, 232], [238, 234], [238, 238], [238, 239],
                [238, 217], [238, 220], [239, 234], [239, 238], [239, 239], [239, 218],
                [240, 222], [240, 231], [240, 240], [240, 226], [241, 241], [241, 255],
                [242, 242], [242, 253], [242, 257], [242, 261], [243, 243], [243, 249],
                [243, 250], [243, 258], [243, 247], [244, 244], [244, 248], [244, 251],
                [245, 245], [245, 258], [245, 262], [246, 246], [246, 257], [246, 260],
                [246, 248], [246, 250], [246, 254], [246, 256], [246, 259], [246, 264],
                [247, 243], [247, 247], [248, 244], [248, 248], [248, 251], [248, 246],
                [248, 250], [248, 254], [248, 256], [248, 259], [248, 264], [249, 249],
                [249, 263], [249, 243], [249, 250], [249, 258], [250, 246], [250, 248],
                [250, 250], [250, 254], [250, 256], [250, 259], [250, 264], [250, 243],
                [250, 249], [250, 258], [251, 251], [251, 244], [251, 248], [252, 252],
                [252, 253], [252, 259], [252, 261], [252, 262], [252, 260], [252, 263],
                [253, 242], [253, 253], [253, 257], [253, 252], [253, 259], [253, 261],
                [253, 262], [254, 246], [254, 248], [254, 250], [254, 254], [254, 256],
                [254, 259], [254, 264], [255, 241], [255, 255], [256, 246], [256, 248],
                [256, 250], [256, 254], [256, 256], [256, 259], [256, 264], [257, 246],
                [257, 257], [257, 260], [257, 242], [257, 253], [258, 243], [258, 249],
                [258, 250], [258, 258], [258, 245], [258, 262], [259, 246], [259, 248],
                [259, 250], [259, 254], [259, 256], [259, 259], [259, 264], [259, 252],
                [259, 253], [259, 261], [259, 262], [260, 246], [260, 257], [260, 260],
                [260, 252], [260, 263], [261, 242], [261, 261], [261, 252], [261, 253],
                [261, 259], [261, 262], [262, 245], [262, 258], [262, 262], [262, 252],
                [262, 253], [262, 259], [262, 261], [263, 252], [263, 260], [263, 263],
                [263, 249], [264, 264], [264, 246], [264, 248], [264, 250], [264, 254],
                [264, 256], [264, 259], [265, 265], [265, 278], [265, 270], [266, 266],
                [266, 278], [266, 279], [266, 284], [266, 269], [267, 267], [267, 276],
                [267, 286], [267, 288], [267, 270], [267, 283], [267, 285], [268, 268],
                [268, 282], [268, 288], [268, 281], [268, 286], [269, 269], [269, 266],
                [270, 265], [270, 270], [270, 267], [270, 283], [270, 285], [271, 271],
                [271, 273], [271, 282], [271, 287], [271, 280], [272, 272], [272, 275],
                [272, 279], [272, 281], [272, 283], [272, 276], [273, 271], [273, 273],
                [273, 282], [273, 287], [273, 280], [274, 274], [274, 277], [275, 272],
                [275, 275], [275, 279], [275, 281], [275, 283], [275, 277], [276, 267],
                [276, 276], [276, 286], [276, 288], [276, 272], [277, 274], [277, 277],
                [277, 275], [278, 265], [278, 278], [278, 266], [278, 279], [278, 284],
                [279, 266], [279, 278], [279, 279], [279, 284], [279, 272], [279, 275],
                [279, 281], [279, 283], [280, 271], [280, 273], [280, 280], [280, 285],
                [281, 272], [281, 275], [281, 279], [281, 281], [281, 283], [281, 268],
                [281, 286], [282, 271], [282, 273], [282, 282], [282, 287], [282, 268],
                [282, 288], [283, 267], [283, 270], [283, 283], [283, 285], [283, 272],
                [283, 275], [283, 279], [283, 281], [284, 266], [284, 278], [284, 279],
                [284, 284], [285, 280], [285, 285], [285, 267], [285, 270], [285, 283],
                [286, 267], [286, 276], [286, 286], [286, 288], [286, 268], [286, 281],
                [287, 271], [287, 273], [287, 282], [287, 287], [288, 268], [288, 282],
                [288, 288], [288, 267], [288, 276], [288, 286], [289, 289], [289, 296],
                [289, 297], [289, 304], [289, 310], [289, 312], [289, 294], [290, 290],
                [290, 294], [291, 291], [291, 301], [291, 307], [291, 296], [292, 292],
                [292, 293], [292, 301], [293, 292], [293, 293], [293, 301], [293, 300],
                [294, 290], [294, 294], [294, 289], [295, 295], [295, 297], [295, 299],
                [295, 305], [295, 309], [295, 302], [295, 306], [295, 311], [296, 291],
                [296, 296], [296, 289], [296, 297], [296, 304], [296, 310], [296, 312],
                [297, 295], [297, 297], [297, 299], [297, 305], [297, 309], [297, 289],
                [297, 296], [297, 304], [297, 310], [297, 312], [298, 298], [298, 305],
                [298, 311], [298, 312], [298, 308], [299, 295], [299, 297], [299, 299],
                [299, 305], [299, 309], [300, 300], [300, 308], [300, 293], [301, 292],
                [301, 293], [301, 301], [301, 291], [301, 307], [302, 295], [302, 302],
                [302, 306], [302, 311], [303, 303], [303, 309], [303, 304], [303, 306],
                [304, 303], [304, 304], [304, 306], [304, 289], [304, 296], [304, 297],
                [304, 310], [304, 312], [305, 298], [305, 305], [305, 311], [305, 312],
                [305, 295], [305, 297], [305, 299], [305, 309], [306, 295], [306, 302],
                [306, 306], [306, 311], [306, 303], [306, 304], [307, 307], [307, 291],
                [307, 301], [308, 298], [308, 308], [308, 300], [309, 295], [309, 297],
                [309, 299], [309, 305], [309, 309], [309, 303], [310, 289], [310, 296],
                [310, 297], [310, 304], [310, 310], [310, 312], [311, 298], [311, 305],
                [311, 311], [311, 312], [311, 295], [311, 302], [311, 306], [312, 298],
                [312, 305], [312, 311], [312, 312], [312, 289], [312, 296], [312, 297],
                [312, 304], [312, 310], [313, 313], [313, 319], [313, 330], [313, 334],
                [314, 314], [314, 317], [315, 315], [315, 335], [316, 316], [316, 329],
                [316, 333], [316, 324], [316, 325], [316, 336], [317, 317], [317, 336],
                [317, 314], [318, 318], [318, 323], [318, 329], [319, 313], [319, 319],
                [319, 330], [319, 334], [319, 327], [319, 332], [319, 335], [320, 320],
                [320, 321], [320, 322], [320, 325], [320, 333], [320, 334], [321, 320],
                [321, 321], [321, 331], [322, 322], [322, 332], [322, 320], [322, 325],
                [322, 333], [322, 334], [323, 318], [323, 323], [324, 316], [324, 324],
                [324, 325], [324, 336], [324, 328], [324, 331], [325, 320], [325, 322],
                [325, 325], [325, 333], [325, 334], [325, 316], [325, 324], [325, 336],
                [326, 326], [326, 327], [326, 330], [327, 326], [327, 327], [327, 319],
                [327, 332], [327, 335], [328, 328], [328, 324], [328, 331], [329, 318],
                [329, 329], [329, 316], [329, 333], [330, 313], [330, 319], [330, 330],
                [330, 334], [330, 326], [331, 321], [331, 331], [331, 324], [331, 328],
                [332, 322], [332, 332], [332, 319], [332, 327], [332, 335], [333, 316],
                [333, 329], [333, 333], [333, 320], [333, 322], [333, 325], [333, 334],
                [334, 320], [334, 322], [334, 325], [334, 333], [334, 334], [334, 313],
                [334, 319], [334, 330], [335, 315], [335, 335], [335, 319], [335, 327],
                [335, 332], [336, 316], [336, 324], [336, 325], [336, 336], [336, 317],
                [337, 337], [337, 348], [338, 338], [338, 343], [338, 349], [338, 351],
                [338, 360], [338, 356], [339, 339], [339, 344], [339, 354], [339, 345],
                [340, 340], [340, 342], [341, 341], [341, 346], [341, 349], [341, 350],
                [341, 357], [341, 352], [341, 354], [342, 340], [342, 342], [342, 345],
                [342, 355], [343, 338], [343, 343], [343, 349], [343, 351], [343, 360],
                [344, 344], [344, 355], [344, 360], [344, 339], [344, 354], [345, 342],
                [345, 345], [345, 355], [345, 339], [346, 346], [346, 353], [346, 356],
                [346, 341], [346, 349], [346, 350], [346, 357], [347, 347], [347, 351],
                [347, 352], [348, 348], [348, 357], [348, 359], [348, 337], [349, 341],
                [349, 346], [349, 349], [349, 350], [349, 357], [349, 338], [349, 343],
                [349, 351], [349, 360], [350, 350], [350, 341], [350, 346], [350, 349],
                [350, 357], [351, 347], [351, 351], [351, 352], [351, 338], [351, 343],
                [351, 349], [351, 360], [352, 347], [352, 351], [352, 352], [352, 341],
                [352, 354], [353, 346], [353, 353], [353, 356], [354, 339], [354, 344],
                [354, 354], [354, 341], [354, 352], [355, 342], [355, 345], [355, 355],
                [355, 344], [355, 360], [356, 346], [356, 353], [356, 356], [356, 338],
                [357, 348], [357, 357], [357, 359], [357, 341], [357, 346], [357, 349],
                [357, 350], [358, 358], [359, 348], [359, 357], [359, 359], [360, 344],
                [360, 355], [360, 360], [360, 338], [360, 343], [360, 349], [360, 351],
                [361, 361], [361, 366], [361, 380], [362, 362], [362, 365], [362, 378],
                [362, 363], [363, 362], [363, 363], [363, 368], [363, 380], [364, 364],
                [364, 372], [364, 384], [364, 366], [365, 365], [365, 371], [365, 374],
                [365, 375], [365, 377], [365, 384], [365, 362], [365, 378], [366, 364],
                [366, 366], [366, 361], [366, 380], [367, 367], [367, 375], [367, 369],
                [368, 368], [368, 363], [368, 380], [369, 367], [369, 369], [369, 376],
                [370, 370], [370, 378], [370, 382], [370, 383], [371, 371], [371, 381],
                [371, 365], [371, 374], [371, 375], [371, 377], [371, 384], [372, 372],
                [372, 373], [372, 364], [372, 384], [373, 372], [373, 373], [373, 379],
                [374, 374], [374, 365], [374, 371], [374, 375], [374, 377], [374, 384],
                [375, 367], [375, 375], [375, 365], [375, 371], [375, 374], [375, 377],
                [375, 384], [376, 369], [376, 376], [377, 365], [377, 371], [377, 374],
                [377, 375], [377, 377], [377, 384], [378, 362], [378, 365], [378, 378],
                [378, 370], [378, 382], [378, 383], [379, 373], [379, 379], [379, 383],
                [380, 361], [380, 366], [380, 380], [380, 363], [380, 368], [381, 371],
                [381, 381], [381, 382], [382, 370], [382, 378], [382, 382], [382, 383],
                [382, 381], [383, 370], [383, 378], [383, 382], [383, 383], [383, 379],
                [384, 365], [384, 371], [384, 374], [384, 375], [384, 377], [384, 384],
                [384, 364], [384, 372], [385, 385], [385, 388], [385, 392], [385, 396],
                [385, 387], [385, 389], [385, 395], [386, 386], [386, 396], [386, 397],
                [386, 399], [386, 403], [386, 388], [386, 400], [387, 387], [387, 385],
                [387, 389], [387, 395], [388, 386], [388, 388], [388, 400], [388, 385],
                [388, 392], [388, 396], [389, 385], [389, 387], [389, 389], [389, 395],
                [389, 390], [389, 405], [390, 389], [390, 390], [390, 405], [390, 401],
                [390, 407], [391, 391], [391, 392], [392, 385], [392, 388], [392, 392],
                [392, 396], [392, 391], [393, 393], [393, 404], [393, 405], [393, 398],
                [394, 394], [394, 407], [394, 403], [395, 385], [395, 387], [395, 389],
                [395, 395], [396, 385], [396, 388], [396, 392], [396, 396], [396, 386],
                [396, 397], [396, 399], [396, 403], [397, 397], [397, 386], [397, 396],
                [397, 399], [397, 403], [398, 398], [398, 401], [398, 393], [399, 386],
                [399, 396], [399, 397], [399, 399], [399, 403], [399, 402], [400, 386],
                [400, 388], [400, 400], [400, 408], [401, 398], [401, 401], [401, 390],
                [401, 407], [402, 402], [402, 399], [403, 394], [403, 403], [403, 386],
                [403, 396], [403, 397], [403, 399], [404, 393], [404, 404], [404, 405],
                [404, 406], [405, 389], [405, 390], [405, 405], [405, 393], [405, 404],
                [406, 404], [406, 406], [407, 390], [407, 401], [407, 407], [407, 394],
                [408, 400], [408, 408], [409, 409], [409, 411], [409, 415], [409, 418],
                [410, 410], [410, 426], [410, 432], [410, 421], [411, 411], [411, 412],
                [411, 423], [411, 409], [411, 415], [411, 418], [412, 412], [412, 413],
                [412, 431], [412, 411], [412, 423], [413, 413], [413, 428], [413, 412],
                [413, 431], [414, 414], [414, 426], [414, 425], [415, 409], [415, 411],
                [415, 415], [415, 418], [415, 427], [415, 429], [416, 416], [416, 417],
                [416, 418], [416, 429], [417, 416], [417, 417], [417, 419], [417, 430],
                [418, 409], [418, 411], [418, 415], [418, 418], [418, 416], [418, 429],
                [419, 419], [419, 422], [419, 423], [419, 424], [419, 417], [419, 430],
                [420, 420], [420, 421], [421, 410], [421, 421], [421, 420], [422, 419],
                [422, 422], [422, 423], [422, 424], [423, 411], [423, 412], [423, 423],
                [423, 419], [423, 422], [423, 424], [424, 419], [424, 422], [424, 423],
                [424, 424], [424, 425], [425, 414], [425, 425], [425, 424], [426, 410],
                [426, 426], [426, 432], [426, 414], [427, 415], [427, 427], [427, 429],
                [427, 430], [428, 413], [428, 428], [429, 415], [429, 427], [429, 429],
                [429, 416], [429, 418], [430, 417], [430, 419], [430, 430], [430, 427],
                [431, 412], [431, 413], [431, 431], [432, 410], [432, 426], [432, 432],
                [433, 433], [433, 448], [433, 455], [433, 434], [433, 447], [434, 433],
                [434, 434], [434, 447], [434, 437], [434, 455], [435, 435], [435, 453],
                [435, 454], [436, 436], [436, 438], [436, 441], [436, 445], [436, 449],
                [437, 434], [437, 437], [437, 455], [438, 438], [438, 444], [438, 446],
                [438, 448], [438, 436], [438, 441], [439, 439], [439, 440], [439, 450],
                [439, 453], [440, 440], [440, 441], [440, 451], [440, 456], [440, 439],
                [440, 450], [440, 453], [441, 436], [441, 438], [441, 441], [441, 440],
                [441, 451], [441, 456], [442, 442], [442, 447], [442, 454], [443, 443],
                [443, 446], [444, 444], [444, 451], [444, 438], [444, 446], [444, 448],
                [445, 436], [445, 445], [445, 449], [446, 443], [446, 446], [446, 438],
                [446, 444], [446, 448], [447, 442], [447, 447], [447, 454], [447, 433],
                [447, 434], [448, 433], [448, 448], [448, 455], [448, 438], [448, 444],
                [448, 446], [449, 449], [449, 450], [449, 436], [449, 445], [450, 449],
                [450, 450], [450, 439], [450, 440], [450, 453], [451, 440], [451, 441],
                [451, 451], [451, 456], [451, 444], [452, 452], [452, 456], [453, 435],
                [453, 453], [453, 439], [453, 440], [453, 450], [454, 442], [454, 447],
                [454, 454], [454, 435], [455, 433], [455, 448], [455, 455], [455, 434],
                [455, 437], [456, 452], [456, 456], [456, 440], [456, 441], [456, 451],
                [457, 457], [457, 460], [457, 473], [457, 476], [458, 458], [458, 462],
                [458, 468], [458, 477], [458, 459], [458, 475], [458, 476], [459, 458],
                [459, 459], [459, 475], [459, 476], [459, 477], [460, 460], [460, 464],
                [460, 466], [460, 457], [460, 473], [460, 476], [461, 461], [461, 469],
                [461, 478], [462, 462], [462, 467], [462, 479], [462, 458], [462, 468],
                [462, 477], [463, 463], [463, 472], [464, 460], [464, 464], [464, 466],
                [464, 465], [464, 471], [464, 479], [465, 465], [465, 473], [465, 464],
                [465, 471], [465, 479], [466, 460], [466, 464], [466, 466], [466, 470],
                [466, 471], [466, 474], [466, 480], [467, 462], [467, 467], [467, 479],
                [468, 458], [468, 462], [468, 468], [468, 477], [469, 469], [469, 461],
                [469, 478], [470, 470], [470, 466], [470, 471], [470, 474], [470, 480],
                [471, 464], [471, 465], [471, 471], [471, 479], [471, 466], [471, 470],
                [471, 474], [471, 480], [472, 463], [472, 472], [473, 457], [473, 460],
                [473, 473], [473, 476], [473, 465], [474, 474], [474, 478], [474, 466],
                [474, 470], [474, 471], [474, 480], [475, 458], [475, 459], [475, 475],
                [475, 476], [476, 458], [476, 459], [476, 475], [476, 476], [476, 457],
                [476, 460], [476, 473], [477, 458], [477, 462], [477, 468], [477, 477],
                [477, 459], [478, 461], [478, 469], [478, 478], [478, 474], [479, 464],
                [479, 465], [479, 471], [479, 479], [479, 462], [479, 467], [480, 480],
                [480, 466], [480, 470], [480, 471], [480, 474], [481, 481], [481, 482],
                [481, 492], [481, 500], [482, 481], [482, 482], [482, 492], [482, 500],
                [482, 487], [482, 488], [482, 494], [483, 483], [483, 495], [484, 484],
                [484, 489], [484, 491], [484, 503], [485, 485], [485, 501], [485, 488],
                [485, 495], [485, 496], [486, 486], [486, 491], [486, 492], [486, 493],
                [487, 487], [487, 496], [487, 504], [487, 482], [487, 488], [487, 494],
                [488, 485], [488, 488], [488, 495], [488, 496], [488, 482], [488, 487],
                [488, 494], [489, 484], [489, 489], [490, 490], [490, 493], [490, 501],
                [490, 497], [490, 498], [490, 503], [491, 484], [491, 491], [491, 503],
                [491, 486], [492, 486], [492, 492], [492, 493], [492, 481], [492, 482],
                [492, 500], [493, 486], [493, 492], [493, 493], [493, 490], [493, 501],
                [494, 482], [494, 487], [494, 488], [494, 494], [494, 500], [495, 483],
                [495, 495], [495, 485], [495, 488], [495, 496], [496, 485], [496, 488],
                [496, 495], [496, 496], [496, 487], [496, 504], [497, 497], [497, 499],
                [497, 490], [497, 498], [497, 503], [498, 498], [498, 490], [498, 497],
                [498, 503], [499, 499], [499, 497], [500, 481], [500, 482], [500, 492],
                [500, 500], [500, 494], [501, 485], [501, 501], [501, 490], [501, 493],
                [502, 502], [503, 490], [503, 497], [503, 498], [503, 503], [503, 484],
                [503, 491], [504, 487], [504, 496], [504, 504], [505, 505], [505, 515],
                [505, 519], [505, 520], [505, 528], [506, 506], [506, 508], [506, 509],
                [506, 514], [506, 507], [506, 523], [507, 506], [507, 507], [507, 523],
                [507, 522], [507, 525], [507, 526], [508, 506], [508, 508], [508, 509],
                [508, 514], [508, 511], [508, 516], [508, 520], [508, 521], [509, 509],
                [509, 514], [509, 527], [509, 506], [509, 508], [510, 510], [510, 526],
                [510, 527], [511, 508], [511, 511], [511, 516], [511, 520], [511, 521],
                [511, 512], [511, 517], [512, 512], [512, 511], [512, 517], [513, 513],
                [513, 522], [513, 525], [514, 506], [514, 508], [514, 509], [514, 514],
                [514, 527], [515, 515], [515, 505], [515, 519], [515, 520], [516, 508],
                [516, 511], [516, 516], [516, 520], [516, 521], [516, 524], [517, 517],
                [517, 511], [517, 512], [518, 518], [518, 523], [519, 519], [519, 505],
                [519, 515], [519, 520], [520, 505], [520, 515], [520, 519], [520, 520],
                [520, 508], [520, 511], [520, 516], [520, 521], [521, 516], [521, 521],
                [521, 524], [521, 508], [521, 511], [521, 520], [522, 513], [522, 522],
                [522, 525], [522, 507], [522, 526], [523, 506], [523, 507], [523, 523],
                [523, 518], [524, 524], [524, 528], [524, 516], [524, 521], [525, 507],
                [525, 522], [525, 525], [525, 526], [525, 513], [526, 507], [526, 522],
                [526, 525], [526, 526], [526, 510], [526, 527], [527, 509], [527, 514],
                [527, 527], [527, 510], [527, 526], [528, 524], [528, 528], [528, 505],
                [529, 529], [529, 530], [529, 531], [529, 538], [529, 552], [529, 546],
                [529, 549], [530, 530], [530, 532], [530, 545], [530, 529], [530, 531],
                [530, 538], [530, 552], [531, 529], [531, 530], [531, 531], [531, 538],
                [531, 552], [531, 546], [531, 549], [532, 532], [532, 537], [532, 551],
                [532, 552], [532, 530], [532, 545], [533, 533], [533, 541], [533, 539],
                [534, 534], [534, 543], [534, 544], [534, 540], [535, 535], [535, 542],
                [535, 539], [535, 551], [536, 536], [536, 544], [536, 540], [536, 548],
                [537, 537], [537, 538], [537, 550], [537, 532], [537, 551], [537, 552],
                [538, 529], [538, 530], [538, 531], [538, 538], [538, 552], [538, 537],
                [538, 550], [539, 535], [539, 539], [539, 551], [539, 533], [540, 536],
                [540, 540], [540, 548], [540, 534], [540, 543], [541, 541], [541, 533],
                [542, 542], [542, 548], [542, 535], [543, 534], [543, 540], [543, 543],
                [543, 544], [544, 536], [544, 544], [544, 534], [544, 543], [545, 545],
                [545, 547], [545, 530], [545, 532], [546, 531], [546, 546], [546, 549],
                [546, 529], [547, 545], [547, 547], [547, 550], [548, 536], [548, 540],
                [548, 548], [548, 542], [549, 531], [549, 546], [549, 549], [549, 529],
                [550, 547], [550, 550], [550, 537], [550, 538], [551, 535], [551, 539],
                [551, 551], [551, 532], [551, 537], [551, 552], [552, 532], [552, 537],
                [552, 551], [552, 552], [552, 529], [552, 530], [552, 531], [552, 538]
            ]);
        });
        test('small example', function () {
            var cyl = new slg_1.EdbPredicate([
                ['dorothy', 'george'],
                ['evelyn', 'george'],
                ['bertrand', 'dorothy'],
                ['ann', 'dorothy'],
                ['hilary', 'ann'],
                ['charles', 'everlyn']
            ]);
            var sg = new slg_1.TabledPredicate(function (_a) {
                var _b = __read(_a, 2), X = _b[0], Y = _b[1];
                return slg_1.rule(function () { return [slg_1.unify(X, Y)]; }, function (Z) { return [cyl.match([X, Z]), sg.match([Z, Z]), cyl.match([Y, Z])]; });
            });
            var result = slg_1.toArrayQ(function (Q) { return slg_1.clause(function (S, E) { return [sg.match([S, E]), slg_1.unify(Q, [S, E])]; }); });
            expect(result).toEqual([
                [new unify_1.Variable(2), new unify_1.Variable(2)],
                ["dorothy", "dorothy"],
                ["dorothy", "evelyn"],
                ["evelyn", "dorothy"],
                ["evelyn", "evelyn"],
                ["bertrand", "bertrand"],
                ["bertrand", "ann"],
                ["ann", "bertrand"],
                ["ann", "ann"],
                ["hilary", "hilary"],
                ["charles", "charles"]
            ]);
        });
    });
});
//# sourceMappingURL=slg.spec.js.map
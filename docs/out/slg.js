var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        define(["require", "exports", "./unify", "./json-trie", "immutable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unify_1 = require("./unify");
    var json_trie_1 = require("./json-trie");
    var im = require("immutable");
    var TopLevelScheduler = (function () {
        function TopLevelScheduler() {
            this.processes = [];
            this.globalEnv = { generatorCount: 0, topOfCompletionStack: null, sdgEdges: [] };
        }
        TopLevelScheduler.prototype.push = function (process) {
            this.processes.push(process);
        };
        TopLevelScheduler.prototype.execute = function () {
            var waiters = this.processes;
            var waiter = waiters.pop();
            while (waiter !== void (0)) {
                waiter();
                waiter = waiters.pop();
            }
        };
        TopLevelScheduler.prototype.dependOn = function (gen) { };
        TopLevelScheduler.prototype.dependNegativelyOn = function (gen) { };
        return TopLevelScheduler;
    }());
    var Generator = (function () {
        function Generator(scheduler) {
            this.processes = [];
            this.completionListeners = [];
            this.successors = {};
            this.negativeSuccessors = {};
            this.sccIndex = -1;
            this.sccLowLink = -1;
            this.onSccStack = false;
            var gEnv = this.globalEnv = scheduler.globalEnv;
            this.selfId = gEnv.generatorCount++;
            this.directLink = this.selfId;
            this.prevGenerator = gEnv.topOfCompletionStack;
            gEnv.topOfCompletionStack = this;
        }
        Object.defineProperty(Generator.prototype, "isComplete", {
            get: function () { return this.processes === null; },
            enumerable: true,
            configurable: true
        });
        Generator.prototype.cleanup = function () {
            this.processes = null;
            this.successors = null;
            this.negativeSuccessors = null;
        };
        Generator.prototype.push = function (process) {
            this.processes.push(process);
        };
        Generator.prototype.execute = function () {
            var waiter = this.processes.pop();
            while (waiter !== void (0)) {
                waiter();
                if (this.processes === null)
                    return;
                waiter = this.processes.pop();
            }
            Generator.checkCompletion(this);
        };
        Generator.prototype.dependOn = function (v) {
            if (this.isComplete)
                return;
            this.directLink = Math.min(this.directLink, v.directLink);
            this.successors[v.selfId] = v;
            this.globalEnv.sdgEdges.push([this.selfId, v.selfId]);
        };
        Generator.prototype.dependNegativelyOn = function (v) {
            if (this.isComplete)
                return;
            this.directLink = Math.min(this.directLink, v.directLink);
            this.negativeSuccessors[v.selfId] = v;
            this.globalEnv.sdgEdges.push([this.selfId, v.selfId]);
        };
        Generator.completeScc = function (gen) {
            var index = 0;
            var stack = [];
            var scc = function (g) {
                g.sccIndex = g.sccLowLink = index++;
                stack.push(g);
                g.onSccStack = true;
                var negSuccs = g.negativeSuccessors;
                for (var k in negSuccs) {
                    var w = negSuccs[k];
                    if (w.sccIndex === -1 && !w.isComplete) {
                        scc(w);
                        g.sccLowLink = Math.min(g.sccLowLink, w.sccLowLink);
                    }
                    else if (w.onSccStack) {
                        g.sccLowLink = Math.min(g.sccLowLink, w.sccIndex);
                    }
                }
                var succs = g.successors;
                for (var k in succs) {
                    var w = succs[k];
                    if (w.sccIndex === -1 && !w.isComplete) {
                        scc(w);
                        g.sccLowLink = Math.min(g.sccLowLink, w.sccLowLink);
                    }
                    else if (w.onSccStack) {
                        g.sccLowLink = Math.min(g.sccLowLink, w.sccIndex);
                    }
                }
                if (g.sccLowLink === g.sccIndex) {
                    var sccLen = stack.length;
                    var i = sccLen - 1;
                    for (var gen_1 = stack[i]; gen_1 !== g; gen_1 = stack[--i]) {
                        gen_1.onSccStack = false;
                        gen_1.complete();
                        gen_1.prevGenerator = null;
                    }
                    g.onSccStack = false;
                    g.complete();
                    g.prevGenerator = null;
                    for (var j = i; j < sccLen; ++j) {
                        stack[j].scheduleNegativeResumes();
                    }
                    stack.length = i;
                }
            };
            scc(gen);
        };
        Generator.isLeader = function (g) {
            var prev = g.prevGenerator;
            while (prev !== null && prev.isComplete) {
                var p = prev.prevGenerator;
                prev.prevGenerator = null;
                prev = p;
            }
            g.prevGenerator = prev;
            var result = [];
            var tos = g.globalEnv.topOfCompletionStack;
            var minLink = g.directLink;
            var lastLink = g.directLink;
            var last = null;
            while (tos !== g) {
                var p = tos.prevGenerator;
                if (tos.isComplete) {
                    if (last !== null) {
                        last.prevGenerator = p;
                    }
                    else {
                        g.globalEnv.topOfCompletionStack = p;
                    }
                    tos.prevGenerator = null;
                }
                else {
                    result.push(tos);
                    last = tos;
                    lastLink = tos.directLink;
                    minLink = Math.min(lastLink, minLink);
                }
                tos = p;
            }
            result.push(g);
            return prev === null || prev.selfId < Math.min(g.directLink, minLink) ? result : null;
        };
        Generator.checkCompletion = function (g) {
            if (g.isComplete)
                return;
            completionLoop: while (true) {
                var cStack = Generator.isLeader(g);
                if (cStack === null)
                    return;
                var len = cStack.length;
                var anyNegativeConsumers = false;
                for (var i = len - 1; i >= 0; --i) {
                    var gen = cStack[i];
                    if (gen.scheduleResumes()) {
                        continue completionLoop;
                    }
                    if (gen.completionListeners.length !== 0)
                        anyNegativeConsumers = true;
                }
                if (anyNegativeConsumers) {
                    var prev = g.prevGenerator;
                    Generator.completeScc(g);
                    g.globalEnv.topOfCompletionStack = prev;
                    return;
                }
                else {
                    var prev = g.prevGenerator;
                    for (var i = len - 1; i >= 0; --i) {
                        var gen = cStack[i];
                        gen.complete();
                        gen.completionListeners = null;
                        gen.prevGenerator = null;
                    }
                    g.globalEnv.topOfCompletionStack = prev;
                    return;
                }
            }
        };
        return Generator;
    }());
    var TableGenerator = (function (_super) {
        __extends(TableGenerator, _super);
        function TableGenerator(scheduler) {
            var _this = _super.call(this, scheduler) || this;
            _this.consumers = [];
            _this.answerSet = json_trie_1.JsonTrieTerm.create();
            _this.table = [];
            return _this;
        }
        TableGenerator.create = function (body, sched, count, s0) {
            var gen = new TableGenerator(sched);
            gen.push(function () { return body(gen)(s0)(function (s) { return gen.insertAnswer(count, s); }); });
            return gen;
        };
        TableGenerator.prototype.consume = function (k) {
            if (this.isComplete) {
                var answers = this.table;
                var len = answers.length;
                for (var i = 0; i < len; ++i) {
                    k(answers[i]);
                }
            }
            else {
                this.consumers.push([0, k]);
            }
        };
        TableGenerator.prototype.consumeNegatively = function (k) {
            var _this = this;
            if (this.isComplete) {
                if (this.table.length === 0)
                    k();
            }
            else {
                this.completionListeners.push(function () { return _this.table.length === 0 ? k() : void (0); });
            }
        };
        TableGenerator.prototype.consumeToCompletion = function (k, onComplete) {
            if (this.isComplete) {
                var answers = this.table;
                var len = answers.length;
                for (var i = 0; i < len; ++i) {
                    k(answers[i]);
                }
                onComplete();
            }
            else {
                this.consumers.push([0, k]);
                this.completionListeners.push(onComplete);
            }
        };
        TableGenerator.prototype.scheduleAnswers = function (consumer) {
            var answers = this.table;
            var len = answers.length;
            var start = consumer[0];
            var k = consumer[1];
            for (var i = start; i < len; ++i) {
                k(answers[i]);
            }
            consumer[0] = len;
            return start !== len;
        };
        TableGenerator.prototype.scheduleResumes = function () {
            var cs = this.consumers;
            var len = cs.length;
            var wereUnconsumed = false;
            for (var i = 0; i < len; ++i) {
                if (this.scheduleAnswers(cs[i])) {
                    wereUnconsumed = true;
                }
            }
            return wereUnconsumed;
        };
        TableGenerator.prototype.scheduleNegativeResumes = function () {
            var ncs = this.completionListeners;
            if (ncs === null)
                return;
            var len = ncs.length;
            for (var i = 0; i < len; ++i) {
                ncs[i]();
            }
            this.completionListeners = null;
        };
        TableGenerator.prototype.insertAnswer = function (count, sub) {
            var _this = this;
            if (count === 0) {
                if (this.table.length === 0) {
                    this.table.push([]);
                    this.scheduleResumes();
                    this.complete();
                    this.scheduleNegativeResumes();
                }
            }
            else {
                var answer_1 = new Array(count);
                for (var i = 0; i < count; ++i) {
                    answer_1[i] = unify_1.groundJson(sub.lookupById(i), sub);
                }
                this.answerSet.modify(answer_1, function (exists) { if (!exists) {
                    _this.table.push(answer_1);
                } ; return true; });
            }
        };
        TableGenerator.prototype.complete = function () {
            this.cleanup();
            this.consumers = null;
            this.answerSet = null;
        };
        return TableGenerator;
    }(Generator));
    var TrieEdbPredicate = (function () {
        function TrieEdbPredicate(trie) {
            this.trie = trie;
        }
        TrieEdbPredicate.fromArray = function (rows) {
            var trie = json_trie_1.JsonTrie.create();
            var len = rows.length;
            for (var i = 0; i < len; ++i) {
                trie.insert(rows[i], null);
            }
            return new TrieEdbPredicate(trie);
        };
        TrieEdbPredicate.prototype.match = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                try {
                    for (var _a = __values(_this.trie.match(row, s)), _b = _a.next(); !_b.done; _b = _a.next()) {
                        var s2 = _b.value;
                        k(s2);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var e_1, _c;
            }; }; };
        };
        TrieEdbPredicate.prototype.notMatch = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                try {
                    for (var _a = __values(_this.trie.match(row, s)), _b = _a.next(); !_b.done; _b = _a.next()) {
                        var s2 = _b.value;
                        return;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                k(s);
                var e_2, _c;
            }; }; };
        };
        return TrieEdbPredicate;
    }());
    exports.TrieEdbPredicate = TrieEdbPredicate;
    var EdbPredicate = (function () {
        function EdbPredicate(table) {
            this.table = table;
        }
        EdbPredicate.prototype.match = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var arr = _this.table;
                var len = arr.length;
                for (var i = 0; i < len; ++i) {
                    var s2 = unify_1.matchJson(row, arr[i], s);
                    if (s2 !== null)
                        k(s2);
                }
            }; }; };
        };
        EdbPredicate.prototype.looseMatch = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var arr = _this.table;
                var len = arr.length;
                for (var i = 0; i < len; ++i) {
                    var s2 = unify_1.looseMatchJson(row, arr[i], s);
                    if (s2 !== null)
                        k(s2);
                }
            }; }; };
        };
        EdbPredicate.prototype.notMatch = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var arr = _this.table;
                var len = arr.length;
                for (var i = 0; i < len; ++i) {
                    var s2 = unify_1.matchJson(row, arr[i], s);
                    if (s2 !== null)
                        return;
                }
                return k(s);
            }; }; };
        };
        return EdbPredicate;
    }());
    exports.EdbPredicate = EdbPredicate;
    var UntabledPredicate = (function () {
        function UntabledPredicate(body) {
            this.body = body;
        }
        UntabledPredicate.prototype.match = function (row) {
            return this.body(row);
        };
        return UntabledPredicate;
    }());
    exports.UntabledPredicate = UntabledPredicate;
    var TabledPredicate = (function () {
        function TabledPredicate(body) {
            this.body = body;
            this.generators = json_trie_1.JsonTrieTerm.create();
            this.sum = this.aggregate(TabledPredicate.isNumber, 0, function (x, y) { return x + y; });
            this.product = this.aggregate(TabledPredicate.isNumber, 1, function (x, y) { return x * y; });
            this.min = this.aggregate(TabledPredicate.isNumber, Number.POSITIVE_INFINITY, Math.min);
            this.max = this.aggregate(TabledPredicate.isNumber, Number.NEGATIVE_INFINITY, Math.max);
            this.count = this.aggregate(function (_) { return 1; }, 0, function (x, y) { return x + y; });
            this.and = this.aggregate(function (x) { return x; }, true, function (x, y) { return x && y; });
            this.or = this.aggregate(function (x) { return x; }, false, function (x, y) { return x || y; });
        }
        TabledPredicate.prototype.getGenerator = function (row, sched) {
            var _this = this;
            var vs = null;
            var isNew = false;
            var g = this.generators.modifyWithVars(row, function (gen, varMap) {
                vs = varMap.vars;
                if (gen === void (0)) {
                    var t = unify_1.refreshJson(row, unify_1.Substitution.emptyPersistent());
                    isNew = true;
                    return TableGenerator.create(_this.body(t[0]), sched, vs.length, t[1]);
                }
                else {
                    return gen;
                }
            });
            return [g, vs, isNew];
        };
        TabledPredicate.prototype.match = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var t = _this.getGenerator(unify_1.groundJson(row, s), gen);
                var generator = t[0];
                var vs = t[1];
                var isNew = t[2];
                var len = vs.length;
                var rs = new Array(len);
                gen.dependOn(generator);
                generator.consume(function (cs) {
                    var s2 = s;
                    for (var i = 0; i < len; ++i) {
                        var t_1 = unify_1.refreshJson(cs[i], s2, vs);
                        s2 = t_1[1];
                        rs[i] = t_1[0];
                    }
                    for (var i = 0; i < len; ++i) {
                        s2 = unify_1.unifyJson(vs[i], rs[i], s2);
                    }
                    k(s2);
                });
                if (isNew)
                    generator.execute();
            }; }; };
        };
        TabledPredicate.prototype.notMatch = function (row) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var t = _this.getGenerator(unify_1.groundJson(row, s), gen);
                var generator = t[0];
                var vs = t[1];
                var isNew = t[2];
                if (vs.length !== 0)
                    throw new Error('TabledPredicate.notMatch: negation of non-ground atom (floundering)');
                gen.dependNegativelyOn(generator);
                generator.consumeNegatively(function () { return k(s); });
                if (isNew)
                    generator.execute();
            }; }; };
        };
        TabledPredicate.prototype.aggregate = function (inject, unit, mult) {
            var _this = this;
            return function (row) {
                return { into: function (result) { return function (gen) { return function (s) { return function (k) {
                        var t = _this.getGenerator(unify_1.groundJson(row, s), gen);
                        var generator = t[0];
                        var vs = t[1];
                        var isNew = t[2];
                        var len = vs.length;
                        var rs = new Array(len);
                        var agg = unit;
                        gen.dependNegativelyOn(generator);
                        generator.consumeToCompletion(function (cs) {
                            var s2 = s;
                            for (var i = 0; i < len; ++i) {
                                var t_2 = unify_1.refreshJson(cs[i], s2, vs);
                                s2 = t_2[1];
                                rs[i] = t_2[0];
                            }
                            for (var i = 0; i < len; ++i) {
                                s2 = unify_1.unifyJson(vs[i], rs[i], s2);
                            }
                            agg = mult(agg, inject(unify_1.completelyGroundJson(row, s2)));
                        }, function () {
                            var s2 = unify_1.matchJson(result, agg, s);
                            if (s2 !== null)
                                k(s2);
                        });
                        if (isNew)
                            generator.execute();
                    }; }; }; } };
            };
        };
        TabledPredicate.isNumber = function (t) {
            if (typeof t === 'number')
                return t;
            throw new Error('TabledPredicate.isNumber: expected a number');
        };
        return TabledPredicate;
    }());
    exports.TabledPredicate = TabledPredicate;
    var LatticeGenerator = (function (_super) {
        __extends(LatticeGenerator, _super);
        function LatticeGenerator(bottom, join, eq, earlyComplete, scheduler) {
            var _this = _super.call(this, scheduler) || this;
            _this.join = join;
            _this.eq = eq;
            _this.earlyComplete = earlyComplete;
            _this.consumers = [];
            _this.accumulator = bottom;
            return _this;
        }
        LatticeGenerator.create = function (bottom, join, eq, body, sched) {
            var gen = new LatticeGenerator(bottom, join, eq, function (_) { return false; }, sched);
            gen.push(function () { return body(gen)(unify_1.Substitution.emptyPersistent(1))(gen.updateAccumulator.bind(gen)); });
            return gen;
        };
        LatticeGenerator.createWithEarlyComplete = function (bottom, join, eq, ec, body, sched) {
            var gen = new LatticeGenerator(bottom, join, eq, ec, sched);
            gen.push(function () { return body(gen)(unify_1.Substitution.emptyPersistent(1))(gen.updateAccumulator.bind(gen)); });
            return gen;
        };
        LatticeGenerator.prototype.consume = function (k) {
            if (this.isComplete) {
                k(this.accumulator);
            }
            else {
                this.consumers.push([this.accumulator, k]);
                k(this.accumulator);
            }
        };
        LatticeGenerator.prototype.scheduleNegativeResumes = function () {
            this.completionListeners = null;
        };
        LatticeGenerator.prototype.scheduleResumes = function () {
            var cs = this.consumers;
            var len = cs.length;
            var wereUnconsumed = false;
            for (var i = 0; i < len; ++i) {
                var t = cs[i];
                var old = t[0];
                var l = t[0] = this.join(old, this.accumulator);
                if (!this.eq(old, l)) {
                    wereUnconsumed = true;
                    t[1](l);
                }
            }
            return wereUnconsumed;
        };
        LatticeGenerator.prototype.updateAccumulator = function (newVal) {
            this.accumulator = this.join(this.accumulator, newVal);
            if (this.earlyComplete(this.accumulator)) {
                this.scheduleResumes();
                this.complete();
                this.scheduleNegativeResumes();
            }
        };
        LatticeGenerator.prototype.complete = function () {
            this.cleanup();
            this.consumers = null;
        };
        return LatticeGenerator;
    }(Generator));
    var BaseLattice = (function () {
        function BaseLattice(body) {
            this.body = body;
            this.generators = json_trie_1.JsonTrieTerm.create();
        }
        BaseLattice.prototype.join = function (In, Out) {
            var _this = this;
            return { for: function (row) { return _this.forThen(row, function (v, k, s, g) {
                    var val = unify_1.completelyGroundJson(In, s);
                    var s2 = unify_1.unifyJson(Out, g.join(v, val), s);
                    if (s2 !== null)
                        return k(s2);
                }); } };
        };
        BaseLattice.prototype.getGenerator = function (row, sched) {
            var _this = this;
            var isNew = false;
            var g = this.generators.modifyWithVars(row, function (gen, varMap) {
                if (varMap.vars.length !== 0)
                    throw new Error('Lattices can only handle fully groundable terms.');
                if (gen === void (0)) {
                    isNew = true;
                    return _this.createGen(_this.body(row), sched);
                }
                else {
                    return gen;
                }
            });
            return [g, isNew];
        };
        BaseLattice.prototype.forThen = function (row, f) {
            var _this = this;
            return function (gen) { return function (s) { return function (k) {
                var t = _this.getGenerator(unify_1.groundJson(row, s), gen);
                var g = t[0];
                var isNew = t[1];
                gen.dependOn(g);
                g.consume(function (x) { return f(x, k, s, g); });
                if (isNew)
                    g.execute();
            }; }; };
        };
        return BaseLattice;
    }());
    var AnyLattice = (function (_super) {
        __extends(AnyLattice, _super);
        function AnyLattice(body) {
            return _super.call(this, body) || this;
        }
        AnyLattice.orFn = function (x, y) { return x || y; };
        AnyLattice.eqFn = function (x, y) { return x === y; };
        AnyLattice.fromLP = function (body) {
            return new AnyLattice(function (row) {
                var comp = fresh(function (Q) { return seq(body(row, Q), completelyGround(Q)); });
                return function (gen) { return function (s) { return function (k) { return comp(gen)(s)(k); }; }; };
            });
        };
        AnyLattice.prototype.createGen = function (body, scheduler) {
            return LatticeGenerator.createWithEarlyComplete(false, AnyLattice.orFn, AnyLattice.eqFn, function (x) { return x; }, body, scheduler);
        };
        AnyLattice.prototype.isTrue = function () {
            var _this = this;
            return { for: function (row) { return _this.forThen(row, function (b, k, s) { return b ? k(s) : void (0); }); } };
        };
        return AnyLattice;
    }(BaseLattice));
    exports.AnyLattice = AnyLattice;
    var AllLattice = (function (_super) {
        __extends(AllLattice, _super);
        function AllLattice(body) {
            return _super.call(this, body) || this;
        }
        AllLattice.andFn = function (x, y) { return x && y; };
        AllLattice.eqFn = function (x, y) { return x === y; };
        AllLattice.fromLP = function (body) {
            return new AllLattice(function (row) {
                var comp = fresh(function (Q) { return seq(body(row, Q), completelyGround(Q)); });
                return function (gen) { return function (s) { return function (k) { return comp(gen)(s)(k); }; }; };
            });
        };
        AllLattice.prototype.createGen = function (body, scheduler) {
            return LatticeGenerator.createWithEarlyComplete(true, AllLattice.andFn, AllLattice.eqFn, function (x) { return x; }, body, scheduler);
        };
        AllLattice.prototype.isFalse = function () {
            var _this = this;
            return { for: function (row) { return _this.forThen(row, function (b, k, s) { return b ? void (0) : k(s); }); } };
        };
        return AllLattice;
    }(BaseLattice));
    exports.AllLattice = AllLattice;
    var GrowingSetLattice = (function (_super) {
        __extends(GrowingSetLattice, _super);
        function GrowingSetLattice(body) {
            return _super.call(this, body) || this;
        }
        GrowingSetLattice.eqFn = function (x, y) { return x.equals(y); };
        GrowingSetLattice.fromLP = function (body) {
            return new GrowingSetLattice(function (row) {
                var comp = fresh(function (Q) { return seq(body(row, Q), completelyGround(Q)); });
                return function (gen) { return function (s) { return function (k) { return comp(gen)(s)(function (x) { return k(im.Set.of(x)); }); }; }; };
            });
        };
        GrowingSetLattice.prototype.createGen = function (body, scheduler) {
            return LatticeGenerator.create(im.Set.of(), function (x, y) { return x.union(y); }, GrowingSetLattice.eqFn, body, scheduler);
        };
        GrowingSetLattice.prototype.contains = function (x) {
            var _this = this;
            return new AnyLattice(function (row) { return _this.forThen(row, function (s, k, sub) { return k(s.contains(unify_1.completelyGroundJson(x, sub))); }); });
        };
        GrowingSetLattice.prototype.size = function () {
            var _this = this;
            return new MaxLattice(function (row) { return _this.forThen(row, function (s, k, _) { return k(s.size); }); });
        };
        return GrowingSetLattice;
    }(BaseLattice));
    exports.GrowingSetLattice = GrowingSetLattice;
    var MinLattice = (function (_super) {
        __extends(MinLattice, _super);
        function MinLattice(body) {
            return _super.call(this, body) || this;
        }
        MinLattice.eqFn = function (x, y) { return x === y; };
        MinLattice.fromLP = function (body) {
            return new MinLattice(function (row) {
                var comp = fresh(function (Q) { return seq(body(row, Q), completelyGround(Q)); });
                return function (gen) { return function (s) { return function (k) { return comp(gen)(s)(k); }; }; };
            });
        };
        MinLattice.prototype.createGen = function (body, scheduler) {
            return LatticeGenerator.create(Number.POSITIVE_INFINITY, Math.min, MinLattice.eqFn, body, scheduler);
        };
        MinLattice.prototype.lessThan = function (threshold) {
            var _this = this;
            return new AnyLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(threshold, s);
                if (typeof t !== 'number')
                    throw new Error('MinLattice.lessThan: expected threshold to be a number');
                return k(n < t);
            }); });
        };
        MinLattice.prototype.lessThanOrEqualTo = function (threshold) {
            var _this = this;
            return new AnyLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(threshold, s);
                if (typeof t !== 'number')
                    throw new Error('MinLattice.lessThanOrEqualTo: expected threshold to be a number');
                return k(n <= t);
            }); });
        };
        MinLattice.prototype.add = function (shift) {
            var _this = this;
            return new MinLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(shift, s);
                if (typeof t !== 'number')
                    throw new Error('MinLattice.add: expected shift to be a number');
                return k(n + t);
            }); });
        };
        MinLattice.prototype.sub = function (shift) {
            var _this = this;
            return new MinLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(shift, s);
                if (typeof t !== 'number')
                    throw new Error('MinLattice.sub: expected shift to be a number');
                return k(n - t);
            }); });
        };
        MinLattice.prototype.negate = function () {
            var _this = this;
            return new MaxLattice(function (row) { return _this.forThen(row, function (n, k, _) { return k(-n); }); });
        };
        return MinLattice;
    }(BaseLattice));
    exports.MinLattice = MinLattice;
    var MaxLattice = (function (_super) {
        __extends(MaxLattice, _super);
        function MaxLattice(body) {
            return _super.call(this, body) || this;
        }
        MaxLattice.eqFn = function (x, y) { return x === y; };
        MaxLattice.fromLP = function (body) {
            return new MaxLattice(function (row) {
                var comp = fresh(function (Q) { return seq(body(row, Q), completelyGround(Q)); });
                return function (gen) { return function (s) { return function (k) { return comp(gen)(s)(k); }; }; };
            });
        };
        MaxLattice.prototype.createGen = function (body, scheduler) {
            return LatticeGenerator.create(Number.NEGATIVE_INFINITY, Math.max, MaxLattice.eqFn, body, scheduler);
        };
        MaxLattice.prototype.greaterThan = function (threshold) {
            var _this = this;
            return new AnyLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(threshold, s);
                if (typeof t !== 'number')
                    throw new Error('MaxLattice.greaterThan: expected threshold to be a number');
                return k(n > t);
            }); });
        };
        MaxLattice.prototype.greaterThanOrEqualTo = function (threshold) {
            var _this = this;
            return new AnyLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(threshold, s);
                if (typeof t !== 'number')
                    throw new Error('MaxLattice.greaterThanOrEqualTo: expected threshold to be a number');
                return k(n >= t);
            }); });
        };
        MaxLattice.prototype.add = function (shift) {
            var _this = this;
            return new MaxLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(shift, s);
                if (typeof t !== 'number')
                    throw new Error('MaxLattice.add: expected shift to be a number');
                return k(n + t);
            }); });
        };
        MaxLattice.prototype.sub = function (shift) {
            var _this = this;
            return new MaxLattice(function (row) { return _this.forThen(row, function (n, k, s) {
                var t = unify_1.groundJson(shift, s);
                if (typeof t !== 'number')
                    throw new Error('MaxLattice.sub: expected shift to be a number');
                return k(n - t);
            }); });
        };
        MaxLattice.prototype.negate = function () {
            var _this = this;
            return new MinLattice(function (row) { return _this.forThen(row, function (n, k, _) { return k(-n); }); });
        };
        return MaxLattice;
    }(BaseLattice));
    exports.MaxLattice = MaxLattice;
    function seq(m1, m2) {
        return function (gen) { return function (s) { return function (k) { return m1(gen)(s)(function (s) { return m2(gen)(s)(k); }); }; }; };
    }
    exports.seq = seq;
    function fail() {
        return function (gen) { return function (s) { return function (k) { return void (0); }; }; };
    }
    exports.fail = fail;
    function succeedWith(val) {
        return function (gen) { return function (s) { return function (k) { return k(val); }; }; };
    }
    function ground(val) {
        return function (gen) { return function (s) { return function (k) { return k(unify_1.groundJson(val, s)); }; }; };
    }
    function completelyGround(val) {
        return function (gen) { return function (s) { return function (k) { return k(unify_1.completelyGroundJson(val, s)); }; }; };
    }
    function apply(f) {
        return function (In, Out) { return function (gen) { return function (s) { return function (k) {
            var result = unify_1.matchJson(Out, f(unify_1.completelyGroundJson(In, s)), s);
            if (result !== null)
                return k(result);
        }; }; }; };
    }
    exports.apply = apply;
    function guard(pred) {
        return function (In) { return function (gen) { return function (s) { return function (k) { return pred(unify_1.completelyGroundJson(In, s)) ? k(s) : void (0); }; }; }; };
    }
    exports.guard = guard;
    function conj() {
        var cs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cs[_i] = arguments[_i];
        }
        return function (gen) {
            var len = cs.length;
            var cs2 = new Array(len);
            for (var i = 0; i < len; ++i) {
                cs2[i] = cs[i](gen);
            }
            return function (s) { return function (k) {
                var loop = function (i) { return function (s2) {
                    if (i < len) {
                        cs2[i](s2)(loop(i + 1));
                    }
                    else {
                        k(s2);
                    }
                }; };
                return loop(0)(s);
            }; };
        };
    }
    exports.conj = conj;
    function disj() {
        var ds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            ds[_i] = arguments[_i];
        }
        return function (gen) {
            var ds2 = ds.map(function (d) { return d(gen); });
            return function (s) { return function (k) {
                var _loop_1 = function (i) {
                    var d = ds2[i];
                    gen.push(function () { return d(s)(k); });
                };
                for (var i = ds2.length - 1; i >= 0; --i) {
                    _loop_1(i);
                }
            }; };
        };
    }
    exports.disj = disj;
    function freshN(count, body) {
        return function (gen) { return function (s) { return function (k) {
            var t = s.fresh(count);
            return body.apply(null, t[0])(gen)(t[1])(k);
        }; }; };
    }
    exports.freshN = freshN;
    function fresh(body) {
        return freshN(body.length, body);
    }
    exports.fresh = fresh;
    function clauseN(count, body) {
        return function (gen) { return function (s) { return function (k) {
            var t = s.fresh(count);
            return conj.apply(null, body.apply(null, t[0]))(gen)(t[1])(k);
        }; }; };
    }
    exports.clauseN = clauseN;
    function clause(body) {
        return clauseN(body.length, body);
    }
    exports.clause = clause;
    function unify(x, y) {
        return function (gen) { return function (s) { return function (k) {
            var s2 = unify_1.unifyJson(x, y, s);
            if (s2 !== null) {
                return k(s2);
            }
        }; }; };
    }
    exports.unify = unify;
    function looseUnify(x, y) {
        return function (gen) { return function (s) { return function (k) {
            var s2 = unify_1.looseUnifyJson(x, y, s);
            if (s2 !== null) {
                return k(s2);
            }
        }; }; };
    }
    exports.looseUnify = looseUnify;
    function rule() {
        var alternatives = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            alternatives[_i] = arguments[_i];
        }
        return disj.apply(null, alternatives.map(function (cs) { return clauseN(cs.length, function () {
            var vs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                vs[_i] = arguments[_i];
            }
            return cs.apply(null, vs);
        }); }));
    }
    exports.rule = rule;
    function runLP(sched, m, k) {
        return sched.push(function () { return m(sched)(unify_1.Substitution.emptyPersistent())(k); });
    }
    function run(m, k) {
        var sched = new TopLevelScheduler();
        runLP(sched, m, k);
        sched.execute();
    }
    function runQ(body, k) {
        run(fresh(function (Q) { return seq(body(Q), ground(Q)); }), k);
    }
    exports.runQ = runQ;
    function toArray(m) {
        var result = [];
        run(m, function (a) { return result.push(a); });
        return result;
    }
    function toArrayQ(body) {
        var results = [];
        runQ(body, function (a) { return results.push(a); });
        return results;
    }
    exports.toArrayQ = toArrayQ;
    function debugRunQ(body, k) {
        var sched = new TopLevelScheduler();
        runLP(sched, fresh(function (Q) { return seq(body(Q), ground(Q)); }), k);
        sched.execute();
        return sched.globalEnv.sdgEdges;
    }
    exports.debugRunQ = debugRunQ;
    function debugToArrayQ(body) {
        var results = [];
        var sdgEdges = debugRunQ(body, function (a) { return results.push(a); });
        return [sdgEdges, results];
    }
    exports.debugToArrayQ = debugToArrayQ;
    var shortestPathLen = MinLattice.fromLP(function (_a, Q) {
        var _b = __read(_a, 2), S = _b[0], E = _b[1];
        return path.match([S, E, Q]);
    });
    var edge = new EdbPredicate([[1, 2], [2, 3], [3, 1]]);
    var path = new TabledPredicate(function (_a) {
        var _b = __read(_a, 3), X = _b[0], Z = _b[1], SD = _b[2];
        return rule(function () { return [edge.match([X, Z]), unify(SD, 1)]; }, function (Y, D, D1) { return [path.match([X, Y, D1]),
            edge.match([Y, Z]),
            apply(function (x) { return x + 1; })(D1, D),
            shortestPathLen.join(D, SD).for([X, Z])]; });
    });
    var result = toArrayQ(function (Q) { return clause(function (S, E, L) { return [path.match([S, E, L]), unify(Q, [S, E, L])]; }); });
});
//# sourceMappingURL=slg.js.map
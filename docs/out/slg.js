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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./unify", "./json-trie"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unify_1 = require("./unify");
    var json_trie_1 = require("./json-trie");
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
            this.consumers = [];
            this.negativeConsumers = [];
            this.successors = {};
            this.negativeSuccessors = {};
            this.sccIndex = -1;
            this.sccLowLink = -1;
            this.onSccStack = false;
            this.table = [];
            this.answerSet = json_trie_1.JsonTrieTerm.create();
            var gEnv = this.globalEnv = scheduler.globalEnv;
            this.selfId = gEnv.generatorCount++;
            this.directLink = this.selfId;
            this.prevGenerator = gEnv.topOfCompletionStack;
            gEnv.topOfCompletionStack = this;
        }
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
        Generator.prototype.consume = function (k) {
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
        Generator.prototype.consumeNegatively = function (k) {
            if (this.isComplete) {
                if (this.table.length === 0)
                    k();
            }
            else {
                this.negativeConsumers.push(k);
            }
        };
        Generator.prototype.scheduleAnswers = function (consumer) {
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
        Generator.prototype.push = function (process) {
            this.processes.push(process);
        };
        Generator.prototype.isLeader = function () {
            var prev = this.prevGenerator;
            while (prev !== null && prev.isComplete) {
                var p = prev.prevGenerator;
                prev.prevGenerator = null;
                prev = p;
            }
            this.prevGenerator = prev;
            var result = [];
            var tos = this.globalEnv.topOfCompletionStack;
            var minLink = this.directLink;
            var lastLink = this.directLink;
            var last = null;
            while (tos !== this) {
                var p = tos.prevGenerator;
                if (tos.isComplete) {
                    if (last !== null) {
                        last.prevGenerator = p;
                    }
                    else {
                        this.globalEnv.topOfCompletionStack = p;
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
            result.push(this);
            return prev === null || prev.selfId < Math.min(this.directLink, minLink) ? result : null;
        };
        Generator.prototype.scheduleResumes = function () {
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
        Generator.prototype.checkCompletion = function () {
            if (this.isComplete)
                return;
            completionLoop: while (true) {
                var cStack = this.isLeader();
                if (cStack === null)
                    return;
                var len = cStack.length;
                var anyNegativeConsumers = false;
                for (var i = len - 1; i >= 0; --i) {
                    var gen = cStack[i];
                    if (gen.scheduleResumes()) {
                        continue completionLoop;
                    }
                    if (gen.negativeConsumers.length !== 0)
                        anyNegativeConsumers = true;
                }
                if (anyNegativeConsumers) {
                    var prev = this.prevGenerator;
                    Generator.completeScc(this);
                    this.globalEnv.topOfCompletionStack = prev;
                    return;
                }
                else {
                    var prev = this.prevGenerator;
                    for (var i = len - 1; i >= 0; --i) {
                        var gen = cStack[i];
                        gen.complete();
                        gen.negativeConsumers = null;
                        gen.prevGenerator = null;
                    }
                    this.globalEnv.topOfCompletionStack = prev;
                    return;
                }
            }
        };
        Generator.prototype.execute = function () {
            var waiter = this.processes.pop();
            while (waiter !== void (0)) {
                waiter();
                if (this.processes === null)
                    return;
                waiter = this.processes.pop();
            }
            this.checkCompletion();
        };
        Generator.prototype.complete = function () {
            this.processes = null;
            this.consumers = null;
            this.answerSet = null;
            this.successors = null;
            this.negativeSuccessors = null;
        };
        Generator.prototype.scheduleNegativeResumes = function () {
            if (this.table.length === 0) {
                var ncs = this.negativeConsumers;
                var len = ncs.length;
                for (var i = 0; i < len; ++i) {
                    ncs[i]();
                }
            }
            this.negativeConsumers = null;
        };
        Object.defineProperty(Generator.prototype, "isComplete", {
            get: function () { return this.answerSet === null; },
            enumerable: true,
            configurable: true
        });
        Generator.create = function (body, sched, count, s0) {
            var gen = new Generator(sched);
            gen.push(function () { return body(gen)(s0)(function (s) { return gen.insertAnswer(count, s); }); });
            return gen;
        };
        Generator.prototype.insertAnswer = function (count, sub) {
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
        return Generator;
    }());
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
                    return Generator.create(_this.body(t[0]), sched, vs.length, t[1]);
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
                gen.dependOn(generator);
                var len = vs.length;
                generator.consume(function (cs) {
                    var s2 = s;
                    for (var i = 0; i < len; ++i) {
                        var t_1 = unify_1.refreshJson(cs[i], s2, vs);
                        s2 = t_1[1];
                        cs[i] = t_1[0];
                    }
                    for (var i = 0; i < len; ++i) {
                        s2 = unify_1.unifyJson(vs[i], cs[i], s2);
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
                gen.dependNegativelyOn(generator);
                if (vs.length !== 0)
                    throw new Error('TabledPredicate.notMatch: negation of non-ground atom (floundering)');
                generator.consumeNegatively(function () { return k(s); });
                if (isNew)
                    generator.execute();
            }; }; };
        };
        return TabledPredicate;
    }());
    exports.TabledPredicate = TabledPredicate;
    function seq(m1, m2) {
        return function (gen) { return function (s) { return function (k) { return m1(gen)(s)(function (s) { return m2(gen)(s)(k); }); }; }; };
    }
    exports.seq = seq;
    function ground(val) {
        return function (gen) { return function (s) { return function (k) { return k(unify_1.groundJson(val, s)); }; }; };
    }
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
});
//# sourceMappingURL=slg.js.map
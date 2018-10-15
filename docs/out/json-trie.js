var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        define(["require", "exports", "./unify"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unify_1 = require("./unify");
    function emptyObjectUnless(x) { return x === void (0) ? {} : x; }
    function isEmptyObject(x) {
        for (var k in x) {
            return false;
        }
        return true;
    }
    function convert(type, val) {
        if (type === 'boolean')
            return Boolean(val);
        if (type === 'number')
            return Number(val);
        return val;
    }
    var JsonTrie = (function () {
        function JsonTrie(trie) {
            if (trie === void 0) { trie = {}; }
            this.trie = trie;
        }
        JsonTrie.fromJson = function (json) {
            return new JsonTrie(json);
        };
        JsonTrie.create = function () {
            return new JsonTrie();
        };
        Object.defineProperty(JsonTrie.prototype, "json", {
            get: function () {
                return this.trie;
            },
            enumerable: true,
            configurable: true
        });
        JsonTrie.prototype.insert = function (key, val) {
            return JsonTrie.insertRec(key, val, this.trie);
        };
        JsonTrie.prototype.modify = function (key, f) {
            return JsonTrie.modifyRec(key, f, this.trie);
        };
        JsonTrie.prototype.clear = function () {
            this.trie = {};
        };
        JsonTrie.prototype.minus = function (other) {
            JsonTrie.minusRec(this.trie, other.trie);
            return this;
        };
        JsonTrie.prototype.contains = function (key) {
            return JsonTrie.containsRec(key, this.trie);
        };
        JsonTrie.prototype.lookup = function (key) {
            return JsonTrie.lookupRec(key, this.trie);
        };
        JsonTrie.prototype.keys = function () {
            var _a, _b, t, e_1_1, e_1, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.rowRec(this.trie)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        t = _b.value;
                        return [4, t[0]];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrie.prototype.values = function () {
            var _a, _b, t, e_2_1, e_2, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.rowRec(this.trie)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        t = _b.value;
                        return [4, t[1]];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_2_1 = _d.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrie.prototype.entries = function () {
            return JsonTrie.rowRec(this.trie);
        };
        JsonTrie.prototype.entriesCont = function (k) {
            return JsonTrie.rowContRec(this.trie, k);
        };
        JsonTrie.prototype.match = function (key, sub) {
            var _a, _b, t, e_3_1, e_3, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.matchRec(key, sub, this.trie)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        t = _b.value;
                        return [4, t[1]];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_3_1 = _d.sent();
                        e_3 = { error: e_3_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrie.prototype.matchWithValue = function (key, sub) {
            return JsonTrie.matchRec(key, sub, this.trie);
        };
        JsonTrie.prototype.matchCont = function (key, sub, k) {
            return JsonTrie.matchContRec(key, sub, this.trie, k);
        };
        JsonTrie.matchRecArray = function (key, i, sub, curr) {
            var _a, _b, t, e_4_1, e_4, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(i < key.length)) return [3, 9];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = __values(JsonTrie.matchRec(key[i], sub, curr)), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3, 5];
                        t = _b.value;
                        return [5, __values(JsonTrie.matchRecArray(key, i + 1, t[1], t[0]))];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_4_1 = _d.sent();
                        e_4 = { error: e_4_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7];
                    case 8: return [3, 11];
                    case 9:
                        if (!('empty' in curr)) return [3, 11];
                        return [4, [curr.empty, sub]];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11: return [2];
                }
            });
        };
        JsonTrie.matchRecObject = function (key, keys, i, sub, curr) {
            var node, k, _a, _b, t, e_5_1, e_5, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(i < keys.length)) return [3, 9];
                        node = curr.more;
                        if (node === void (0))
                            return [2];
                        k = keys[i];
                        node = node[k];
                        if (node === void (0))
                            return [2];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = __values(JsonTrie.matchRec(key[k], sub, node)), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3, 5];
                        t = _b.value;
                        return [5, __values(JsonTrie.matchRecObject(key, keys, i + 1, t[1], t[0]))];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_5_1 = _d.sent();
                        e_5 = { error: e_5_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_5) throw e_5.error; }
                        return [7];
                    case 8: return [3, 11];
                    case 9:
                        if (!('empty' in curr)) return [3, 11];
                        return [4, [curr.empty, sub]];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11: return [2];
                }
            });
        };
        JsonTrie.matchRec = function (key, sub, curr) {
            var type, v, _a, _b, t, e_6_1, node, node, keys, node, e_6, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        type = typeof key;
                        if (!(type === 'object')) return [3, 21];
                        if (!(key === null)) return [3, 3];
                        if (!('null' in curr)) return [3, 2];
                        return [4, [curr.null, sub]];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2: return [3, 20];
                    case 3:
                        if (!(key instanceof unify_1.Variable)) return [3, 15];
                        v = sub.lookupAsVar(key);
                        if (!(v instanceof unify_1.Variable)) return [3, 12];
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 9, 10, 11]);
                        _a = __values(JsonTrie.rowRec(curr)), _b = _a.next();
                        _d.label = 5;
                    case 5:
                        if (!!_b.done) return [3, 8];
                        t = _b.value;
                        return [4, [t[1], sub.bind(v, t[0])]];
                    case 6:
                        _d.sent();
                        _d.label = 7;
                    case 7:
                        _b = _a.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_6_1 = _d.sent();
                        e_6 = { error: e_6_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_6) throw e_6.error; }
                        return [7];
                    case 11: return [3, 14];
                    case 12: return [5, __values(JsonTrie.matchRec(v, sub, curr))];
                    case 13:
                        _d.sent();
                        _d.label = 14;
                    case 14: return [3, 20];
                    case 15:
                        if (!(key instanceof Array)) return [3, 18];
                        node = curr.array;
                        if (!(node !== void (0))) return [3, 17];
                        return [5, __values(JsonTrie.matchRecArray(key, 0, sub, node))];
                    case 16:
                        _d.sent();
                        _d.label = 17;
                    case 17: return [3, 20];
                    case 18:
                        node = curr.object;
                        if (!(node !== void (0))) return [3, 20];
                        keys = Object.keys(key).sort();
                        return [5, __values(JsonTrie.matchRecObject(key, keys, 0, sub, node))];
                    case 19:
                        _d.sent();
                        _d.label = 20;
                    case 20: return [3, 26];
                    case 21:
                        if (!(type === 'undefined')) return [3, 24];
                        if (!('undefined' in curr)) return [3, 23];
                        return [4, [curr.undefined, sub]];
                    case 22:
                        _d.sent();
                        _d.label = 23;
                    case 23: return [3, 26];
                    case 24:
                        node = curr[type];
                        if (!(node !== void (0))) return [3, 26];
                        if (!(key in node)) return [3, 26];
                        return [4, [node[key], sub]];
                    case 25:
                        _d.sent();
                        _d.label = 26;
                    case 26: return [2];
                }
            });
        };
        JsonTrie.matchContRecArray = function (key, i, sub, curr, k) {
            if (i < key.length) {
                return JsonTrie.matchContRec(key[i], sub, curr, function (s, v) {
                    return JsonTrie.matchContRecArray(key, i + 1, s, v, k);
                });
            }
            else {
                if ('empty' in curr)
                    return k(sub, curr.empty);
            }
        };
        JsonTrie.matchContRecObject = function (key, keys, i, sub, curr, k) {
            if (i < keys.length) {
                var node = curr.more;
                if (node === void (0))
                    return;
                var ki = keys[i];
                node = node[ki];
                if (node === void (0))
                    return;
                return JsonTrie.matchContRec(key[ki], sub, node, function (s, v) {
                    return JsonTrie.matchContRecObject(key, keys, i + 1, s, v, k);
                });
            }
            else {
                if ('empty' in curr)
                    return k(sub, curr.empty);
            }
        };
        JsonTrie.matchContRec = function (key, sub, curr, k) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    if ('null' in curr)
                        return k(sub, curr.null);
                }
                else if (key instanceof unify_1.Variable) {
                    var v_1 = sub.lookupAsVar(key);
                    if (v_1 instanceof unify_1.Variable) {
                        return JsonTrie.rowContRec(curr, function (x, val) { return k(sub.bind(v_1, x), val); });
                    }
                    else {
                        return JsonTrie.matchContRec(v_1, sub, curr, k);
                    }
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node !== void (0)) {
                        return JsonTrie.matchContRecArray(key, 0, sub, node, k);
                    }
                }
                else {
                    var node = curr.object;
                    if (node !== void (0)) {
                        var keys = Object.keys(key).sort();
                        return JsonTrie.matchContRecObject(key, keys, 0, sub, node, k);
                    }
                }
            }
            else if (type === 'undefined') {
                if ('undefined' in curr)
                    return k(sub, curr.undefined);
            }
            else {
                var node = curr[type];
                if (node !== void (0)) {
                    if (key in node)
                        return k(sub, node[key]);
                }
            }
        };
        JsonTrie.rowRecObject = function (curr, result) {
            var obj, result_1, result_1_1, t, moreNode, _a, _b, _i, k, node, _c, _d, _e, type, _f, _g, _h, t, e_7_1, _j, _k, t, e_8_1, valNode, _l, _m, _o, k2, e_9, _p, e_7, _q, e_8, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        if (!('empty' in curr)) return [3, 2];
                        obj = {};
                        try {
                            for (result_1 = __values(result), result_1_1 = result_1.next(); !result_1_1.done; result_1_1 = result_1.next()) {
                                t = result_1_1.value;
                                obj[t[0]] = t[1];
                            }
                        }
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (result_1_1 && !result_1_1.done && (_p = result_1.return)) _p.call(result_1);
                            }
                            finally { if (e_9) throw e_9.error; }
                        }
                        return [4, [obj, curr.empty]];
                    case 1:
                        _s.sent();
                        _s.label = 2;
                    case 2:
                        moreNode = curr.more;
                        if (moreNode === void (0))
                            return [2];
                        _a = [];
                        for (_b in moreNode)
                            _a.push(_b);
                        _i = 0;
                        _s.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3, 32];
                        k = _a[_i];
                        node = moreNode[k];
                        _c = [];
                        for (_d in node)
                            _c.push(_d);
                        _e = 0;
                        _s.label = 4;
                    case 4:
                        if (!(_e < _c.length)) return [3, 31];
                        type = _c[_e];
                        _f = type;
                        switch (_f) {
                            case 'array': return [3, 5];
                            case 'object': return [3, 13];
                            case 'null': return [3, 21];
                            case 'undefined': return [3, 23];
                            case 'number': return [3, 25];
                            case 'boolean': return [3, 25];
                            case 'string': return [3, 25];
                        }
                        return [3, 30];
                    case 5:
                        _s.trys.push([5, 10, 11, 12]);
                        _g = __values(JsonTrie.rowRecArray(node.array, [])), _h = _g.next();
                        _s.label = 6;
                    case 6:
                        if (!!_h.done) return [3, 9];
                        t = _h.value;
                        result.push([k, t[0]]);
                        return [5, __values(JsonTrie.rowRecObject(t[1], result))];
                    case 7:
                        _s.sent();
                        result.pop();
                        _s.label = 8;
                    case 8:
                        _h = _g.next();
                        return [3, 6];
                    case 9: return [3, 12];
                    case 10:
                        e_7_1 = _s.sent();
                        e_7 = { error: e_7_1 };
                        return [3, 12];
                    case 11:
                        try {
                            if (_h && !_h.done && (_q = _g.return)) _q.call(_g);
                        }
                        finally { if (e_7) throw e_7.error; }
                        return [7];
                    case 12: return [3, 30];
                    case 13:
                        _s.trys.push([13, 18, 19, 20]);
                        _j = __values(JsonTrie.rowRecObject(node.object, [])), _k = _j.next();
                        _s.label = 14;
                    case 14:
                        if (!!_k.done) return [3, 17];
                        t = _k.value;
                        result.push([k, t[0]]);
                        return [5, __values(JsonTrie.rowRecObject(t[1], result))];
                    case 15:
                        _s.sent();
                        result.pop();
                        _s.label = 16;
                    case 16:
                        _k = _j.next();
                        return [3, 14];
                    case 17: return [3, 20];
                    case 18:
                        e_8_1 = _s.sent();
                        e_8 = { error: e_8_1 };
                        return [3, 20];
                    case 19:
                        try {
                            if (_k && !_k.done && (_r = _j.return)) _r.call(_j);
                        }
                        finally { if (e_8) throw e_8.error; }
                        return [7];
                    case 20: return [3, 30];
                    case 21:
                        result.push([k, null]);
                        return [5, __values(JsonTrie.rowRecObject(node.null, result))];
                    case 22:
                        _s.sent();
                        result.pop();
                        return [3, 30];
                    case 23:
                        result.push([k, void (0)]);
                        return [5, __values(JsonTrie.rowRecObject(node.undefined, result))];
                    case 24:
                        _s.sent();
                        result.pop();
                        return [3, 30];
                    case 25:
                        valNode = node[type];
                        _l = [];
                        for (_m in valNode)
                            _l.push(_m);
                        _o = 0;
                        _s.label = 26;
                    case 26:
                        if (!(_o < _l.length)) return [3, 29];
                        k2 = _l[_o];
                        result.push([k, convert(type, k2)]);
                        return [5, __values(JsonTrie.rowRecObject(valNode[k2], result))];
                    case 27:
                        _s.sent();
                        result.pop();
                        _s.label = 28;
                    case 28:
                        _o++;
                        return [3, 26];
                    case 29: return [3, 30];
                    case 30:
                        _e++;
                        return [3, 4];
                    case 31:
                        _i++;
                        return [3, 3];
                    case 32: return [2];
                }
            });
        };
        JsonTrie.rowRecArray = function (curr, result) {
            var _a, _b, _i, type, _c, _d, _e, t, e_10_1, _f, _g, t, e_11_1, valNode, _h, _j, _k, k, e_10, _l, e_11, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _o.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 30];
                        type = _a[_i];
                        _c = type;
                        switch (_c) {
                            case 'empty': return [3, 2];
                            case 'array': return [3, 4];
                            case 'object': return [3, 12];
                            case 'null': return [3, 20];
                            case 'undefined': return [3, 22];
                            case 'number': return [3, 24];
                            case 'boolean': return [3, 24];
                            case 'string': return [3, 24];
                        }
                        return [3, 29];
                    case 2: return [4, [result.slice(), curr.empty]];
                    case 3:
                        _o.sent();
                        return [3, 29];
                    case 4:
                        _o.trys.push([4, 9, 10, 11]);
                        _d = __values(JsonTrie.rowRecArray(curr.array, [])), _e = _d.next();
                        _o.label = 5;
                    case 5:
                        if (!!_e.done) return [3, 8];
                        t = _e.value;
                        result.push(t[0]);
                        return [5, __values(JsonTrie.rowRecArray(t[1], result))];
                    case 6:
                        _o.sent();
                        result.pop();
                        _o.label = 7;
                    case 7:
                        _e = _d.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_10_1 = _o.sent();
                        e_10 = { error: e_10_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_e && !_e.done && (_l = _d.return)) _l.call(_d);
                        }
                        finally { if (e_10) throw e_10.error; }
                        return [7];
                    case 11: return [3, 29];
                    case 12:
                        _o.trys.push([12, 17, 18, 19]);
                        _f = __values(JsonTrie.rowRecObject(curr.object, [])), _g = _f.next();
                        _o.label = 13;
                    case 13:
                        if (!!_g.done) return [3, 16];
                        t = _g.value;
                        result.push(t[0]);
                        return [5, __values(JsonTrie.rowRecArray(t[1], result))];
                    case 14:
                        _o.sent();
                        result.pop();
                        _o.label = 15;
                    case 15:
                        _g = _f.next();
                        return [3, 13];
                    case 16: return [3, 19];
                    case 17:
                        e_11_1 = _o.sent();
                        e_11 = { error: e_11_1 };
                        return [3, 19];
                    case 18:
                        try {
                            if (_g && !_g.done && (_m = _f.return)) _m.call(_f);
                        }
                        finally { if (e_11) throw e_11.error; }
                        return [7];
                    case 19: return [3, 29];
                    case 20:
                        result.push(null);
                        return [5, __values(JsonTrie.rowRecArray(curr.null, result))];
                    case 21:
                        _o.sent();
                        result.pop();
                        return [3, 29];
                    case 22:
                        result.push(void (0));
                        return [5, __values(JsonTrie.rowRecArray(curr.undefined, result))];
                    case 23:
                        _o.sent();
                        result.pop();
                        return [3, 29];
                    case 24:
                        valNode = curr[type];
                        _h = [];
                        for (_j in valNode)
                            _h.push(_j);
                        _k = 0;
                        _o.label = 25;
                    case 25:
                        if (!(_k < _h.length)) return [3, 28];
                        k = _h[_k];
                        result.push(convert(type, k));
                        return [5, __values(JsonTrie.rowRecArray(valNode[k], result))];
                    case 26:
                        _o.sent();
                        result.pop();
                        _o.label = 27;
                    case 27:
                        _k++;
                        return [3, 25];
                    case 28: return [3, 29];
                    case 29:
                        _i++;
                        return [3, 1];
                    case 30: return [2];
                }
            });
        };
        JsonTrie.rowRec = function (curr) {
            var _a, _b, _i, type, _c, valNode, _d, _e, _f, k;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _g.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 16];
                        type = _a[_i];
                        _c = type;
                        switch (_c) {
                            case 'array': return [3, 2];
                            case 'object': return [3, 4];
                            case 'null': return [3, 6];
                            case 'undefined': return [3, 8];
                            case 'number': return [3, 10];
                            case 'boolean': return [3, 10];
                            case 'string': return [3, 10];
                        }
                        return [3, 15];
                    case 2: return [5, __values(JsonTrie.rowRecArray(curr.array, []))];
                    case 3:
                        _g.sent();
                        return [3, 15];
                    case 4: return [5, __values(JsonTrie.rowRecObject(curr.object, []))];
                    case 5:
                        _g.sent();
                        return [3, 15];
                    case 6: return [4, [null, curr.null]];
                    case 7:
                        _g.sent();
                        return [3, 15];
                    case 8: return [4, [void (0), curr.undefined]];
                    case 9:
                        _g.sent();
                        return [3, 15];
                    case 10:
                        valNode = curr[type];
                        _d = [];
                        for (_e in valNode)
                            _d.push(_e);
                        _f = 0;
                        _g.label = 11;
                    case 11:
                        if (!(_f < _d.length)) return [3, 14];
                        k = _d[_f];
                        return [4, [convert(type, k), valNode[k]]];
                    case 12:
                        _g.sent();
                        _g.label = 13;
                    case 13:
                        _f++;
                        return [3, 11];
                    case 14: return [3, 15];
                    case 15:
                        _i++;
                        return [3, 1];
                    case 16: return [2];
                }
            });
        };
        JsonTrie.rowContRecObject = function (curr, result, cont) {
            if ('empty' in curr) {
                var obj = {};
                try {
                    for (var result_2 = __values(result), result_2_1 = result_2.next(); !result_2_1.done; result_2_1 = result_2.next()) {
                        var t = result_2_1.value;
                        obj[t[0]] = t[1];
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (result_2_1 && !result_2_1.done && (_a = result_2.return)) _a.call(result_2);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
                cont(obj, curr.empty);
            }
            var moreNode = curr.more;
            if (moreNode === void (0))
                return;
            var _loop_1 = function (k) {
                var node = moreNode[k];
                for (var type in node) {
                    switch (type) {
                        case 'array':
                            JsonTrie.rowContRecArray(node.array, [], function (key, v) {
                                result.push([k, key]);
                                JsonTrie.rowContRecObject(v, result, cont);
                                result.pop();
                            });
                            break;
                        case 'object':
                            JsonTrie.rowContRecObject(node.object, [], function (key, v) {
                                result.push([k, key]);
                                JsonTrie.rowContRecObject(v, result, cont);
                                result.pop();
                            });
                            break;
                        case 'null':
                            result.push([k, null]);
                            JsonTrie.rowContRecObject(node.null, result, cont);
                            result.pop();
                            break;
                        case 'undefined':
                            result.push([k, void (0)]);
                            JsonTrie.rowContRecObject(node.undefined, result, cont);
                            result.pop();
                            break;
                        case 'number':
                        case 'boolean':
                        case 'string':
                            var valNode = node[type];
                            for (var k2 in valNode) {
                                result.push([k, convert(type, k2)]);
                                JsonTrie.rowContRecObject(valNode[k2], result, cont);
                                result.pop();
                            }
                            break;
                    }
                }
            };
            for (var k in moreNode) {
                _loop_1(k);
            }
            var e_12, _a;
        };
        JsonTrie.rowContRecArray = function (curr, result, cont) {
            for (var type in curr) {
                switch (type) {
                    case 'empty':
                        cont(result.slice(), curr.empty);
                        break;
                    case 'array':
                        JsonTrie.rowContRecArray(curr.array, [], function (k, v) {
                            result.push(k);
                            JsonTrie.rowContRecArray(v, result, cont);
                            result.pop();
                        });
                        break;
                    case 'object':
                        JsonTrie.rowContRecObject(curr.object, [], function (k, v) {
                            result.push(k);
                            JsonTrie.rowContRecArray(v, result, cont);
                            result.pop();
                        });
                        break;
                    case 'null':
                        result.push(null);
                        JsonTrie.rowContRecArray(curr.null, result, cont);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push(void (0));
                        JsonTrie.rowContRecArray(curr.undefined, result, cont);
                        result.pop();
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        var valNode = curr[type];
                        for (var k in valNode) {
                            result.push(convert(type, k));
                            JsonTrie.rowContRecArray(valNode[k], result, cont);
                            result.pop();
                        }
                        break;
                }
            }
        };
        JsonTrie.rowContRec = function (curr, cont) {
            for (var type in curr) {
                switch (type) {
                    case 'array':
                        JsonTrie.rowContRecArray(curr.array, [], cont);
                        break;
                    case 'object':
                        JsonTrie.rowContRecObject(curr.object, [], cont);
                        break;
                    case 'null':
                        cont(null, curr.null);
                        break;
                    case 'undefined':
                        cont(void (0), curr.undefined);
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        var valNode = curr[type];
                        for (var k in valNode) {
                            cont(convert(type, k), valNode[k]);
                        }
                        break;
                }
            }
        };
        JsonTrie.lookupRec = function (key, curr) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return curr.null;
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        return void (0);
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrie.lookupRec(key[i], node);
                        if (node === void (0))
                            return void (0);
                    }
                    node = node.empty;
                    return node;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        return void (0);
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        node = node.more;
                        if (node === void (0))
                            return void (0);
                        node = node[k];
                        if (node === void (0))
                            return void (0);
                        node = JsonTrie.lookupRec(key[k], node);
                        if (node === void (0))
                            return void (0);
                    }
                    node = node.empty;
                    return node;
                }
            }
            else if (type === 'undefined') {
                return curr.undefined;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    return void (0);
                return node[key];
            }
        };
        JsonTrie.containsRec = function (key, curr) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return 'null' in curr;
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        return false;
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrie.lookupRec(key[i], node);
                        if (node === void (0))
                            return false;
                    }
                    return 'empty' in node;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        return false;
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        node = node.more;
                        if (node === void (0))
                            return false;
                        node = node[k];
                        if (node === void (0))
                            return false;
                        node = JsonTrie.lookupRec(key[k], node);
                        if (node === void (0))
                            return false;
                    }
                    return 'empty' in node;
                }
            }
            else if (type === 'undefined') {
                return 'undefined' in curr;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    false;
                return key in node;
            }
        };
        JsonTrie.insertRec = function (key, val, curr, root) {
            if (root === void 0) { root = true; }
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    if (root)
                        return curr.null = val;
                    var node = curr.null;
                    if (node === void (0))
                        curr.null = node = val;
                    return node;
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrie.insertRec(key[i], {}, node, false);
                    }
                    if (root)
                        return node.empty = val;
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        curr.object = node = {};
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        var node2_1 = node.more;
                        if (node2_1 === void (0))
                            node.more = node2_1 = {};
                        var node3 = node2_1[k];
                        if (node3 === void (0))
                            node2_1[k] = node3 = {};
                        node = JsonTrie.insertRec(key[k], {}, node3, false);
                    }
                    if (root)
                        return node.empty = val;
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
            }
            else if (type === 'undefined') {
                if (root)
                    return curr.undefined = val;
                var node = curr.undefined;
                if (node === void (0))
                    curr.undefined = node = val;
                return node;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
                if (root)
                    return node[key] = val;
                var node2 = node[key];
                if (node2 === void (0))
                    node[key] = node2 = val;
                return node2;
            }
        };
        JsonTrie.modifyRec = function (key, f, curr) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return curr.null = f(curr.null);
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrie.modifyRec(key[i], emptyObjectUnless, node);
                    }
                    return node.empty = f(node.empty);
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        curr.object = node = {};
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        var node2 = node.more;
                        if (node2 === void (0))
                            node.more = node2 = {};
                        var node3 = node2[k];
                        if (node3 === void (0))
                            node2[k] = node3 = {};
                        node = JsonTrie.modifyRec(key[k], emptyObjectUnless, node3);
                    }
                    return node.empty = f(node.empty);
                }
            }
            else if (type === 'undefined') {
                return curr.undefined = f(curr.undefined);
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
                return node[key] = f(node[key]);
            }
        };
        JsonTrie.minusRecObject = function (curr, other, cont) {
            if ('empty' in other && 'empty' in curr) {
                if (cont(curr.empty, other.empty)) {
                    delete curr.empty;
                }
            }
            if (!('more' in other))
                return;
            var otherMore = other.more;
            if (!('more' in curr))
                return;
            var currMore = curr.more;
            for (var k in otherMore) {
                if (!(k in currMore))
                    continue;
                var otherNode = otherMore[k];
                var node = currMore[k];
                for (var type in otherNode) {
                    switch (type) {
                        case 'array':
                            JsonTrie.minusRecArray(node.array, otherNode.array, function (c, o) { return (JsonTrie.minusRecObject(c, o, cont), isEmptyObject(c)); });
                            if (isEmptyObject(node.array))
                                delete node.array;
                            break;
                        case 'object':
                            JsonTrie.minusRecObject(node.object, otherNode.object, function (c, o) { return (JsonTrie.minusRecObject(c, o, cont), isEmptyObject(c)); });
                            if (isEmptyObject(node.object))
                                delete node.object;
                            break;
                        case 'null':
                        case 'undefined':
                            var currt = node[type];
                            var othert = otherNode[type];
                            JsonTrie.minusRecObject(currt, othert, cont);
                            if (isEmptyObject(currt))
                                delete node[type];
                            break;
                        case 'number':
                        case 'boolean':
                        case 'string':
                            var nodet = node[type];
                            var otherNodet = otherNode[type];
                            for (var k_1 in otherNodet) {
                                if (k_1 in nodet) {
                                    var currk = nodet[k_1];
                                    var otherk = otherNodet[k_1];
                                    JsonTrie.minusRecObject(currk, otherk, cont);
                                    if (isEmptyObject(currk))
                                        delete nodet[k_1];
                                }
                            }
                            if (isEmptyObject(nodet))
                                delete node[type];
                            break;
                    }
                }
                if (isEmptyObject(node))
                    delete currMore[k];
            }
            if (isEmptyObject(currMore))
                delete curr.more;
        };
        JsonTrie.minusRecArray = function (curr, other, cont) {
            for (var type in other) {
                if (!(type in curr))
                    continue;
                switch (type) {
                    case 'empty':
                        if (cont(curr.empty, other.empty)) {
                            delete curr.empty;
                        }
                        break;
                    case 'array':
                        JsonTrie.minusRecArray(curr.array, other.array, function (c, o) { return (JsonTrie.minusRecArray(c, o, cont), isEmptyObject(c)); });
                        if (isEmptyObject(curr.array))
                            delete curr.array;
                        break;
                    case 'object':
                        JsonTrie.minusRecObject(curr.object, other.object, function (c, o) { return (JsonTrie.minusRecArray(c, o, cont), isEmptyObject(c)); });
                        if (isEmptyObject(curr.object))
                            delete curr.object;
                        break;
                    case 'null':
                    case 'undefined':
                        var currt = curr[type];
                        var othert = other[type];
                        JsonTrie.minusRecArray(currt, othert, cont);
                        if (isEmptyObject(currt))
                            delete curr[type];
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        var node = curr[type];
                        var otherNode = other[type];
                        for (var k in otherNode) {
                            if (k in node) {
                                var currk = node[k];
                                var otherk = otherNode[k];
                                JsonTrie.minusRecArray(currk, otherk, cont);
                                if (isEmptyObject(currk))
                                    delete node[k];
                            }
                        }
                        if (isEmptyObject(node))
                            delete curr[type];
                        break;
                }
            }
        };
        JsonTrie.minusRec = function (curr, other) {
            for (var type in other) {
                if (!(type in curr))
                    continue;
                switch (type) {
                    case 'array':
                        JsonTrie.minusRecArray(curr.array, other.array, function () { return true; });
                        if (isEmptyObject(curr.array))
                            delete curr.array;
                        break;
                    case 'object':
                        JsonTrie.minusRecObject(curr.object, other.object, function () { return true; });
                        if (isEmptyObject(curr.object))
                            delete curr.object;
                        break;
                    case 'null':
                    case 'undefined':
                        delete curr[type];
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        var node = curr[type];
                        var otherNode = other[type];
                        for (var k in otherNode) {
                            delete node[k];
                        }
                        if (isEmptyObject(node))
                            delete curr[type];
                        break;
                }
            }
        };
        return JsonTrie;
    }());
    exports.JsonTrie = JsonTrie;
    var JsonTrieTerm = (function () {
        function JsonTrieTerm(trie) {
            if (trie === void 0) { trie = {}; }
            this.trie = trie;
        }
        JsonTrieTerm.fromJson = function (json) {
            return new JsonTrieTerm(json);
        };
        JsonTrieTerm.create = function () {
            return new JsonTrieTerm();
        };
        JsonTrieTerm.convert = function (type, val) {
            if (type === 'boolean')
                return Boolean(val);
            if (type === 'number')
                return Number(val);
            if (type === 'variable')
                return new unify_1.Variable(Number(val));
            return val;
        };
        Object.defineProperty(JsonTrieTerm.prototype, "json", {
            get: function () {
                return this.trie;
            },
            enumerable: true,
            configurable: true
        });
        JsonTrieTerm.prototype.insert = function (key, val) {
            return JsonTrieTerm.insertRec(key, val, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.modify = function (key, f) {
            return JsonTrieTerm.modifyRec(key, f, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.modifyWithVars = function (key, f) {
            return JsonTrieTerm.modifyWithVarsRec(key, f, this.trie, { vars: [] });
        };
        JsonTrieTerm.prototype.clear = function () {
            this.trie = {};
        };
        JsonTrieTerm.prototype.minus = function (other) {
            JsonTrieTerm.minusRec(this.trie, other.trie);
            return this;
        };
        JsonTrieTerm.prototype.contains = function (key) {
            return JsonTrieTerm.containsRec(key, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.lookup = function (key) {
            return JsonTrieTerm.lookupRec(key, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.keys = function () {
            var _a, _b, t, e_13_1, e_13, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrieTerm.rowRec(this.trie)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        t = _b.value;
                        return [4, t[0]];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_13_1 = _d.sent();
                        e_13 = { error: e_13_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_13) throw e_13.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrieTerm.prototype.values = function () {
            var _a, _b, t, e_14_1, e_14, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrieTerm.rowRec(this.trie)), _b = _a.next();
                        _d.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        t = _b.value;
                        return [4, t[1]];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_14_1 = _d.sent();
                        e_14 = { error: e_14_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_14) throw e_14.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrieTerm.prototype.entries = function () {
            return JsonTrieTerm.rowRec(this.trie);
        };
        JsonTrieTerm.prototype.entriesCont = function (k) {
            return JsonTrieTerm.rowContRec(this.trie, k);
        };
        JsonTrieTerm.rowRecObject = function (curr, result) {
            var obj, result_3, result_3_1, t, moreNode, _a, _b, _i, k, node, _c, _d, _e, type, _f, _g, _h, t, e_15_1, _j, _k, t, e_16_1, valNode, _l, _m, _o, k2, e_17, _p, e_15, _q, e_16, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        if (!('empty' in curr)) return [3, 2];
                        obj = {};
                        try {
                            for (result_3 = __values(result), result_3_1 = result_3.next(); !result_3_1.done; result_3_1 = result_3.next()) {
                                t = result_3_1.value;
                                obj[t[0]] = t[1];
                            }
                        }
                        catch (e_17_1) { e_17 = { error: e_17_1 }; }
                        finally {
                            try {
                                if (result_3_1 && !result_3_1.done && (_p = result_3.return)) _p.call(result_3);
                            }
                            finally { if (e_17) throw e_17.error; }
                        }
                        return [4, [obj, curr.empty]];
                    case 1:
                        _s.sent();
                        _s.label = 2;
                    case 2:
                        moreNode = curr.more;
                        if (moreNode === void (0))
                            return [2];
                        _a = [];
                        for (_b in moreNode)
                            _a.push(_b);
                        _i = 0;
                        _s.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3, 32];
                        k = _a[_i];
                        node = moreNode[k];
                        _c = [];
                        for (_d in node)
                            _c.push(_d);
                        _e = 0;
                        _s.label = 4;
                    case 4:
                        if (!(_e < _c.length)) return [3, 31];
                        type = _c[_e];
                        _f = type;
                        switch (_f) {
                            case 'array': return [3, 5];
                            case 'object': return [3, 13];
                            case 'null': return [3, 21];
                            case 'undefined': return [3, 23];
                            case 'number': return [3, 25];
                            case 'string': return [3, 25];
                            case 'boolean': return [3, 25];
                            case 'variable': return [3, 25];
                        }
                        return [3, 30];
                    case 5:
                        _s.trys.push([5, 10, 11, 12]);
                        _g = __values(JsonTrieTerm.rowRecArray(node.array, [])), _h = _g.next();
                        _s.label = 6;
                    case 6:
                        if (!!_h.done) return [3, 9];
                        t = _h.value;
                        result.push([k, t[0]]);
                        return [5, __values(JsonTrieTerm.rowRecObject(t[1], result))];
                    case 7:
                        _s.sent();
                        result.pop();
                        _s.label = 8;
                    case 8:
                        _h = _g.next();
                        return [3, 6];
                    case 9: return [3, 12];
                    case 10:
                        e_15_1 = _s.sent();
                        e_15 = { error: e_15_1 };
                        return [3, 12];
                    case 11:
                        try {
                            if (_h && !_h.done && (_q = _g.return)) _q.call(_g);
                        }
                        finally { if (e_15) throw e_15.error; }
                        return [7];
                    case 12: return [3, 30];
                    case 13:
                        _s.trys.push([13, 18, 19, 20]);
                        _j = __values(JsonTrieTerm.rowRecObject(node.object, [])), _k = _j.next();
                        _s.label = 14;
                    case 14:
                        if (!!_k.done) return [3, 17];
                        t = _k.value;
                        result.push([k, t[0]]);
                        return [5, __values(JsonTrieTerm.rowRecObject(t[1], result))];
                    case 15:
                        _s.sent();
                        result.pop();
                        _s.label = 16;
                    case 16:
                        _k = _j.next();
                        return [3, 14];
                    case 17: return [3, 20];
                    case 18:
                        e_16_1 = _s.sent();
                        e_16 = { error: e_16_1 };
                        return [3, 20];
                    case 19:
                        try {
                            if (_k && !_k.done && (_r = _j.return)) _r.call(_j);
                        }
                        finally { if (e_16) throw e_16.error; }
                        return [7];
                    case 20: return [3, 30];
                    case 21:
                        result.push([k, null]);
                        return [5, __values(JsonTrieTerm.rowRecObject(node.null, result))];
                    case 22:
                        _s.sent();
                        result.pop();
                        return [3, 30];
                    case 23:
                        result.push([k, void (0)]);
                        return [5, __values(JsonTrieTerm.rowRecObject(node.undefined, result))];
                    case 24:
                        _s.sent();
                        result.pop();
                        return [3, 30];
                    case 25:
                        valNode = node[type];
                        _l = [];
                        for (_m in valNode)
                            _l.push(_m);
                        _o = 0;
                        _s.label = 26;
                    case 26:
                        if (!(_o < _l.length)) return [3, 29];
                        k2 = _l[_o];
                        result.push([k, JsonTrieTerm.convert(type, k2)]);
                        return [5, __values(JsonTrieTerm.rowRecObject(valNode[k2], result))];
                    case 27:
                        _s.sent();
                        result.pop();
                        _s.label = 28;
                    case 28:
                        _o++;
                        return [3, 26];
                    case 29: return [3, 30];
                    case 30:
                        _e++;
                        return [3, 4];
                    case 31:
                        _i++;
                        return [3, 3];
                    case 32: return [2];
                }
            });
        };
        JsonTrieTerm.rowRecArray = function (curr, result) {
            var _a, _b, _i, type, _c, _d, _e, t, e_18_1, _f, _g, t, e_19_1, valNode, _h, _j, _k, k, e_18, _l, e_19, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _o.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 30];
                        type = _a[_i];
                        _c = type;
                        switch (_c) {
                            case 'empty': return [3, 2];
                            case 'array': return [3, 4];
                            case 'object': return [3, 12];
                            case 'null': return [3, 20];
                            case 'undefined': return [3, 22];
                            case 'number': return [3, 24];
                            case 'string': return [3, 24];
                            case 'boolean': return [3, 24];
                            case 'variable': return [3, 24];
                        }
                        return [3, 29];
                    case 2: return [4, [result.slice(), curr.empty]];
                    case 3:
                        _o.sent();
                        return [3, 29];
                    case 4:
                        _o.trys.push([4, 9, 10, 11]);
                        _d = __values(JsonTrieTerm.rowRecArray(curr.array, [])), _e = _d.next();
                        _o.label = 5;
                    case 5:
                        if (!!_e.done) return [3, 8];
                        t = _e.value;
                        result.push(t[0]);
                        return [5, __values(JsonTrieTerm.rowRecArray(t[1], result))];
                    case 6:
                        _o.sent();
                        result.pop();
                        _o.label = 7;
                    case 7:
                        _e = _d.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_18_1 = _o.sent();
                        e_18 = { error: e_18_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_e && !_e.done && (_l = _d.return)) _l.call(_d);
                        }
                        finally { if (e_18) throw e_18.error; }
                        return [7];
                    case 11: return [3, 29];
                    case 12:
                        _o.trys.push([12, 17, 18, 19]);
                        _f = __values(JsonTrieTerm.rowRecObject(curr.object, [])), _g = _f.next();
                        _o.label = 13;
                    case 13:
                        if (!!_g.done) return [3, 16];
                        t = _g.value;
                        result.push(t[0]);
                        return [5, __values(JsonTrieTerm.rowRecArray(t[1], result))];
                    case 14:
                        _o.sent();
                        result.pop();
                        _o.label = 15;
                    case 15:
                        _g = _f.next();
                        return [3, 13];
                    case 16: return [3, 19];
                    case 17:
                        e_19_1 = _o.sent();
                        e_19 = { error: e_19_1 };
                        return [3, 19];
                    case 18:
                        try {
                            if (_g && !_g.done && (_m = _f.return)) _m.call(_f);
                        }
                        finally { if (e_19) throw e_19.error; }
                        return [7];
                    case 19: return [3, 29];
                    case 20:
                        result.push(null);
                        return [5, __values(JsonTrieTerm.rowRecArray(curr.null, result))];
                    case 21:
                        _o.sent();
                        result.pop();
                        return [3, 29];
                    case 22:
                        result.push(void (0));
                        return [5, __values(JsonTrieTerm.rowRecArray(curr.undefined, result))];
                    case 23:
                        _o.sent();
                        result.pop();
                        return [3, 29];
                    case 24:
                        valNode = curr[type];
                        _h = [];
                        for (_j in valNode)
                            _h.push(_j);
                        _k = 0;
                        _o.label = 25;
                    case 25:
                        if (!(_k < _h.length)) return [3, 28];
                        k = _h[_k];
                        result.push(JsonTrieTerm.convert(type, k));
                        return [5, __values(JsonTrieTerm.rowRecArray(valNode[k], result))];
                    case 26:
                        _o.sent();
                        result.pop();
                        _o.label = 27;
                    case 27:
                        _k++;
                        return [3, 25];
                    case 28: return [3, 29];
                    case 29:
                        _i++;
                        return [3, 1];
                    case 30: return [2];
                }
            });
        };
        JsonTrieTerm.rowRec = function (curr) {
            var _a, _b, _i, type, _c, valNode, _d, _e, _f, k;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _g.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 16];
                        type = _a[_i];
                        _c = type;
                        switch (_c) {
                            case 'array': return [3, 2];
                            case 'object': return [3, 4];
                            case 'null': return [3, 6];
                            case 'undefined': return [3, 8];
                            case 'number': return [3, 10];
                            case 'string': return [3, 10];
                            case 'boolean': return [3, 10];
                            case 'variable': return [3, 10];
                        }
                        return [3, 15];
                    case 2: return [5, __values(JsonTrieTerm.rowRecArray(curr.array, []))];
                    case 3:
                        _g.sent();
                        return [3, 15];
                    case 4: return [5, __values(JsonTrieTerm.rowRecObject(curr.object, []))];
                    case 5:
                        _g.sent();
                        return [3, 15];
                    case 6: return [4, [null, curr.null]];
                    case 7:
                        _g.sent();
                        return [3, 15];
                    case 8: return [4, [void (0), curr.undefined]];
                    case 9:
                        _g.sent();
                        return [3, 15];
                    case 10:
                        valNode = curr[type];
                        _d = [];
                        for (_e in valNode)
                            _d.push(_e);
                        _f = 0;
                        _g.label = 11;
                    case 11:
                        if (!(_f < _d.length)) return [3, 14];
                        k = _d[_f];
                        return [4, [JsonTrieTerm.convert(type, k), valNode[k]]];
                    case 12:
                        _g.sent();
                        _g.label = 13;
                    case 13:
                        _f++;
                        return [3, 11];
                    case 14: return [3, 15];
                    case 15:
                        _i++;
                        return [3, 1];
                    case 16: return [2];
                }
            });
        };
        JsonTrieTerm.rowContRecObject = function (curr, result, cont) {
            if ('empty' in curr) {
                var obj = {};
                try {
                    for (var result_4 = __values(result), result_4_1 = result_4.next(); !result_4_1.done; result_4_1 = result_4.next()) {
                        var t = result_4_1.value;
                        obj[t[0]] = t[1];
                    }
                }
                catch (e_20_1) { e_20 = { error: e_20_1 }; }
                finally {
                    try {
                        if (result_4_1 && !result_4_1.done && (_a = result_4.return)) _a.call(result_4);
                    }
                    finally { if (e_20) throw e_20.error; }
                }
                cont(obj, curr.empty);
            }
            var moreNode = curr.more;
            if (moreNode === void (0))
                return;
            var _loop_2 = function (k) {
                var node = moreNode[k];
                for (var type in node) {
                    switch (type) {
                        case 'array':
                            JsonTrieTerm.rowContRecArray(node.array, [], function (key, val) {
                                result.push([k, key]);
                                JsonTrieTerm.rowContRecObject(val, result, cont);
                                result.pop();
                            });
                            break;
                        case 'object':
                            JsonTrieTerm.rowContRecObject(node.object, [], function (key, val) {
                                result.push([k, key]);
                                JsonTrieTerm.rowContRecObject(val, result, cont);
                                result.pop();
                            });
                            break;
                        case 'null':
                            result.push([k, null]);
                            JsonTrieTerm.rowContRecObject(node.null, result, cont);
                            result.pop();
                            break;
                        case 'undefined':
                            result.push([k, void (0)]);
                            JsonTrieTerm.rowContRecObject(node.undefined, result, cont);
                            result.pop();
                            break;
                        case 'number':
                        case 'string':
                        case 'boolean':
                        case 'variable':
                            var valNode = node[type];
                            for (var k2 in valNode) {
                                result.push([k, JsonTrieTerm.convert(type, k2)]);
                                JsonTrieTerm.rowContRecObject(valNode[k2], result, cont);
                                result.pop();
                            }
                            break;
                    }
                }
            };
            for (var k in moreNode) {
                _loop_2(k);
            }
            var e_20, _a;
        };
        JsonTrieTerm.rowContRecArray = function (curr, result, cont) {
            for (var type in curr) {
                switch (type) {
                    case 'empty':
                        cont(result.slice(), curr.empty);
                        break;
                    case 'array':
                        JsonTrieTerm.rowContRecArray(curr.array, [], function (key, val) {
                            result.push(key);
                            JsonTrieTerm.rowContRecArray(val, result, cont);
                            result.pop();
                        });
                        break;
                    case 'object':
                        JsonTrieTerm.rowContRecObject(curr.object, [], function (key, val) {
                            result.push(key);
                            JsonTrieTerm.rowContRecArray(val, result, cont);
                            result.pop();
                        });
                        break;
                    case 'null':
                        result.push(null);
                        JsonTrieTerm.rowContRecArray(curr.null, result, cont);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push(void (0));
                        JsonTrieTerm.rowContRecArray(curr.undefined, result, cont);
                        result.pop();
                        break;
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'variable':
                        var valNode = curr[type];
                        for (var k in valNode) {
                            result.push(JsonTrieTerm.convert(type, k));
                            JsonTrieTerm.rowContRecArray(valNode[k], result, cont);
                            result.pop();
                        }
                        break;
                }
            }
        };
        JsonTrieTerm.rowContRec = function (curr, cont) {
            for (var type in curr) {
                switch (type) {
                    case 'array':
                        JsonTrieTerm.rowContRecArray(curr.array, [], cont);
                        break;
                    case 'object':
                        JsonTrieTerm.rowContRecObject(curr.object, [], cont);
                        break;
                    case 'null':
                        cont(null, curr.null);
                        break;
                    case 'undefined':
                        cont(void (0), curr.undefined);
                        break;
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'variable':
                        var valNode = curr[type];
                        for (var k in valNode) {
                            cont(JsonTrieTerm.convert(type, k), valNode[k]);
                        }
                        break;
                }
            }
        };
        JsonTrieTerm.lookupRec = function (key, curr, varMap) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return curr.null;
                }
                else if (key instanceof unify_1.Variable) {
                    var node = curr.variable;
                    if (node === void (0))
                        return void (0);
                    var vId = varMap[key.id];
                    if (vId === void (0)) {
                        varMap[key.id] = vId = varMap.count++;
                    }
                    return node[vId];
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        return void (0);
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.lookupRec(key[i], node, varMap);
                        if (node === void (0))
                            return void (0);
                    }
                    node = node.empty;
                    return node;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        return void (0);
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        node = node.more;
                        if (node === void (0))
                            return void (0);
                        node = node[k];
                        if (node === void (0))
                            return void (0);
                        node = JsonTrieTerm.lookupRec(key[k], node, varMap);
                        if (node === void (0))
                            return void (0);
                    }
                    node = node.empty;
                    return node;
                }
            }
            else if (type === 'undefined') {
                return curr.undefined;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    return void (0);
                return node[key];
            }
        };
        JsonTrieTerm.containsRec = function (key, curr, varMap) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return 'null' in curr;
                }
                else if (key instanceof unify_1.Variable) {
                    var node = curr.variable;
                    if (node === void (0))
                        return false;
                    var vId = varMap[key.id];
                    if (vId === void (0)) {
                        varMap[key.id] = vId = varMap.count++;
                        return true;
                    }
                    return vId in node;
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        return false;
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.lookupRec(key[i], node, varMap);
                        if (node === void (0))
                            return false;
                    }
                    return 'empty' in node;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        return false;
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        node = node.more;
                        if (node === void (0))
                            return false;
                        node = node[k];
                        if (node === void (0))
                            return false;
                        node = JsonTrieTerm.lookupRec(key[k], node, varMap);
                        if (node === void (0))
                            return false;
                    }
                    return 'empty' in node;
                }
            }
            else if (type === 'undefined') {
                return 'undefined' in curr;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    return false;
                return key in node;
            }
        };
        JsonTrieTerm.insertRec = function (key, val, curr, varMap, root) {
            if (root === void 0) { root = true; }
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    if (root)
                        return curr.null = val;
                    var node = curr.null;
                    if (node === void (0))
                        curr.null = node = val;
                    return node;
                }
                else if (key instanceof unify_1.Variable) {
                    var vId = varMap[key.id];
                    if (vId === void (0))
                        varMap[key.id] = vId = varMap.count++;
                    var node = curr.variable;
                    if (node === void (0))
                        curr.variable = node = {};
                    if (root)
                        return node[vId] = val;
                    var node2 = node[vId];
                    if (node2 === void (0))
                        node[vId] = node2 = val;
                    return node2;
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.insertRec(key[i], {}, node, varMap, false);
                    }
                    if (root)
                        return node.empty = val;
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        curr.object = node = {};
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        var node2_2 = node.more;
                        if (node2_2 === void (0))
                            node.more = node2_2 = {};
                        var node3 = node2_2[k];
                        if (node3 === void (0))
                            node2_2[k] = node3 = {};
                        node = JsonTrieTerm.insertRec(key[k], {}, node3, varMap, false);
                    }
                    if (root)
                        return node.empty = val;
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
            }
            else if (type === 'undefined') {
                if (root)
                    return curr.undefined = val;
                var node = curr.undefined;
                if (node === void (0))
                    curr.undefined = node = val;
                return node;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
                if (root)
                    return node[key] = val;
                var node2 = node[key];
                if (node2 === void (0))
                    node[key] = node2 = val;
                return node2;
            }
        };
        JsonTrieTerm.modifyRec = function (key, f, curr, varMap) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return curr.null = f(curr.null, 'null' in curr);
                }
                else if (key instanceof unify_1.Variable) {
                    var vId = varMap[key.id];
                    if (vId === void (0))
                        varMap[key.id] = vId = varMap.count++;
                    var node = curr.variable;
                    if (node === void (0))
                        curr.variable = node = {};
                    return node[vId] = f(node[vId], vId in node);
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.modifyRec(key[i], emptyObjectUnless, node, varMap);
                    }
                    return node.empty = f(node.empty, 'empty' in node);
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        curr.object = node = {};
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        var node2 = node.more;
                        if (node2 === void (0))
                            node.more = node2 = {};
                        var node3 = node2[k];
                        if (node3 === void (0))
                            node2[k] = node3 = {};
                        node = JsonTrieTerm.modifyRec(key[k], emptyObjectUnless, node3, varMap);
                    }
                    return node.empty = f(node.empty, 'empty' in node);
                }
            }
            else if (type === 'undefined') {
                return curr.undefined = f(curr.undefined, 'undefined' in curr);
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
                return node[key] = f(node[key], key in node);
            }
        };
        JsonTrieTerm.modifyWithVarsRec = function (key, f, curr, varMap) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
                    return curr.null = f(curr.null, varMap);
                }
                else if (key instanceof unify_1.Variable) {
                    var vId = varMap[key.id];
                    if (vId === void (0)) {
                        varMap[key.id] = vId = varMap.vars.length;
                        varMap.vars.push(key);
                    }
                    var node = curr.variable;
                    if (node === void (0))
                        curr.variable = node = {};
                    return node[vId] = f(node[vId], varMap);
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.modifyWithVarsRec(key[i], emptyObjectUnless, node, varMap);
                    }
                    return node.empty = f(node.empty, varMap);
                }
                else {
                    var node = curr.object;
                    if (node === void (0))
                        curr.object = node = {};
                    var keys = Object.keys(key).sort();
                    var len = keys.length;
                    for (var i = 0; i < len; ++i) {
                        var k = keys[i];
                        var node2 = node.more;
                        if (node2 === void (0))
                            node.more = node2 = {};
                        var node3 = node2[k];
                        if (node3 === void (0))
                            node2[k] = node3 = {};
                        node = JsonTrieTerm.modifyWithVarsRec(key[k], emptyObjectUnless, node3, varMap);
                    }
                    return node.empty = f(node.empty, varMap);
                }
            }
            else if (type === 'undefined') {
                return curr.undefined = f(curr.undefined, varMap);
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
                return node[key] = f(node[key], varMap);
            }
        };
        JsonTrieTerm.minusRecObject = function (curr, other, cont) {
            if ('empty' in other && 'empty' in curr) {
                if (cont(curr.empty, other.empty)) {
                    delete curr.empty;
                }
            }
            if (!('more' in other))
                return;
            var otherMore = other.more;
            if (!('more' in curr))
                return;
            var currMore = curr.more;
            for (var k in otherMore) {
                if (!(k in currMore))
                    continue;
                var otherNode = otherMore[k];
                var node = currMore[k];
                for (var type in otherNode) {
                    switch (type) {
                        case 'array':
                            JsonTrieTerm.minusRecArray(node.array, otherNode.array, function (c, o) { return (JsonTrieTerm.minusRecObject(c, o, cont), isEmptyObject(c)); });
                            if (isEmptyObject(node.array))
                                delete node.array;
                            break;
                        case 'object':
                            JsonTrieTerm.minusRecObject(node.object, otherNode.object, function (c, o) { return (JsonTrieTerm.minusRecObject(c, o, cont), isEmptyObject(c)); });
                            if (isEmptyObject(node.object))
                                delete node.object;
                            break;
                        case 'null':
                        case 'undefined':
                            var currt = node[type];
                            var othert = otherNode[type];
                            JsonTrieTerm.minusRecObject(currt, othert, cont);
                            if (isEmptyObject(currt))
                                delete node[type];
                            break;
                        case 'number':
                        case 'boolean':
                        case 'string':
                        case 'variable':
                            var nodet = node[type];
                            var otherNodet = otherNode[type];
                            for (var k_2 in otherNodet) {
                                if (k_2 in nodet) {
                                    var currk = nodet[k_2];
                                    var otherk = otherNodet[k_2];
                                    JsonTrieTerm.minusRecObject(currk, otherk, cont);
                                    if (isEmptyObject(currk))
                                        delete nodet[k_2];
                                }
                            }
                            if (isEmptyObject(nodet))
                                delete node[type];
                            break;
                    }
                }
                if (isEmptyObject(node))
                    delete currMore[k];
            }
            if (isEmptyObject(currMore))
                delete curr.more;
        };
        JsonTrieTerm.minusRecArray = function (curr, other, cont) {
            for (var type in other) {
                if (!(type in curr))
                    continue;
                switch (type) {
                    case 'empty':
                        if (cont(curr.empty, other.empty)) {
                            delete curr.empty;
                        }
                        break;
                    case 'array':
                        JsonTrieTerm.minusRecArray(curr.array, other.array, function (c, o) { return (JsonTrieTerm.minusRecArray(c, o, cont), isEmptyObject(c)); });
                        if (isEmptyObject(curr.array))
                            delete curr.array;
                        break;
                    case 'object':
                        JsonTrieTerm.minusRecObject(curr.object, other.object, function (c, o) { return (JsonTrieTerm.minusRecArray(c, o, cont), isEmptyObject(c)); });
                        if (isEmptyObject(curr.object))
                            delete curr.object;
                        break;
                    case 'null':
                    case 'undefined':
                        var currt = curr[type];
                        var othert = other[type];
                        JsonTrieTerm.minusRecArray(currt, othert, cont);
                        if (isEmptyObject(currt))
                            delete curr[type];
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                    case 'variable':
                        var node = curr[type];
                        var otherNode = other[type];
                        for (var k in otherNode) {
                            if (k in node) {
                                var currk = node[k];
                                var otherk = otherNode[k];
                                JsonTrieTerm.minusRecArray(currk, otherk, cont);
                                if (isEmptyObject(currk))
                                    delete node[k];
                            }
                        }
                        if (isEmptyObject(node))
                            delete curr[type];
                        break;
                }
            }
        };
        JsonTrieTerm.minusRec = function (curr, other) {
            for (var type in other) {
                if (!(type in curr))
                    continue;
                switch (type) {
                    case 'array':
                        JsonTrieTerm.minusRecArray(curr.array, other.array, function () { return true; });
                        if (isEmptyObject(curr.array))
                            delete curr.array;
                        break;
                    case 'object':
                        JsonTrieTerm.minusRecObject(curr.object, other.object, function () { return true; });
                        if (isEmptyObject(curr.object))
                            delete curr.object;
                        break;
                    case 'null':
                    case 'undefined':
                        delete curr[type];
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                    case 'variable':
                        var node = curr[type];
                        var otherNode = other[type];
                        for (var k in otherNode) {
                            delete node[k];
                        }
                        if (isEmptyObject(node))
                            delete curr[type];
                        break;
                }
            }
        };
        return JsonTrieTerm;
    }());
    exports.JsonTrieTerm = JsonTrieTerm;
});
//# sourceMappingURL=json-trie.js.map
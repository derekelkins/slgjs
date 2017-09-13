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
        define(["require", "exports", "./unify"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unify_1 = require("./unify");
    function emptyObjectUnless(x) { return x === void (0) ? {} : x; }
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
        JsonTrie.prototype.contains = function (key) {
            return JsonTrie.containsRec(key, this.trie);
        };
        JsonTrie.prototype.lookup = function (key) {
            return JsonTrie.lookupRec(key, this.trie);
        };
        JsonTrie.prototype.keys = function () {
            var _a, _b, _c, k, _1, e_1_1, e_1, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.rowRec(this.trie)), _b = _a.next();
                        _e.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        _c = __read(_b.value, 2), k = _c[0], _1 = _c[1];
                        return [4, k];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrie.prototype.values = function () {
            var _a, _b, _c, _2, v, e_2_1, e_2, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.rowRec(this.trie)), _b = _a.next();
                        _e.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        _c = __read(_b.value, 2), _2 = _c[0], v = _c[1];
                        return [4, v];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_2_1 = _e.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
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
        JsonTrie.prototype.match = function (key, sub) {
            var _a, _b, _c, _3, s, e_3_1, e_3, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrie.matchRec(key, sub, this.trie)), _b = _a.next();
                        _e.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        _c = __read(_b.value, 2), _3 = _c[0], s = _c[1];
                        return [4, s];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_3_1 = _e.sent();
                        e_3 = { error: e_3_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
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
        JsonTrie.matchRecArray = function (key, i, sub, curr) {
            var _a, _b, _c, node, s, e_4_1, e_4, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!(i < key.length)) return [3, 9];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, 7, 8]);
                        _a = __values(JsonTrie.matchRec(key[i], sub, curr)), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3, 5];
                        _c = __read(_b.value, 2), node = _c[0], s = _c[1];
                        return [5, __values(JsonTrie.matchRecArray(key, i + 1, s, node))];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_4_1 = _e.sent();
                        e_4 = { error: e_4_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7];
                    case 8: return [3, 11];
                    case 9:
                        if (!('empty' in curr)) return [3, 11];
                        return [4, [curr.empty, sub]];
                    case 10:
                        _e.sent();
                        _e.label = 11;
                    case 11: return [2];
                }
            });
        };
        JsonTrie.matchRecObject = function (key, keys, i, sub, curr) {
            var node, k, _a, _b, _c, node2, s, e_5_1, e_5, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!(i < keys.length)) return [3, 9];
                        node = curr.more;
                        if (node === void (0))
                            return [2];
                        k = keys[i];
                        node = node[k];
                        if (node === void (0))
                            return [2];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, 7, 8]);
                        _a = __values(JsonTrie.matchRec(key[k], sub, node)), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3, 5];
                        _c = __read(_b.value, 2), node2 = _c[0], s = _c[1];
                        return [5, __values(JsonTrie.matchRecObject(key, keys, i + 1, s, node2))];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        e_5_1 = _e.sent();
                        e_5 = { error: e_5_1 };
                        return [3, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_5) throw e_5.error; }
                        return [7];
                    case 8: return [3, 11];
                    case 9:
                        if (!('empty' in curr)) return [3, 11];
                        return [4, [curr.empty, sub]];
                    case 10:
                        _e.sent();
                        _e.label = 11;
                    case 11: return [2];
                }
            });
        };
        JsonTrie.matchRec = function (key, sub, curr) {
            var type, v, _a, _b, _c, val, node, e_6_1, node, node, keys, node, e_6, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        type = typeof key;
                        if (!(type === 'object')) return [3, 21];
                        if (!(key === null)) return [3, 3];
                        if (!('null' in curr)) return [3, 2];
                        return [4, [curr.null, sub]];
                    case 1:
                        _e.sent();
                        _e.label = 2;
                    case 2: return [3, 20];
                    case 3:
                        if (!(key instanceof unify_1.Variable)) return [3, 15];
                        v = sub.lookupAsVar(key);
                        if (!(v instanceof unify_1.Variable)) return [3, 12];
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 9, 10, 11]);
                        _a = __values(JsonTrie.rowRec(curr)), _b = _a.next();
                        _e.label = 5;
                    case 5:
                        if (!!_b.done) return [3, 8];
                        _c = __read(_b.value, 2), val = _c[0], node = _c[1];
                        return [4, [node, sub.bind(v, val)]];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7:
                        _b = _a.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_6_1 = _e.sent();
                        e_6 = { error: e_6_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_6) throw e_6.error; }
                        return [7];
                    case 11: return [3, 14];
                    case 12: return [5, __values(JsonTrie.matchRec(v, sub, curr))];
                    case 13:
                        _e.sent();
                        _e.label = 14;
                    case 14: return [3, 20];
                    case 15:
                        if (!(key instanceof Array)) return [3, 18];
                        node = curr.array;
                        if (!(node !== void (0))) return [3, 17];
                        return [5, __values(JsonTrie.matchRecArray(key, 0, sub, node))];
                    case 16:
                        _e.sent();
                        _e.label = 17;
                    case 17: return [3, 20];
                    case 18:
                        node = curr.object;
                        if (!(node !== void (0))) return [3, 20];
                        keys = Object.keys(key).sort();
                        return [5, __values(JsonTrie.matchRecObject(key, keys, 0, sub, node))];
                    case 19:
                        _e.sent();
                        _e.label = 20;
                    case 20: return [3, 26];
                    case 21:
                        if (!(type === 'undefined')) return [3, 24];
                        if (!('undefined' in curr)) return [3, 23];
                        return [4, [curr.undefined, sub]];
                    case 22:
                        _e.sent();
                        _e.label = 23;
                    case 23: return [3, 26];
                    case 24:
                        node = curr[type];
                        if (!(node !== void (0))) return [3, 26];
                        if (!(key in node)) return [3, 26];
                        return [4, [node[key], sub]];
                    case 25:
                        _e.sent();
                        _e.label = 26;
                    case 26: return [2];
                }
            });
        };
        JsonTrie.rowRecObject = function (curr, result) {
            var obj, result_1, result_1_1, _a, k, v, moreNode, _b, _c, _i, k, node, _d, _e, _f, type, _g, _h, _j, _k, key, rest, e_7_1, _l, _m, _o, key, rest, e_8_1, valNode, _p, _q, _r, k2, e_9, _s, e_7, _t, e_8, _u;
            return __generator(this, function (_v) {
                switch (_v.label) {
                    case 0:
                        if (!('empty' in curr)) return [3, 2];
                        obj = {};
                        try {
                            for (result_1 = __values(result), result_1_1 = result_1.next(); !result_1_1.done; result_1_1 = result_1.next()) {
                                _a = __read(result_1_1.value, 2), k = _a[0], v = _a[1];
                                obj[k] = v;
                            }
                        }
                        catch (e_9_1) { e_9 = { error: e_9_1 }; }
                        finally {
                            try {
                                if (result_1_1 && !result_1_1.done && (_s = result_1.return)) _s.call(result_1);
                            }
                            finally { if (e_9) throw e_9.error; }
                        }
                        return [4, [obj, curr.empty]];
                    case 1:
                        _v.sent();
                        _v.label = 2;
                    case 2:
                        moreNode = curr.more;
                        if (moreNode === void (0))
                            return [2];
                        _b = [];
                        for (_c in moreNode)
                            _b.push(_c);
                        _i = 0;
                        _v.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3, 31];
                        k = _b[_i];
                        node = moreNode[k];
                        _d = [];
                        for (_e in node)
                            _d.push(_e);
                        _f = 0;
                        _v.label = 4;
                    case 4:
                        if (!(_f < _d.length)) return [3, 30];
                        type = _d[_f];
                        _g = type;
                        switch (_g) {
                            case 'array': return [3, 5];
                            case 'object': return [3, 13];
                            case 'null': return [3, 21];
                            case 'undefined': return [3, 23];
                            case 'number': return [3, 25];
                            case 'boolean': return [3, 25];
                            case 'string': return [3, 25];
                        }
                        return [3, 29];
                    case 5:
                        _v.trys.push([5, 10, 11, 12]);
                        _h = __values(JsonTrie.rowRecArray(node.array, [])), _j = _h.next();
                        _v.label = 6;
                    case 6:
                        if (!!_j.done) return [3, 9];
                        _k = __read(_j.value, 2), key = _k[0], rest = _k[1];
                        result.push([k, key]);
                        return [5, __values(JsonTrie.rowRecObject(rest, result))];
                    case 7:
                        _v.sent();
                        result.pop();
                        _v.label = 8;
                    case 8:
                        _j = _h.next();
                        return [3, 6];
                    case 9: return [3, 12];
                    case 10:
                        e_7_1 = _v.sent();
                        e_7 = { error: e_7_1 };
                        return [3, 12];
                    case 11:
                        try {
                            if (_j && !_j.done && (_t = _h.return)) _t.call(_h);
                        }
                        finally { if (e_7) throw e_7.error; }
                        return [7];
                    case 12: return [3, 29];
                    case 13:
                        _v.trys.push([13, 18, 19, 20]);
                        _l = __values(JsonTrie.rowRecObject(node.object, [])), _m = _l.next();
                        _v.label = 14;
                    case 14:
                        if (!!_m.done) return [3, 17];
                        _o = __read(_m.value, 2), key = _o[0], rest = _o[1];
                        result.push([k, key]);
                        return [5, __values(JsonTrie.rowRecObject(rest, result))];
                    case 15:
                        _v.sent();
                        result.pop();
                        _v.label = 16;
                    case 16:
                        _m = _l.next();
                        return [3, 14];
                    case 17: return [3, 20];
                    case 18:
                        e_8_1 = _v.sent();
                        e_8 = { error: e_8_1 };
                        return [3, 20];
                    case 19:
                        try {
                            if (_m && !_m.done && (_u = _l.return)) _u.call(_l);
                        }
                        finally { if (e_8) throw e_8.error; }
                        return [7];
                    case 20: return [3, 29];
                    case 21:
                        result.push([k, null]);
                        return [5, __values(JsonTrie.rowRecObject(node.null, result))];
                    case 22:
                        _v.sent();
                        result.pop();
                        return [3, 29];
                    case 23:
                        result.push([k, void (0)]);
                        return [5, __values(JsonTrie.rowRecObject(node.undefined, result))];
                    case 24:
                        _v.sent();
                        result.pop();
                        return [3, 29];
                    case 25:
                        valNode = node[type];
                        _p = [];
                        for (_q in valNode)
                            _p.push(_q);
                        _r = 0;
                        _v.label = 26;
                    case 26:
                        if (!(_r < _p.length)) return [3, 29];
                        k2 = _p[_r];
                        result.push([k, convert(type, k2)]);
                        return [5, __values(JsonTrie.rowRecObject(valNode[k2], result))];
                    case 27:
                        _v.sent();
                        result.pop();
                        _v.label = 28;
                    case 28:
                        _r++;
                        return [3, 26];
                    case 29:
                        _f++;
                        return [3, 4];
                    case 30:
                        _i++;
                        return [3, 3];
                    case 31: return [2];
                }
            });
        };
        JsonTrie.rowRecArray = function (curr, result) {
            var _a, _b, _i, type, _c, _d, _e, _f, key, rest, e_10_1, _g, _h, _j, key, rest, e_11_1, valNode, _k, _l, _m, k, e_10, _o, e_11, _p;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _q.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 29];
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
                        return [3, 28];
                    case 2: return [4, [result.slice(), curr.empty]];
                    case 3:
                        _q.sent();
                        return [3, 28];
                    case 4:
                        _q.trys.push([4, 9, 10, 11]);
                        _d = __values(JsonTrie.rowRecArray(curr.array, [])), _e = _d.next();
                        _q.label = 5;
                    case 5:
                        if (!!_e.done) return [3, 8];
                        _f = __read(_e.value, 2), key = _f[0], rest = _f[1];
                        result.push(key);
                        return [5, __values(JsonTrie.rowRecArray(rest, result))];
                    case 6:
                        _q.sent();
                        result.pop();
                        _q.label = 7;
                    case 7:
                        _e = _d.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_10_1 = _q.sent();
                        e_10 = { error: e_10_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_e && !_e.done && (_o = _d.return)) _o.call(_d);
                        }
                        finally { if (e_10) throw e_10.error; }
                        return [7];
                    case 11: return [3, 28];
                    case 12:
                        _q.trys.push([12, 17, 18, 19]);
                        _g = __values(JsonTrie.rowRecObject(curr.object, [])), _h = _g.next();
                        _q.label = 13;
                    case 13:
                        if (!!_h.done) return [3, 16];
                        _j = __read(_h.value, 2), key = _j[0], rest = _j[1];
                        result.push(key);
                        return [5, __values(JsonTrie.rowRecArray(rest, result))];
                    case 14:
                        _q.sent();
                        result.pop();
                        _q.label = 15;
                    case 15:
                        _h = _g.next();
                        return [3, 13];
                    case 16: return [3, 19];
                    case 17:
                        e_11_1 = _q.sent();
                        e_11 = { error: e_11_1 };
                        return [3, 19];
                    case 18:
                        try {
                            if (_h && !_h.done && (_p = _g.return)) _p.call(_g);
                        }
                        finally { if (e_11) throw e_11.error; }
                        return [7];
                    case 19: return [3, 28];
                    case 20:
                        result.push(null);
                        return [5, __values(JsonTrie.rowRecArray(curr.null, result))];
                    case 21:
                        _q.sent();
                        result.pop();
                        return [3, 28];
                    case 22:
                        result.push(void (0));
                        return [5, __values(JsonTrie.rowRecArray(curr.undefined, result))];
                    case 23:
                        _q.sent();
                        result.pop();
                        return [3, 28];
                    case 24:
                        valNode = curr[type];
                        _k = [];
                        for (_l in valNode)
                            _k.push(_l);
                        _m = 0;
                        _q.label = 25;
                    case 25:
                        if (!(_m < _k.length)) return [3, 28];
                        k = _k[_m];
                        result.push(convert(type, k));
                        return [5, __values(JsonTrie.rowRecArray(valNode[k], result))];
                    case 26:
                        _q.sent();
                        result.pop();
                        _q.label = 27;
                    case 27:
                        _m++;
                        return [3, 25];
                    case 28:
                        _i++;
                        return [3, 1];
                    case 29: return [2];
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
                        if (!(_i < _a.length)) return [3, 15];
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
                        return [3, 14];
                    case 2: return [5, __values(JsonTrie.rowRecArray(curr.array, []))];
                    case 3:
                        _g.sent();
                        return [3, 14];
                    case 4: return [5, __values(JsonTrie.rowRecObject(curr.object, []))];
                    case 5:
                        _g.sent();
                        return [3, 14];
                    case 6: return [4, [null, curr.null]];
                    case 7:
                        _g.sent();
                        return [3, 14];
                    case 8: return [4, [void (0), curr.undefined]];
                    case 9:
                        _g.sent();
                        return [3, 14];
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
                    case 14:
                        _i++;
                        return [3, 1];
                    case 15: return [2];
                }
            });
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
        JsonTrie.insertRec = function (key, val, curr) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
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
                        node = JsonTrie.insertRec(key[i], {}, node);
                    }
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
                        node = JsonTrie.insertRec(key[k], {}, node3);
                    }
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
            }
            else if (type === 'undefined') {
                var node = curr.undefined;
                if (node === void (0))
                    curr.undefined = node = val;
                return node;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
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
        JsonTrieTerm.prototype.contains = function (key) {
            return JsonTrieTerm.containsRec(key, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.lookup = function (key) {
            return JsonTrieTerm.lookupRec(key, this.trie, { count: 0 });
        };
        JsonTrieTerm.prototype.keys = function () {
            var _a, _b, _c, k, _4, e_12_1, e_12, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrieTerm.rowRec(this.trie)), _b = _a.next();
                        _e.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        _c = __read(_b.value, 2), k = _c[0], _4 = _c[1];
                        return [4, k];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_12_1 = _e.sent();
                        e_12 = { error: e_12_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_12) throw e_12.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrieTerm.prototype.values = function () {
            var _a, _b, _c, _5, v, e_13_1, e_13, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, 6, 7]);
                        _a = __values(JsonTrieTerm.rowRec(this.trie)), _b = _a.next();
                        _e.label = 1;
                    case 1:
                        if (!!_b.done) return [3, 4];
                        _c = __read(_b.value, 2), _5 = _c[0], v = _c[1];
                        return [4, v];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3:
                        _b = _a.next();
                        return [3, 1];
                    case 4: return [3, 7];
                    case 5:
                        e_13_1 = _e.sent();
                        e_13 = { error: e_13_1 };
                        return [3, 7];
                    case 6:
                        try {
                            if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                        }
                        finally { if (e_13) throw e_13.error; }
                        return [7];
                    case 7: return [2];
                }
            });
        };
        JsonTrieTerm.prototype.entries = function () {
            return JsonTrieTerm.rowRec(this.trie);
        };
        JsonTrieTerm.rowRecObject = function (curr, result) {
            var obj, result_2, result_2_1, _a, k, v, moreNode, _b, _c, _i, k, node, _d, _e, _f, type, _g, _h, _j, _k, key, rest, e_14_1, _l, _m, _o, key, rest, e_15_1, valNode, _p, _q, _r, k2, e_16, _s, e_14, _t, e_15, _u;
            return __generator(this, function (_v) {
                switch (_v.label) {
                    case 0:
                        if (!('empty' in curr)) return [3, 2];
                        obj = {};
                        try {
                            for (result_2 = __values(result), result_2_1 = result_2.next(); !result_2_1.done; result_2_1 = result_2.next()) {
                                _a = __read(result_2_1.value, 2), k = _a[0], v = _a[1];
                                obj[k] = v;
                            }
                        }
                        catch (e_16_1) { e_16 = { error: e_16_1 }; }
                        finally {
                            try {
                                if (result_2_1 && !result_2_1.done && (_s = result_2.return)) _s.call(result_2);
                            }
                            finally { if (e_16) throw e_16.error; }
                        }
                        return [4, [obj, curr.empty]];
                    case 1:
                        _v.sent();
                        _v.label = 2;
                    case 2:
                        moreNode = curr.more;
                        if (moreNode === void (0))
                            return [2];
                        _b = [];
                        for (_c in moreNode)
                            _b.push(_c);
                        _i = 0;
                        _v.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3, 32];
                        k = _b[_i];
                        node = moreNode[k];
                        _d = [];
                        for (_e in node)
                            _d.push(_e);
                        _f = 0;
                        _v.label = 4;
                    case 4:
                        if (!(_f < _d.length)) return [3, 31];
                        type = _d[_f];
                        _g = type;
                        switch (_g) {
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
                        _v.trys.push([5, 10, 11, 12]);
                        _h = __values(JsonTrieTerm.rowRecArray(node.array, [])), _j = _h.next();
                        _v.label = 6;
                    case 6:
                        if (!!_j.done) return [3, 9];
                        _k = __read(_j.value, 2), key = _k[0], rest = _k[1];
                        result.push([k, key]);
                        return [5, __values(JsonTrieTerm.rowRecObject(rest, result))];
                    case 7:
                        _v.sent();
                        result.pop();
                        _v.label = 8;
                    case 8:
                        _j = _h.next();
                        return [3, 6];
                    case 9: return [3, 12];
                    case 10:
                        e_14_1 = _v.sent();
                        e_14 = { error: e_14_1 };
                        return [3, 12];
                    case 11:
                        try {
                            if (_j && !_j.done && (_t = _h.return)) _t.call(_h);
                        }
                        finally { if (e_14) throw e_14.error; }
                        return [7];
                    case 12: return [3, 30];
                    case 13:
                        _v.trys.push([13, 18, 19, 20]);
                        _l = __values(JsonTrieTerm.rowRecObject(node.object, [])), _m = _l.next();
                        _v.label = 14;
                    case 14:
                        if (!!_m.done) return [3, 17];
                        _o = __read(_m.value, 2), key = _o[0], rest = _o[1];
                        result.push([k, key]);
                        return [5, __values(JsonTrieTerm.rowRecObject(rest, result))];
                    case 15:
                        _v.sent();
                        result.pop();
                        _v.label = 16;
                    case 16:
                        _m = _l.next();
                        return [3, 14];
                    case 17: return [3, 20];
                    case 18:
                        e_15_1 = _v.sent();
                        e_15 = { error: e_15_1 };
                        return [3, 20];
                    case 19:
                        try {
                            if (_m && !_m.done && (_u = _l.return)) _u.call(_l);
                        }
                        finally { if (e_15) throw e_15.error; }
                        return [7];
                    case 20: return [3, 30];
                    case 21:
                        result.push([k, null]);
                        return [5, __values(JsonTrieTerm.rowRecObject(node.null, result))];
                    case 22:
                        _v.sent();
                        result.pop();
                        return [3, 30];
                    case 23:
                        result.push([k, void (0)]);
                        return [5, __values(JsonTrieTerm.rowRecObject(node.undefined, result))];
                    case 24:
                        _v.sent();
                        result.pop();
                        return [3, 30];
                    case 25:
                        valNode = node[type];
                        _p = [];
                        for (_q in valNode)
                            _p.push(_q);
                        _r = 0;
                        _v.label = 26;
                    case 26:
                        if (!(_r < _p.length)) return [3, 29];
                        k2 = _p[_r];
                        result.push([k, JsonTrieTerm.convert(type, k2)]);
                        return [5, __values(JsonTrieTerm.rowRecObject(valNode[k2], result))];
                    case 27:
                        _v.sent();
                        result.pop();
                        _v.label = 28;
                    case 28:
                        _r++;
                        return [3, 26];
                    case 29: return [3, 30];
                    case 30:
                        _f++;
                        return [3, 4];
                    case 31:
                        _i++;
                        return [3, 3];
                    case 32: return [2];
                }
            });
        };
        JsonTrieTerm.rowRecArray = function (curr, result) {
            var _a, _b, _i, type, _c, _d, _e, _f, key, rest, e_17_1, _g, _h, _j, key, rest, e_18_1, valNode, _k, _l, _m, k, e_17, _o, e_18, _p;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0:
                        _a = [];
                        for (_b in curr)
                            _a.push(_b);
                        _i = 0;
                        _q.label = 1;
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
                        _q.sent();
                        return [3, 29];
                    case 4:
                        _q.trys.push([4, 9, 10, 11]);
                        _d = __values(JsonTrieTerm.rowRecArray(curr.array, [])), _e = _d.next();
                        _q.label = 5;
                    case 5:
                        if (!!_e.done) return [3, 8];
                        _f = __read(_e.value, 2), key = _f[0], rest = _f[1];
                        result.push(key);
                        return [5, __values(JsonTrieTerm.rowRecArray(rest, result))];
                    case 6:
                        _q.sent();
                        result.pop();
                        _q.label = 7;
                    case 7:
                        _e = _d.next();
                        return [3, 5];
                    case 8: return [3, 11];
                    case 9:
                        e_17_1 = _q.sent();
                        e_17 = { error: e_17_1 };
                        return [3, 11];
                    case 10:
                        try {
                            if (_e && !_e.done && (_o = _d.return)) _o.call(_d);
                        }
                        finally { if (e_17) throw e_17.error; }
                        return [7];
                    case 11: return [3, 29];
                    case 12:
                        _q.trys.push([12, 17, 18, 19]);
                        _g = __values(JsonTrieTerm.rowRecObject(curr.object, [])), _h = _g.next();
                        _q.label = 13;
                    case 13:
                        if (!!_h.done) return [3, 16];
                        _j = __read(_h.value, 2), key = _j[0], rest = _j[1];
                        result.push(key);
                        return [5, __values(JsonTrieTerm.rowRecArray(rest, result))];
                    case 14:
                        _q.sent();
                        result.pop();
                        _q.label = 15;
                    case 15:
                        _h = _g.next();
                        return [3, 13];
                    case 16: return [3, 19];
                    case 17:
                        e_18_1 = _q.sent();
                        e_18 = { error: e_18_1 };
                        return [3, 19];
                    case 18:
                        try {
                            if (_h && !_h.done && (_p = _g.return)) _p.call(_g);
                        }
                        finally { if (e_18) throw e_18.error; }
                        return [7];
                    case 19: return [3, 29];
                    case 20:
                        result.push(null);
                        return [5, __values(JsonTrieTerm.rowRecArray(curr.null, result))];
                    case 21:
                        _q.sent();
                        result.pop();
                        return [3, 29];
                    case 22:
                        result.push(void (0));
                        return [5, __values(JsonTrieTerm.rowRecArray(curr.undefined, result))];
                    case 23:
                        _q.sent();
                        result.pop();
                        return [3, 29];
                    case 24:
                        valNode = curr[type];
                        _k = [];
                        for (_l in valNode)
                            _k.push(_l);
                        _m = 0;
                        _q.label = 25;
                    case 25:
                        if (!(_m < _k.length)) return [3, 28];
                        k = _k[_m];
                        result.push(JsonTrieTerm.convert(type, k));
                        return [5, __values(JsonTrieTerm.rowRecArray(valNode[k], result))];
                    case 26:
                        _q.sent();
                        result.pop();
                        _q.label = 27;
                    case 27:
                        _m++;
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
        JsonTrieTerm.insertRec = function (key, val, curr, varMap) {
            var type = typeof key;
            if (type === 'object') {
                if (key === null) {
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
                        node = JsonTrieTerm.insertRec(key[i], {}, node, varMap);
                    }
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
                        node = JsonTrieTerm.insertRec(key[k], {}, node3, varMap);
                    }
                    var node2 = node.empty;
                    if (node2 === void (0))
                        node.empty = node2 = val;
                    return node2;
                }
            }
            else if (type === 'undefined') {
                var node = curr.undefined;
                if (node === void (0))
                    curr.undefined = node = val;
                return node;
            }
            else {
                var node = curr[type];
                if (node === void (0))
                    curr[type] = node = {};
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
                    return curr.null = f(curr.null);
                }
                else if (key instanceof unify_1.Variable) {
                    var vId = varMap[key.id];
                    if (vId === void (0))
                        varMap[key.id] = vId = varMap.count++;
                    var node = curr.variable;
                    if (node === void (0))
                        curr.variable = node = {};
                    return node[vId] = f(node[vId]);
                }
                else if (key instanceof Array) {
                    var node = curr.array;
                    if (node === void (0))
                        curr.array = node = {};
                    var len = key.length;
                    for (var i = 0; i < len; ++i) {
                        node = JsonTrieTerm.modifyRec(key[i], emptyObjectUnless, node, varMap);
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
                        node = JsonTrieTerm.modifyRec(key[k], emptyObjectUnless, node3, varMap);
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
        return JsonTrieTerm;
    }());
    exports.JsonTrieTerm = JsonTrieTerm;
});
//# sourceMappingURL=json-trie.js.map
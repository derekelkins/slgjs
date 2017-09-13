(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./puf"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var puf_1 = require("./puf");
    var Variable = (function () {
        function Variable(id) {
            this.id = id;
        }
        return Variable;
    }());
    exports.Variable = Variable;
    var Substitution = (function () {
        function Substitution(uf, nextVariable) {
            if (nextVariable === void 0) { nextVariable = 0; }
            this.uf = uf;
            this.nextVariable = nextVariable;
        }
        Substitution.emptyPersistent = function (initialCapacity) {
            if (initialCapacity === void 0) { initialCapacity = 10; }
            return new Substitution(puf_1.default.createPersistent(initialCapacity));
        };
        Substitution.emptySemiPersistent = function (initialCapacity) {
            if (initialCapacity === void 0) { initialCapacity = 10; }
            return new Substitution(puf_1.default.createSemiPersistent(initialCapacity));
        };
        Substitution.prototype.freshVar = function () {
            var nv = this.nextVariable;
            return [new Variable(nv), new Substitution(this.uf, nv + 1)];
        };
        Substitution.prototype.fresh = function (count) {
            if (count < 0)
                throw new Error('Substitution.fresh: attempt to create negative number of variables.');
            var nv = this.nextVariable;
            var newSize = nv + count;
            var vs = new Array(count);
            for (var i = 0; i < count; ++i) {
                vs[i] = new Variable(nv + i);
            }
            return [vs, new Substitution(this.uf, newSize)];
        };
        Substitution.prototype.normalizedId = function (v) {
            return this.uf.find(v.id).id;
        };
        Substitution.prototype.lookup = function (v) {
            var x = this.uf.find(v.id);
            return x.isBound ? x.value : x.id;
        };
        Substitution.prototype.lookupVar = function (v) {
            return this.uf.find(v.id);
        };
        Substitution.prototype.lookupAsVar = function (v) {
            var x = this.uf.find(v.id);
            return x.isBound ? x.value : new Variable(x.id);
        };
        Substitution.prototype.lookupById = function (id) {
            var x = this.uf.find(id);
            return x.isBound ? x.value : new Variable(x.id);
        };
        Substitution.prototype.bind = function (v, value) {
            return new Substitution(this.uf.bindValue(v.id, value), this.nextVariable);
        };
        Substitution.prototype.unifyVar = function (x, y) {
            var vx = this.uf.find(x.id);
            var vy = this.uf.find(y.id);
            if (!vx.isBound) {
                return new Substitution(this.uf.bindVariable(vx.id, vy.id), this.nextVariable);
            }
            else {
                if (!vy.isBound) {
                    return new Substitution(this.uf.bindVariable(vy.id, vx.id), this.nextVariable);
                }
                else {
                    return vx.value === vy.value ? this : null;
                }
            }
        };
        return Substitution;
    }());
    exports.Substitution = Substitution;
    function groundJsonNoSharing(x, sub) {
        if (x instanceof Variable)
            x = sub.lookupAsVar(x);
        switch (typeof x) {
            case 'object':
                if (x === null) {
                    return x;
                }
                else if (x instanceof Variable) {
                    return x;
                }
                else if (x instanceof Array) {
                    return x.map(function (y) { return groundJsonNoSharing(y, sub); });
                }
                else {
                    var result = {};
                    for (var key in x) {
                        result[key] = groundJsonNoSharing(x[key], sub);
                    }
                    return result;
                }
            default:
                return x;
        }
    }
    exports.groundJsonNoSharing = groundJsonNoSharing;
    function groundJson(x, sub, mapping) {
        if (mapping === void 0) { mapping = {}; }
        var id = null;
        if (x instanceof Variable) {
            var v = sub.lookupVar(x);
            id = v.id;
            if (id in mapping)
                return mapping[id];
            x = v.isBound ? v.value : new Variable(id);
        }
        switch (typeof x) {
            case 'object':
                if (x === null) {
                    return x;
                }
                else if (x instanceof Variable) {
                    return x;
                }
                else if (x instanceof Array) {
                    var result = x.map(function (y) { return groundJson(y, sub, mapping); });
                    if (id !== null)
                        mapping[id] = result;
                    return result;
                }
                else {
                    var result = {};
                    for (var key in x) {
                        result[key] = groundJson(x[key], sub, mapping);
                    }
                    if (id !== null)
                        mapping[id] = result;
                    return result;
                }
            default:
                return x;
        }
    }
    exports.groundJson = groundJson;
    function refreshJson(x, sub, mapping) {
        if (mapping === void 0) { mapping = {}; }
        switch (typeof x) {
            case 'object':
                if (x === null) {
                    return [x, sub];
                }
                else if (x instanceof Variable) {
                    var xId = x.id;
                    if (xId in mapping) {
                        return [mapping[xId], sub];
                    }
                    else {
                        var t = sub.freshVar();
                        mapping[xId] = t[0];
                        return t;
                    }
                }
                else if (x instanceof Array) {
                    var s = sub;
                    var len = x.length;
                    var newArray = new Array(len);
                    for (var i = 0; i < len; ++i) {
                        var t = refreshJson(x[i], s, mapping);
                        newArray[i] = t[0];
                        s = t[1];
                    }
                    return [newArray, s];
                }
                else {
                    var s = sub;
                    var newObject = {};
                    for (var key in x) {
                        var t = refreshJson(x[key], s, mapping);
                        newObject[key] = t[0];
                        s = t[1];
                    }
                    return [newObject, s];
                }
            default:
                return [x, sub];
        }
    }
    exports.refreshJson = refreshJson;
    function looseMatchJson(x, y, sub) {
        if (x instanceof Variable)
            x = sub.lookupAsVar(x);
        if (x instanceof Variable) {
            return sub.bind(x, y);
        }
        else {
            switch (typeof x) {
                case 'object':
                    if (x === null) {
                        return y === null ? sub : null;
                    }
                    else if (x instanceof Array) {
                        if (y instanceof Array) {
                            var len = x.length;
                            if (len !== y.length)
                                return null;
                            var s = sub;
                            for (var i = 0; i < len; ++i) {
                                s = looseMatchJson(x[i], y[i], s);
                                if (s === null)
                                    return null;
                            }
                            return s;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        if (y === null || typeof y !== 'object' || y instanceof Array)
                            return null;
                        var s = sub;
                        for (var key in x) {
                            if (!(key in y))
                                return null;
                            s = looseMatchJson(x[key], y[key], s);
                            if (s === null)
                                return null;
                        }
                        return s;
                    }
                case 'undefined':
                case 'number':
                case 'string':
                case 'boolean':
                    return x === y ? sub : null;
                default:
                    return null;
            }
        }
    }
    exports.looseMatchJson = looseMatchJson;
    function looseUnifyJson(x, y, sub) {
        if (x instanceof Variable)
            x = sub.lookupAsVar(x);
        if (y instanceof Variable)
            y = sub.lookupAsVar(y);
        if (x instanceof Variable) {
            if (y instanceof Variable) {
                return sub.unifyVar(x, y);
            }
            else {
                return sub.bind(x, y);
            }
        }
        else if (y instanceof Variable) {
            return sub.bind(y, x);
        }
        else {
            switch (typeof x) {
                case 'object':
                    if (x === null) {
                        return y === null ? sub : null;
                    }
                    else if (x instanceof Array) {
                        if (y instanceof Array) {
                            var len = x.length;
                            if (len !== y.length)
                                return null;
                            var s = sub;
                            for (var i = 0; i < len; ++i) {
                                s = looseUnifyJson(x[i], y[i], s);
                                if (s === null)
                                    return null;
                            }
                            return s;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        if (y === null || typeof y !== 'object' || y instanceof Array)
                            return null;
                        var s = sub;
                        for (var key in x) {
                            if (!(key in y))
                                return null;
                            s = looseUnifyJson(x[key], y[key], s);
                            if (s === null)
                                return null;
                        }
                        return s;
                    }
                case 'undefined':
                case 'number':
                case 'string':
                case 'boolean':
                    return x === y ? sub : null;
                default:
                    return null;
            }
        }
    }
    exports.looseUnifyJson = looseUnifyJson;
    function matchJson(x, y, sub) {
        if (x instanceof Variable)
            x = sub.lookupAsVar(x);
        if (x instanceof Variable) {
            return sub.bind(x, y);
        }
        else {
            switch (typeof x) {
                case 'object':
                    if (x === null) {
                        return y === null ? sub : null;
                    }
                    else if (x instanceof Array) {
                        if (y instanceof Array) {
                            var len = x.length;
                            if (len !== y.length)
                                return null;
                            var s = sub;
                            for (var i = 0; i < len; ++i) {
                                s = matchJson(x[i], y[i], s);
                                if (s === null)
                                    return null;
                            }
                            return s;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        if (y === null || typeof y !== 'object' || y instanceof Array)
                            return null;
                        var xKeys = Object.keys(x).sort();
                        var yKeys = Object.keys(y).sort();
                        var len = xKeys.length;
                        if (len !== yKeys.length)
                            return null;
                        var s = sub;
                        for (var i = 0; i < len; ++i) {
                            var key = xKeys[i];
                            if (key !== yKeys[i])
                                return null;
                            s = matchJson(x[key], y[key], s);
                            if (s === null)
                                return null;
                        }
                        return s;
                    }
                case 'undefined':
                case 'number':
                case 'string':
                case 'boolean':
                    return x === y ? sub : null;
                default:
                    return null;
            }
        }
    }
    exports.matchJson = matchJson;
    function unifyJson(x, y, sub) {
        if (x instanceof Variable)
            x = sub.lookupAsVar(x);
        if (y instanceof Variable)
            y = sub.lookupAsVar(y);
        if (x instanceof Variable) {
            if (y instanceof Variable) {
                return sub.unifyVar(x, y);
            }
            else {
                return sub.bind(x, y);
            }
        }
        else if (y instanceof Variable) {
            return sub.bind(y, x);
        }
        else {
            switch (typeof x) {
                case 'object':
                    if (x === null) {
                        return y === null ? sub : null;
                    }
                    else if (x instanceof Array) {
                        if (y instanceof Array) {
                            var len = x.length;
                            if (len !== y.length)
                                return null;
                            var s = sub;
                            for (var i = 0; i < len; ++i) {
                                s = unifyJson(x[i], y[i], s);
                                if (s === null)
                                    return null;
                            }
                            return s;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        if (y === null || typeof y !== 'object' || y instanceof Array)
                            return null;
                        var xKeys = Object.keys(x).sort();
                        var yKeys = Object.keys(y).sort();
                        var len = xKeys.length;
                        if (len !== yKeys.length)
                            return null;
                        var s = sub;
                        for (var i = 0; i < len; ++i) {
                            var key = xKeys[i];
                            if (key !== yKeys[i])
                                return null;
                            s = unifyJson(x[key], y[key], s);
                            if (s === null)
                                return null;
                        }
                        return s;
                    }
                case 'undefined':
                case 'number':
                case 'string':
                case 'boolean':
                    return x === y ? sub : null;
                default:
                    return null;
            }
        }
    }
    exports.unifyJson = unifyJson;
});
//# sourceMappingURL=unify.js.map
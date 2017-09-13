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
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EphemeralUnionFind = (function () {
        function EphemeralUnionFind(initialCapacity) {
            if (initialCapacity === void 0) { initialCapacity = 10; }
            this.freeListHead = -1;
            this.sbrk = 0;
            var rs = this.ranks = new Array(initialCapacity);
            var ps = this.parents = new Array(initialCapacity);
            for (var i = 0; i < initialCapacity; ++i) {
                rs[i] = 0;
            }
        }
        EphemeralUnionFind.prototype.newId = function (makeNode) {
            if (this.freeListHead === -1) {
                var len = this.ranks.length;
                var id = this.sbrk++;
                if (id >= len)
                    this.grow();
                var val = makeNode(id);
                this.parents[id] = { id: id, value: val };
                return val;
            }
            else {
                var id = this.freeListHead;
                if (typeof this.parents[id] !== 'number')
                    throw new Error('EphemeralUnionFind.newId: shouldn\'t happen');
                this.freeListHead = this.parents[id];
                var val = makeNode(id);
                this.parents[id] = { id: id, value: val };
                return val;
            }
        };
        EphemeralUnionFind.prototype.freeId = function (id) {
            this.parents[id] = this.freeListHead;
            this.freeListHead = id;
        };
        EphemeralUnionFind.prototype.grow = function () {
            var rs = this.ranks;
            var len = rs.length;
            var newSize = 2 * len;
            for (var i = len; i < newSize; ++i) {
                rs[i] = 0;
            }
        };
        EphemeralUnionFind.prototype.find = function (id) {
            return this.findAux(id).value;
        };
        EphemeralUnionFind.prototype.findAux = function (i) {
            if (typeof this.parents[i] !== 'object')
                throw new Error('EphemeralUnionFind.findAux: searching for unallocated or free id.');
            var v = this.parents[i];
            var fi = v.id;
            if (fi === i) {
                return v;
            }
            else {
                return this.parents[i] = this.findAux(fi);
            }
        };
        EphemeralUnionFind.prototype.combineVariable = function (x, y, combine) {
            var vx = this.findAux(x);
            var vy = this.findAux(y);
            var cx = vx.id;
            var cy = vy.id;
            if (cx !== cy) {
                var rx = this.ranks[cx];
                var ry = this.ranks[cy];
                if (rx > ry) {
                    vx.value = combine(vx.value, vy.value);
                    this.parents[cy] = vx;
                }
                else if (rx < ry) {
                    vy.value = combine(vx.value, vy.value);
                    this.parents[cx] = vy;
                }
                else {
                    this.ranks[cy]++;
                    vy.value = combine(vx.value, vy.value);
                    this.parents[cx] = vy;
                }
            }
        };
        return EphemeralUnionFind;
    }());
    exports.EphemeralUnionFind = EphemeralUnionFind;
    var EdgeSet = (function () {
        function EdgeSet() {
            this.set = {};
        }
        EdgeSet.prototype.addEdge = function (srcId, tgtId) {
            var tgtSet = this.set[srcId];
            if (tgtSet === void (0))
                this.set[srcId] = tgtSet = {};
            tgtSet[tgtId] = true;
        };
        EdgeSet.prototype.clear = function () {
            this.set = {};
        };
        EdgeSet.prototype.union = function (other) {
            try {
                for (var _a = __values(other.enumerate()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), srcId = _c[0], tgtId = _c[1];
                    this.addEdge(srcId, tgtId);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var e_1, _d;
        };
        EdgeSet.prototype.enumerate = function () {
            var srcSet, _a, _b, _i, srcId, _c, _d, _e, tgtId;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        srcSet = this.set;
                        _a = [];
                        for (_b in srcSet)
                            _a.push(_b);
                        _i = 0;
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 6];
                        srcId = _a[_i];
                        _c = [];
                        for (_d in srcSet[srcId])
                            _c.push(_d);
                        _e = 0;
                        _f.label = 2;
                    case 2:
                        if (!(_e < _c.length)) return [3, 5];
                        tgtId = _c[_e];
                        return [4, [Number(srcId), Number(tgtId)]];
                    case 3:
                        _f.sent();
                        _f.label = 4;
                    case 4:
                        _e++;
                        return [3, 2];
                    case 5:
                        _i++;
                        return [3, 1];
                    case 6: return [2];
                }
            });
        };
        return EdgeSet;
    }());
    var Node = (function () {
        function Node(id) {
            this.id = id;
            this.level = 1;
            this.marked = false;
            this.inEdges = new EdgeSet();
            this.outEdges = new EdgeSet();
        }
        Node.prototype.dfsBackward = function (visitor) {
            try {
                for (var _a = __values(this.inEdges.enumerate()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), srcId = _c[0], _1 = _c[1];
                    var result = visitor(srcId, this);
                    if (result === 'skip')
                        continue;
                    if (result === 'stop')
                        return false;
                    if (!result.dfsBackward(visitor))
                        return false;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return true;
            var e_2, _d;
        };
        Node.prototype.dfsForward = function (visitor) {
            try {
                for (var _a = __values(this.outEdges.enumerate()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), _2 = _c[0], tgtId = _c[1];
                    var result = visitor(this, tgtId);
                    if (result === 'skip')
                        continue;
                    result.dfsForward(visitor);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
            var e_3, _d;
        };
        return Node;
    }());
    var Graph = (function () {
        function Graph() {
            this.uf = new EphemeralUnionFind(100);
            this.nodeCount = 0;
            this.edgeCount = 0;
        }
        Graph.prototype.display = function () {
            var components = {};
            var len = this.nodeCount;
            for (var i = 0; i < len; ++i) {
                var sccId = this.uf.find(i).id;
                var nodes = components[sccId];
                if (nodes === void (0))
                    components[sccId] = nodes = [];
                nodes.push(i);
            }
            console.log(JSON.stringify(components));
        };
        Graph.prototype.createNode = function () {
            this.nodeCount++;
            return this.uf.newId(function (id) { return new Node(id); });
        };
        Graph.prototype.addEdge = function (vId, wId) {
            var _this = this;
            var u = this.uf.find(vId);
            var z = this.uf.find(wId);
            if (u.level >= z.level) {
                var cycle_1 = false;
                var delta_1 = Math.ceil(Math.sqrt(this.edgeCount));
                var visited_1 = {};
                visited_1[u.id] = true;
                u.dfsBackward(function (xId, y) {
                    var x = _this.uf.find(xId);
                    if (x.id === y.id || x.level !== u.level || visited_1[x.id] !== void (0))
                        return 'skip';
                    --delta_1;
                    if (x.id === z.id) {
                        cycle_1 = true;
                        return delta_1 === 0 ? 'stop' : 'skip';
                    }
                    if (visited_1[x.id] === void (0)) {
                        visited_1[x.id] = true;
                        return delta_1 === 0 ? 'stop' : x;
                    }
                    return delta_1 === 0 ? 'stop' : 'skip';
                });
                if (delta_1 === 0 || z.level !== u.level) {
                    if (delta_1 !== 0) {
                        z.level = u.level;
                    }
                    else {
                        z.level = u.level + 1;
                        visited_1 = {};
                        visited_1[u.id] = true;
                    }
                    z.inEdges.clear();
                    z.dfsForward(function (x, yId) {
                        var y = _this.uf.find(yId);
                        if (visited_1[y.id] !== void (0))
                            cycle_1 = true;
                        if (y.level === z.level) {
                            y.inEdges.addEdge(x.id, yId);
                        }
                        else if (y.level < z.level) {
                            y.level = z.level;
                            y.inEdges.clear();
                            y.inEdges.addEdge(x.id, yId);
                            return y;
                        }
                        return 'skip';
                    });
                }
                if (cycle_1) {
                    cycle_1 = false;
                    z.marked = true;
                    visited_1 = {};
                    visited_1[u.id] = true;
                    var markedNodes_1 = [];
                    var loop_1 = function (xId, y) {
                        var x = _this.uf.find(xId);
                        if (x.id === y.id || x.level !== u.level)
                            return 'skip';
                        if (x.marked && !y.marked) {
                            y.marked = true;
                            markedNodes_1.push(y);
                        }
                        else if (visited_1[x.id] === void (0)) {
                            visited_1[x.id] = true;
                            x.dfsBackward(loop_1);
                            if (x.marked && !y.marked) {
                                y.marked = true;
                                markedNodes_1.push(y);
                            }
                        }
                        return 'skip';
                    };
                    u.dfsBackward(loop_1);
                    var len = markedNodes_1.length;
                    for (var i = 0; i < len; ++i) {
                        var x = markedNodes_1[i];
                        this.uf.combineVariable(z.id, x.id, function (z, x) {
                            z.inEdges.union(x.inEdges);
                            z.outEdges.union(x.outEdges);
                            return z;
                        });
                        x.marked = false;
                    }
                    z.marked = false;
                }
            }
            u.outEdges.addEdge(vId, wId);
            if (u.level === z.level) {
                z.inEdges.addEdge(vId, wId);
            }
            this.edgeCount++;
        };
        return Graph;
    }());
    (function () {
        var g = new Graph();
        g.createNode();
        g.createNode();
        g.addEdge(0, 1);
        g.addEdge(1, 0);
        g.display();
        g = new Graph();
        var n0 = g.createNode();
        var n1 = g.createNode();
        var n2 = g.createNode();
        var n3 = g.createNode();
        var n4 = g.createNode();
        var n5 = g.createNode();
        var n6 = g.createNode();
        g.addEdge(0, 1);
        g.addEdge(1, 2);
        g.addEdge(2, 3);
        g.addEdge(3, 4);
        g.addEdge(4, 5);
        g.addEdge(5, 6);
        g.display();
        g.addEdge(6, 4);
        g.display();
        g.addEdge(3, 0);
        g.display();
        g.addEdge(4, 3);
        g.display();
    })();
});
//# sourceMappingURL=scc.js.map
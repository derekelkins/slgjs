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
    var Variable = (function () {
        function Variable(id, value, isBound) {
            if (isBound === void 0) { isBound = false; }
            this.id = id;
            this.value = value;
            this.isBound = isBound;
        }
        Variable.create = function (id) { return new Variable(id); };
        Variable.prototype.bind = function (v) {
            if (this.isBound)
                throw new Error('Variable.bind: binding already bound variable.');
            return new Variable(this.id, v, true);
        };
        return Variable;
    }());
    exports.Variable = Variable;
    var EphemeralUnionFind = (function () {
        function EphemeralUnionFind(initialCapacity) {
            if (initialCapacity === void 0) { initialCapacity = 10; }
            var rs = this.ranks = new Array(initialCapacity);
            var ps = this.parents = new Array(initialCapacity);
            for (var i = 0; i < initialCapacity; ++i) {
                rs[i] = 0;
                ps[i] = Variable.create(i);
            }
        }
        EphemeralUnionFind.prototype.grow = function (newSize) {
            var rs = this.ranks;
            var ps = this.parents;
            var len = rs.length;
            rs.length = newSize;
            ps.length = newSize;
            newSize = Math.max(2 * len, newSize);
            for (var i = len; i < newSize; ++i) {
                rs[i] = 0;
                ps[i] = Variable.create(i);
            }
        };
        EphemeralUnionFind.prototype.find = function (id) {
            if (id > this.parents.length) {
                this.grow(id + 1);
                return this.parents[id];
            }
            else {
                return this.findAux(id);
            }
        };
        EphemeralUnionFind.prototype.findAux = function (i) {
            var v = this.parents[i];
            var fi = v.id;
            if (fi === i) {
                return v;
            }
            else {
                return this.parents[i] = this.findAux(fi);
            }
        };
        EphemeralUnionFind.prototype.bindValue = function (id, value) {
            var v = this.find(id);
            if (v.isBound)
                throw new Error('EphemeralUnionFind.bindValue: binding to variable that is already bound.');
            this.parents[v.id] = v.bind(value);
            return this;
        };
        EphemeralUnionFind.prototype.bindVariable = function (x, y) {
            var vx = this.find(x);
            if (vx.isBound)
                throw new Error('EphemeralUnionFind.bindVariable: binding to variable that is already bound.');
            var vy = this.find(y);
            var cx = vx.id;
            var cy = vy.id;
            if (cx !== cy) {
                var rx = this.ranks[cx];
                var ry = this.ranks[cy];
                if (rx > ry) {
                    this.parents[cy] = vy.isBound ? vx.bind(vy.value) : vx;
                }
                else if (rx < ry) {
                    this.parents[cx] = vy;
                }
                else {
                    this.ranks[cy]++;
                    this.parents[cx] = vy;
                }
            }
            return this;
        };
        return EphemeralUnionFind;
    }());
    exports.EphemeralUnionFind = EphemeralUnionFind;
    var ArrayCell = (function () {
        function ArrayCell(contents) {
            this.contents = contents;
        }
        ArrayCell.prototype.get = function (index) { return this.contents.get(this, index); };
        ArrayCell.prototype.getUnsafe = function (index) { return this.contents.getUnsafe(this, index); };
        ArrayCell.prototype.set = function (index, value) {
            this.contents.reroot(this);
            return this.contents.set(this, index, value);
        };
        return ArrayCell;
    }());
    var PersistentImmediateArray = (function () {
        function PersistentImmediateArray(baseArray, init) {
            this.baseArray = baseArray;
            this.init = init;
            var len = baseArray.length;
            for (var i = 0; i < len; ++i) {
                baseArray[i] = init(i);
            }
        }
        PersistentImmediateArray.prototype.grow = function (newSize) {
            var arr = this.baseArray;
            var len = arr.length;
            newSize = Math.min(2 * len, newSize);
            arr.length = newSize;
            for (var i = len; i < newSize; ++i) {
                arr[i] = this.init(i);
            }
        };
        PersistentImmediateArray.prototype.get = function (cell, index) {
            var arr = this.baseArray;
            if (index >= arr.length) {
                this.grow(index + 1);
            }
            return arr[index];
        };
        PersistentImmediateArray.prototype.getUnsafe = function (cell, index) {
            return this.baseArray[index];
        };
        PersistentImmediateArray.prototype.set = function (cell, index, value) {
            var arr = this.baseArray;
            var old = arr[index];
            arr[index] = value;
            var res = new ArrayCell(this);
            cell.contents = new DiffArray(index, old, res);
            return res;
        };
        PersistentImmediateArray.prototype.reroot = function (cell) { };
        PersistentImmediateArray.prototype.rerootAux = function (i, v, t, t2) {
            var v2 = this.baseArray[i];
            this.baseArray[i] = v;
            t.contents = this;
            t2.contents = new DiffArray(i, v2, t);
        };
        return PersistentImmediateArray;
    }());
    var SemiPersistentImmediateArray = (function () {
        function SemiPersistentImmediateArray(baseArray, init) {
            this.baseArray = baseArray;
            this.init = init;
            var len = baseArray.length;
            for (var i = 0; i < len; ++i) {
                baseArray[i] = init(i);
            }
        }
        SemiPersistentImmediateArray.prototype.grow = function (newSize) {
            var arr = this.baseArray;
            var len = arr.length;
            newSize = Math.min(2 * len, newSize);
            arr.length = newSize;
            for (var i = len; i < newSize; ++i) {
                arr[i] = this.init(i);
            }
        };
        SemiPersistentImmediateArray.prototype.get = function (cell, index) {
            var arr = this.baseArray;
            if (index >= arr.length) {
                this.grow(index + 1);
            }
            return arr[index];
        };
        SemiPersistentImmediateArray.prototype.getUnsafe = function (cell, index) {
            return this.baseArray[index];
        };
        SemiPersistentImmediateArray.prototype.set = function (cell, index, value) {
            var arr = this.baseArray;
            var old = arr[index];
            arr[index] = value;
            var res = new ArrayCell(this);
            cell.contents = new DiffArray(index, old, res);
            return res;
        };
        SemiPersistentImmediateArray.prototype.reroot = function (cell) { };
        SemiPersistentImmediateArray.prototype.rerootAux = function (i, v, t, t2) {
            this.baseArray[i] = v;
            t.contents = this;
            t2.contents = InvalidArray.IT;
        };
        return SemiPersistentImmediateArray;
    }());
    var DiffArray = (function () {
        function DiffArray(index, value, baseArray) {
            this.index = index;
            this.value = value;
            this.baseArray = baseArray;
        }
        DiffArray.prototype.get = function (t, index) {
            this.reroot(t);
            return t.get(index);
        };
        DiffArray.prototype.getUnsafe = function (t, index) {
            this.reroot(t);
            return t.getUnsafe(index);
        };
        DiffArray.prototype.set = function (cell, index, value) {
            throw new Error('DiffArray.set: we should never get here.');
        };
        DiffArray.prototype.reroot = function (t) {
            var t2 = this.baseArray;
            t2.contents.reroot(t2);
            t2.contents.rerootAux(this.index, this.value, t, t2);
        };
        DiffArray.prototype.rerootAux = function (i, v, t, t2) {
            throw new Error('DiffArray.rerootAux: we should never get here.');
        };
        return DiffArray;
    }());
    var InvalidArray = (function () {
        function InvalidArray() {
        }
        InvalidArray.prototype.get = function (t, index) {
            throw new Error('Attempt to access Invalid semi-persistent array.');
        };
        InvalidArray.prototype.getUnsafe = function (t, index) {
            throw new Error('Attempt to access Invalid semi-persistent array.');
        };
        InvalidArray.prototype.set = function (cell, index, value) {
            throw new Error('Attempt to mutate Invalid semi-persistent array.');
        };
        InvalidArray.prototype.reroot = function (t) {
            throw new Error('Attempt to reroot Invalid semi-persistent array.');
        };
        InvalidArray.prototype.rerootAux = function (i, v, t, t2) {
            throw new Error('Attempt to rerootAux Invalid semi-persistent array.');
        };
        InvalidArray.IT = new InvalidArray();
        return InvalidArray;
    }());
    var PersistentUnionFind = (function () {
        function PersistentUnionFind(ranks, parents) {
            this.ranks = ranks;
            this.parents = parents;
        }
        PersistentUnionFind.createPersistent = function (initialCapacity) {
            var ranks = new Array(initialCapacity);
            var reps = new Array(initialCapacity);
            return new PersistentUnionFind(new ArrayCell(new PersistentImmediateArray(ranks, function () { return 0; })), new ArrayCell(new PersistentImmediateArray(reps, Variable.create)));
        };
        PersistentUnionFind.createSemiPersistent = function (initialCapacity) {
            var ranks = new Array(initialCapacity);
            var reps = new Array(initialCapacity);
            return new PersistentUnionFind(new ArrayCell(new SemiPersistentImmediateArray(ranks, function () { return 0; })), new ArrayCell(new SemiPersistentImmediateArray(reps, Variable.create)));
        };
        PersistentUnionFind.prototype.find = function (id) {
            var t = this.findAux(id);
            this.parents = t[0];
            return t[1];
        };
        PersistentUnionFind.prototype.findAux = function (i) {
            var v2 = this.parents.get(i);
            var fi = v2.id;
            if (fi === i) {
                return [this.parents, v2];
            }
            else {
                var t = this.findAuxUnsafe(fi);
                t[0] = t[0].set(i, t[1]);
                return t;
            }
        };
        PersistentUnionFind.prototype.findAuxUnsafe = function (i) {
            var v2 = this.parents.getUnsafe(i);
            var fi = v2.id;
            if (fi === i) {
                return [this.parents, v2];
            }
            else {
                var t = this.findAuxUnsafe(fi);
                t[0] = t[0].set(i, t[1]);
                return t;
            }
        };
        PersistentUnionFind.prototype.bindValue = function (id, value) {
            var v = this.find(id);
            if (v.isBound)
                throw new Error('PersistentUnionFind.bindValue: binding to variable that is already bound.');
            return new PersistentUnionFind(this.ranks, this.parents.set(v.id, v.bind(value)));
        };
        PersistentUnionFind.prototype.bindVariable = function (x, y) {
            var vx = this.find(x);
            if (vx.isBound)
                throw new Error('PersistentUnionFind.bindVariable: binding to variable that is already bound.');
            var vy = this.find(y);
            return this.bindVariableUnsafe(vx, vy);
        };
        PersistentUnionFind.prototype.bindVariableUnsafe = function (vx, vy) {
            var cx = vx.id;
            var cy = vy.id;
            if (cx !== cy) {
                var rx = this.ranks.getUnsafe(cx);
                var ry = this.ranks.getUnsafe(cy);
                if (rx > ry) {
                    return new PersistentUnionFind(this.ranks, this.parents.set(cy, vy.isBound ? vx.bind(vy.value) : vx));
                }
                else if (rx < ry) {
                    return new PersistentUnionFind(this.ranks, this.parents.set(cx, vy));
                }
                else {
                    return new PersistentUnionFind(this.ranks.set(cy, ry + 1), this.parents.set(cx, vy));
                }
            }
            else {
                return this;
            }
        };
        return PersistentUnionFind;
    }());
    exports.default = PersistentUnionFind;
});
//# sourceMappingURL=puf.js.map
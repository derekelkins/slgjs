// From "A Persistent Union-Find Data Structure" by Conchon and Filliatre

class Variable<A> {
    constructor(readonly id: number, readonly value?: A) {}
    bind(v: A): Variable<A> { 
        if(this.value !== void(0)) throw new Error('Variable.bind: binding already bound variable.'); // ASSERTION
        return new Variable(this.id, v); 
    }
    get isBound(): boolean { return this.value !== void(0); }
}

export interface UnionFind<A> {
    find(id: number): Variable<A>;
    bindValue(id: number, value: A): UnionFind<A>;
    bindVariable(x: number, y: number): UnionFind<A>
}

export class EphemeralUnionFind<A> implements UnionFind<A> {
    private readonly ranks: Array<number>; 
    private readonly parents: Array<Variable<A>>;
    constructor(initialCapacity: number = 10) { 
        const rs = this.ranks = new Array<number>(initialCapacity);
        const ps = this.parents = new Array<Variable<A>>(initialCapacity);
        for(let i = 0; i < initialCapacity; ++i) {
            rs[i] = 0;
            ps[i] = new Variable(i);
        }
    }

    private grow(newSize: number): void {
        const rs = this.ranks;
        const ps = this.parents;
        const len = rs.length;
        rs.length = newSize;
        ps.length = newSize;
        newSize = Math.max(2*len, newSize);
        for(let i = len; i < newSize; ++i) {
            rs[i] = 0;
            ps[i] = new Variable(i);
        }
    }

    find(id: number): Variable<A> {
        if(id > this.parents.length) {
            this.grow(id+1);
            return this.parents[id];
        } else {
            return this.findAux(id);
        }
    }

    private findAux(i: number): Variable<A> {
        const v = this.parents[i];
        const fi = v.id;
        if(fi === i) {
            return v;
        } else {
            return this.parents[i] = this.find(fi);
        }
    }

    bindValue(id: number, value: A): EphemeralUnionFind<A> {
        const v = this.find(id);
        if(v.isBound) throw new Error('EphemeralUnionFind.bindValue: binding to variable that is already bound.'); // ASSERTION
        this.parents[v.id] = v.bind(value);
        return this;
    }

    bindVariable(x: number, y: number): EphemeralUnionFind<A> {
        const vx = this.find(x);
        if(vx.isBound) throw new Error('EphemeralUnionFind.bindVariable: binding to variable that is already bound.'); // ASSERTION
        const vy = this.find(y);
        const cx = vx.id;
        const cy = vy.id;
        if (cx !== cy) {
            const rx = this.ranks[cx];
            const ry = this.ranks[cy];
            if (rx > ry) {
                const yVal = vy.value;
                this.parents[cy] = yVal === void(0) ? vx : vx.bind(yVal);
            } else if(rx < ry) {
                this.parents[cx] = vy;
            } else {
                this.ranks[cy]++;
                this.parents[cx] = vy;
            }
        }
        return this;
    }
}

/*
export class NaiveUnionFind<A> implements UnionFind<A> {
    static create<A>(): NaiveUnionFind<A> {
        return new NaiveUnionFind([]);
    }

    private constructor(private readonly mapping: Array<Variable<A>>) {}

    private grow(): void {
        this.mapping.length *= 2;
    }

    find(id: number): Variable<A> {
        if(id >= this.mapping.length) { this.grow(); }
        let prev = id;
        do {
            const curr = this.mapping[prev];
            if(curr === void(0)) return new Variable(prev);
            prev = curr.id;
        } while(true);
    }

    bindValue(id: number, value: A): UnionFind<A> {
        const v = this.find(id);
        const m = this.mapping.slice();
        if(v.isBound) throw new Error('NaiveUnionFind.bindValue: binding variable that has already been bound.'); // ASSERTION
        m[id] = v.bind(value);
        return new NaiveUnionFind(m);
    }

    bindVariable(x: number, y: number): UnionFind<A> {
        const rx = this.find(x);
        if(rx.isBound) throw new Error('NaiveUnionFind.bindVariable: binding variable that has already been bound.'); // ASSERTION
        const ry = this.find(y);
        const m = this.mapping.slice();
        m[rx.id] = ry;
        return new NaiveUnionFind(m);
    }
}
*/

// This should perform reasonably well for ephemeral usage patterns or for backtracking patterns of use,
// especially with the adaptation to semi-persistence, and rather poorly when accessing old copies as in linear in the depth of update.
interface PersistentArray<A> {
    get(index: number): A;
    set(index: number, value: A): PersistentArray<A>;
}

interface InternalPersistentArray<A> {
    get(cell: ArrayCell<A>, index: number): A;
    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A>;
    reroot(cell: ArrayCell<A>): void;
    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void;
}

class ArrayCell<A> implements PersistentArray<A> {
    constructor(public contents: InternalPersistentArray<A>) {}

    get(index: number): A { return this.contents.get(this, index); }

    set(index: number, value: A): PersistentArray<A> { 
        this.contents.reroot(this); return this.contents.set(this, index, value); 
    }
}

class PersistentImmediateArray<A> implements InternalPersistentArray<A> {
    constructor(private baseArray: Array<A>, private init: (i: number) => A) {
        const len = baseArray.length;
        for(let i = 0; i < len; ++i ){
            baseArray[i] = init(i);
        }
    }

    private grow(newSize: number): void {
        const arr = this.baseArray;
        const len = arr.length;
        newSize = Math.min(2*len, newSize);
        arr.length = newSize;
        for(let i = len; i < newSize; ++i) {
            arr[i] = this.init(i);
        }
    }

    get(cell: ArrayCell<A>, index: number): A {
        const arr = this.baseArray;
        if(index >= arr.length) { return this.init(index); }
        return arr[index];
    }
    
    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        const arr = this.baseArray;
        if(index >= arr.length) { this.grow(index+1); }
        const old = arr[index];
        arr[index] = value;
        const res = new ArrayCell<A>(this);
        cell.contents = new DiffArray<A>(index, old, res);
        return res;
    }

    reroot(cell: ArrayCell<A>): void { /* do nothing */ }
    
    // Persistent
    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        const v2 = this.baseArray[i];
        this.baseArray[i] = v;
        t.contents = this;
        t2.contents = new DiffArray(i, v2, t);
    }
}

class SemiPersistentImmediateArray<A> implements InternalPersistentArray<A> {
    constructor(private baseArray: Array<A>, private init: (i: number) => A) {
        const len = baseArray.length;
        for(let i = 0; i < len; ++i ){
            baseArray[i] = init(i);
        }
    }

    private grow(newSize: number): void {
        const arr = this.baseArray;
        const len = arr.length;
        newSize = Math.min(2*len, newSize);
        arr.length = newSize;
        for(let i = len; i < newSize; ++i) {
            arr[i] = this.init(i);
        }
    }

    get(cell: ArrayCell<A>, index: number): A {
        const arr = this.baseArray;
        if(index >= arr.length) { return this.init(index); }
        return arr[index];
    }
    
    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        const arr = this.baseArray;
        if(index >= arr.length) { this.grow(index+1); }
        const old = arr[index];
        arr[index] = value;
        const res = new ArrayCell<A>(this);
        cell.contents = new DiffArray<A>(index, old, res);
        return res;
    }

    reroot(cell: ArrayCell<A>): void { /* do nothing */ }
    
    // Semi-persistent
    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        this.baseArray[i] = v;
        t.contents = this;
        t2.contents = <InvalidArray<A>>InvalidArray.IT;
    }
}

class DiffArray<A> implements InternalPersistentArray<A> {
    constructor(private readonly index: number, private readonly value: A, private baseArray: ArrayCell<A>) {}

    get(t: ArrayCell<A>, index: number): A {
        this.reroot(t);
        return t.get(index);
    }

    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        throw new Error('DiffArray.set: we should never get here.'); // ASSERTION
    }

    reroot(t: ArrayCell<A>): void {
        const t2 = this.baseArray;
        t2.contents.reroot(t2);
        t2.contents.rerootAux(this.index, this.value, t, t2);
    }

    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        throw new Error('DiffArray.rerootAux: we should never get here.'); // ASSERTION
    }
}

class InvalidArray<A> implements InternalPersistentArray<A> {
    static IT: InvalidArray<any> = new InvalidArray();
    private constructor() {}

    get(t: ArrayCell<A>, index: number): A {
        throw new Error('Attempt to access Invalid semi-persistent array.');
    }

    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        throw new Error('Attempt to mutate Invalid semi-persistent array.');
    }

    reroot(t: ArrayCell<A>): void {
        throw new Error('Attempt to reroot Invalid semi-persistent array.');
    }

    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        throw new Error('Attempt to rerootAux Invalid semi-persistent array.'); // ASSERTION
    }
}

export default class PersistentUnionFind<A> implements UnionFind<A> {
    static createPersistent<A>(initialCapacity: number): PersistentUnionFind<A> {
        const ranks = new Array<number>(initialCapacity);
        const reps = new Array<Variable<A>>(initialCapacity);
        return new PersistentUnionFind(new ArrayCell(new PersistentImmediateArray(ranks, () => 0)), 
                                       new ArrayCell(new PersistentImmediateArray(reps, i => new Variable<A>(i))));
    }

    static createSemiPersistent<A>(initialCapacity: number): PersistentUnionFind<A> {
        const ranks = new Array<number>(initialCapacity);
        const reps = new Array<Variable<A>>(initialCapacity);
        return new PersistentUnionFind(new ArrayCell(new SemiPersistentImmediateArray(ranks, () => 0)), 
                                       new ArrayCell(new SemiPersistentImmediateArray(reps, i => new Variable<A>(i))));
    }

    private constructor(private readonly ranks: PersistentArray<number>, private parents: PersistentArray<Variable<A>>) {}

    find(id: number): Variable<A> {
        const [f, cx] = this.findAux(id);
        this.parents = f;
        return cx;
    }

    private findAux(i: number): [PersistentArray<Variable<A>>, Variable<A>] {
        const v2 = this.parents.get(i);
        const fi = v2.id;
        if(fi === i) {
            return [this.parents, v2];
        } else {
            const t = this.findAux(fi);
            t[0] = t[0].set(i, t[1]);
            return t;
        }
    }

    bindValue(id: number, value: A): PersistentUnionFind<A> {
        const v = this.find(id);
        if(v.isBound) throw new Error('PersistentUnionFind.bindValue: binding to variable that is already bound.'); // ASSERTION
        return new PersistentUnionFind(this.ranks, this.parents.set(v.id, v.bind(value)));
    }

    bindVariable(x: number, y: number): PersistentUnionFind<A> {
        const vx = this.find(x);
        if(vx.isBound) throw new Error('PersistentUnionFind.bindVariable: binding to variable that is already bound.'); // ASSERTION
        const vy = this.find(y);
        const cx = vx.id;
        const cy = vy.id;
        if (cx !== cy) {
            const rx = this.ranks.get(cx);
            const ry = this.ranks.get(cy);
            if (rx > ry) {
                const yVal = vy.value;
                return new PersistentUnionFind(this.ranks, this.parents.set(cy, yVal === void(0) ? vx : vx.bind(yVal)));
            } else if(rx < ry) {
                return new PersistentUnionFind(this.ranks, this.parents.set(cx, vy));
            } else {
                return new PersistentUnionFind(this.ranks.set(cy, ry+1), this.parents.set(cx, vy));
            }
        } else {
            return this;
        }
    }
}

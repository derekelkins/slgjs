// From "A Persistent Union-Find Data Structure" by Conchon and Filliatre

interface UnionFind {
    find(id: number): number;
    union(x: number, y: number): UnionFind;
}

class NaiveUnionFind implements UnionFind {
    static create(): NaiveUnionFind {
        return new NaiveUnionFind([]);
    }

    private constructor(private readonly mapping: Array<number>) {}

    find(id: number): number {
        let prev = id;
        do {
            const curr = this.mapping[prev];
            if(curr === undefined) return prev;
            prev = curr;
        } while(true);
    }

    union(x: number, y: number): UnionFind {
        const rx = this.find(x);
        const ry = this.find(y);
        const m = this.mapping.slice();
        m[rx] = ry;
        return new NaiveUnionFind(m);
    }
}

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

class NaivePersistentArray<A> implements PersistentArray<A> {
    private readonly data: Array<A>;
    constructor(size: number, init: (index: number) => A) {
        this.data = new Array<A>(size);
        for(let i = 0; i < size; i++) {
            this.data[i] = init(i);
        }
    }

    get(index: number): A {
        return this.data[index];
    }

    set(index: number, value: A): PersistentArray<A> {
        const d = this.data;
        return new NaivePersistentArray(d.length, i => d[i]);
    }
}

class ArrayCell<A> implements PersistentArray<A> {
    constructor(public contents: InternalPersistentArray<A>) {}

    get(index: number): A { return this.contents.get(this, index); }

    set(index: number, value: A): PersistentArray<A> { this.contents.reroot(this); return this.contents.set(this, index, value); }
}

class ImmediateArray<A> implements InternalPersistentArray<A> {
    constructor(private baseArray: Array<A>) {}

    get(cell: ArrayCell<A>, index: number): A {
        return this.baseArray[index];
    }
    
    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        const arr = this.baseArray;
        const old = arr[index];
        arr[index] = value;
        const res = new ArrayCell<A>(this);
        cell.contents = new DiffArray<A>(index, old, res);
        return res;
    }

    reroot(cell: ArrayCell<A>): void { /* do nothing */ }
    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        const v2 = this.baseArray[i];
        this.baseArray[i] = v;
        t.contents = this;
        t2.contents = new DiffArray(i, v2, t);
    }
}

class DiffArray<A> implements InternalPersistentArray<A> {
    constructor(private readonly index: number, private readonly value: A, private baseArray: ArrayCell<A>) {}

    get(t: ArrayCell<A>, index: number): A {
        this.reroot(t);
        return t.get(index);
    }

    set(cell: ArrayCell<A>, index: number, value: A): PersistentArray<A> {
        throw 'DiffArray.set: we should never get here.';
    }

    reroot(t: ArrayCell<A>): void {
        const t2 = this.baseArray;
        t2.contents.reroot(t2);
        t2.contents.rerootAux(this.index, this.value, t, t2);
    }

    rerootAux(i: number, v: A, t: ArrayCell<A>, t2: ArrayCell<A>): void {
        throw 'DiffArray.rerootAux: we should never get here.';
    }
}

export default class PersistentUnionFind implements UnionFind {
    static createNaive(size: number): PersistentUnionFind {
        return new PersistentUnionFind(new NaivePersistentArray(size, () => 0), new NaivePersistentArray(size, i => i));
    }

    static create(size: number): PersistentUnionFind {
        const ranks = new Array<number>(size);
        const reps = new Array<number>(size);
        for(let i = 0; i < size; ++i) {
            ranks[i] = 0;
            reps[i] = i;
        }
        return new PersistentUnionFind(new ArrayCell(new ImmediateArray(ranks)), new ArrayCell(new ImmediateArray(reps)));
    }

    private constructor(private readonly rank: PersistentArray<number>, private parent: PersistentArray<number>) {}

    find(id: number): number {
        const [f, cx] = this.findAux(id);
        this.parent = f;
        return cx;
    }

    private findAux(i: number): [PersistentArray<number>, number] {
        const fi = this.parent.get(i);
        if(fi === i) {
            return [this.parent, i];
        } else {
            const t = this.findAux(fi);
            t[0] = t[0].set(i, t[1]);
            return t;
        }
    }

    union(x: number, y: number): PersistentUnionFind {
        const cx = this.find(x);
        const cy = this.find(y);
        if (cx !== cy) {
            const rx = this.rank.get(cx);
            const ry = this.rank.get(cy);
            if (rx > ry) {
                return new PersistentUnionFind(this.rank, this.parent.set(cy, cx));
            } else if(rx < ry) {
                return new PersistentUnionFind(this.rank, this.parent.set(cx, cy));
            } else {
                return new PersistentUnionFind(this.rank.set(cx, rx+1), this.parent.set(cy, cx));
            }
        } else {
            return this;
        }
    }
}

// This doesn't support indexed fields being mutated.

/*
data Table k v = Table {
    rows :: [v],
    indexes :: Map k (Map v (Table k v))
  }
*/
interface Map<V> {
    [index: string]: V;
}

interface PathSpec extends Map<PathSpec> {}

interface Joinable<T1, V1 extends Map<T1>> extends Iterable<V1> {
    join<T2, V2 extends Map<T2>, T3, V3 extends Map<T3>>(otherTable: Table<T2, V2>, columns: Array<string>, joinFn: (left: V1, right: V2) => V3 | undefined): Joinable<T3, V3>;
}
    

function makeIterableJoinable<T1, V1 extends Map<T1>>(it: Iterable<V1>): Joinable<T1, V1> {
    const j = <Joinable<T1, V1>>it;
    j.join = function<T2, V2 extends Map<T2>, T3, V3 extends Map<T3>>(this: Iterable<V1>, otherTable: Table<T2, V2>, columns: Array<string>, joinFn: (left: V1, right: V2) => V3 | undefined): Joinable<T3, V3> {
        return makeIterableJoinable(joinImpl(this, otherTable, columns, joinFn));
    };
    return j;
}

function *joinImpl<T1, V1 extends Map<T1>, T2, V2 extends Map<T2>, R>(left: Iterable<V1>, right: Table<T2, V2>, columns: Array<string>, joinFn: (left: V1, right: V2) => R | undefined): Iterable<R> {
    for(const row of left) {
        const keys = columns.map(v => [v, row[v]]);
        for(const rightRow of right.fetchGen.apply(right, keys)) {
            const result = joinFn(row, rightRow);
            if(result !== undefined) yield result;
        }
    }
}

export default class Table<T, V extends Map<T>> implements Joinable<T, V>{
    private readonly rows: Array<V>;
    private readonly indexes: Map<Map<Table<T, V>>>;

    private static makePathSpec(indexSpec: Array<Array<string>>): PathSpec {
        const pathSpec: PathSpec = {};
        indexSpec.forEach(spec => {
            let current = pathSpec;
            spec.forEach(field => {
                let part = current[field];
                if(part === undefined) current[field] = part = {};
                current = part;
            });
        });
        return pathSpec;
    }

    [Symbol.iterator](): IterableIterator<V> {
        return this.rows[Symbol.iterator]();
    }

    insert(row: V): void {
        this.rows.push(row);
        for(const k in this.pathSpec) {
            const val = row[k];
            let index = this.indexes[k];
            if(index === undefined) this.indexes[k] = index = {};
            let subTable = index[val.toString()];
            if(subTable === undefined) index[val.toString()] = subTable = new Table<T, V>(this.pathSpec[k]);
            subTable.insert(row);
        }
    }

    // TODO: Should probably make an asynchronous version of this.
    static create<T, V extends Map<T>>(rows: Array<V>, indexSpec?: Array<Array<string>>): Table<T, V> {
        if(indexSpec === undefined) indexSpec = [];
        // TODO: Assert no duplicates in each subarray.
        const pathSpec = Table.makePathSpec(indexSpec);
        const t = new Table<T, V>(pathSpec);
        const rowLen = rows.length;
        for(let i = 0; i < rowLen; ++i) {
            t.insert(rows[i]);
        }
        return t;
    }

    private constructor(private readonly pathSpec: PathSpec) { 
        this.rows = [];
        this.indexes = {};
    }

    *fetchWhereGen(predicate: (v: V) => boolean, ...keys: Array<[string, T]>): Iterable<V> {
        const keyLen = keys.length;

        let data: Table<T, V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            for(const row of data.rows) {
                let j = i;
                for(; j < keyLen; j++) {
                    const [key, val] = keys[j];
                    const col = row[key];
                    if(col !== val) break;
                }
                if (j >= keyLen && predicate(row)) yield row;
            }
        } else {
            yield* data.rows;
        }
    }

    *fetchGen(...keys: Array<[string, T]>): Iterable<V> {
        const keyLen = keys.length;

        let data: Table<T, V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            for(const row of data.rows) {
                let j = i;
                for(; j < keyLen; j++) {
                    const [key, val] = keys[j];
                    const col = row[key];
                    if(col !== val) break;
                }
                if (j >= keyLen) yield row;
            }
        } else {
            yield* data.rows;
        }
    }

    fetchWhere(predicate: (v: V) => boolean, ...keys: Array<[string, T]>) : Array<V> {
        const keyLen = keys.length;

        let data: Table<T, V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            return data.rows.filter(row => {
                for(let j = i; j < keyLen; j++) {
                    const [key, val] = keys[j];
                    const col = row[key];
                    if(col !== val) return false;
                }
                return predicate(row);
            });
        } else {
            return data.rows;
        }
    }

    fetch(...keys: Array<[string, T]>) : Array<V> {
        const keyLen = keys.length;

        let data: Table<T, V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            return data.rows.filter(row => {
                for(let j = i; j < keyLen; j++) {
                    const [key, val] = keys[j];
                    if(row[key] !== val) return false;
                }
                return true;
            });
        } else {
            return data.rows;
        }
    }

    join<T2, V2 extends Map<T2>, T3, V3 extends Map<T3>>(otherTable: Table<T2, V2>, columns: Array<string>, joinFn: (left: V, right: V2) => V3 | undefined): Joinable<T3, V3> {
        return makeIterableJoinable(joinImpl(this, otherTable, columns, joinFn));
    }
}

// const t = Table.create([{a:1, b:1, c:1},{a:1,b:2,c:3},{a:2,b:1,c:4}], [['c'],['a','b']]);
// console.log(t);
// console.log(t.fetch());
// console.log(t.fetch(['b',1]));
// console.log(Array.from(t.fetchGen(['b',1])));
// console.log(t.fetch(['a',1],['b',1]));

/*
function deq(left: {d: number, rest?: Array<number>}, right: {d: number,}): {d: number, rest: Array<number>} {
    const rest = left.rest === undefined ? [] : Array.from(left.rest);
    rest.push(right.d);
    return {d: 0, rest: rest };
}

let ds = [];
for(let i = 0; i < 1000000; ++i) {
    ds.push({d: i});
}

const ten = Table.create(ds, [['d']]);
const tenSlow = Table.create(ds, []);

console.log('start');
console.log(Array.from(makeIterableJoinable(tenSlow.fetchGen(['d',0])).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq).join(tenSlow, ['d'], deq)));
console.log(Array.from(makeIterableJoinable(ten.fetchGen(['d',0])).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq).join(ten, ['d'], deq)));
*/

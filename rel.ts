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

export default class Table<V extends Map<any>> {
    private readonly rows: Array<V>;
    private readonly indexes: Map<Map<Table<V>>>;

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

    insert(row: V): void {
        this.rows.push(row);
        for(let k in this.pathSpec) {
            const val = row[k];
            let index = this.indexes[k];
            if(index === undefined) this.indexes[k] = index = {};
            let subTable = index[val];
            if(subTable === undefined) index[val] = subTable = new Table<V>(this.pathSpec[k]);
            subTable.insert(row);
        }
    }

    static create<V>(rows: Array<V>, indexSpec?: Array<Array<string>>): Table<V> {
        if(indexSpec === undefined) indexSpec = [];
        // TODO: Assert no duplicates in each subarray.
        const pathSpec = Table.makePathSpec(indexSpec);
        const t = new Table<V>(pathSpec);
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

    *fetchWhereGen(predicate: (v: any) => boolean, ...keys: Array<[string, V]>): Iterable<V> {
        const keyLen = keys.length;

        let data: Table<V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            for(let row of data.rows) {
                let j = i;
                for(; j < keyLen; j++) {
                    const [key, val] = keys[j];
                    const col = row[key];
                    if(col !== val || !predicate(col)) break;
                }
                if (j >= keyLen) yield row;
            }
        } else {
            yield* data.rows;
        }
    }

    *fetchGen(...keys: Array<[string, any]>): Iterable<V> {
        const keyLen = keys.length;

        let data: Table<V> = this;
        let i: number = 0;

        for(; i < keyLen; ++i) {
            const [key, val] = keys[i];
            const index = data.indexes[key];
            if(index === undefined) break;
            data = index[val.toString()];
        }

        if (i < keyLen) {
            for(let row of data.rows) {
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

    fetchWhere(predicate: (v: any) => boolean, ...keys: Array<[string, V]>) : Array<V> {
        const keyLen = keys.length;

        let data: Table<V> = this;
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
                    if(col !== val || !predicate(col)) return false;
                }
                return true;
            });
        } else {
            return data.rows;
        }
    }

    fetch(...keys: Array<[string, any]>) : Array<V> {
        const keyLen = keys.length;

        let data: Table<V> = this;
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
}

const indexSpec = [['c'],['a','b']];

const t = Table.create([{a:1, b:1, c:1},{a:1,b:2,c:3},{a:2,b:1,c:4}], indexSpec);

console.log(t);
console.log(t.fetch());
console.log(t.fetch(['b',1]));
console.log(t.fetch(['a',1],['b',1]));

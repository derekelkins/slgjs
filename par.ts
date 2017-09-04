import { Variable, Substitution } from "./unify"
import Table from "./rel"
import { Map } from "./rel"

function groundRow<V>(row: Row<V>, sub: Substitution<V>): Row<V> {
    const result: Row<V> = {};
    for(const k in row) {
        const v = row[k];
        result[k] = v instanceof Variable ? sub.lookupAsVar(v) : v;
    }
    return result;
}

function refreshRow<V>(row: Row<V>, sub: Substitution<V>): [Row<V>, Substitution<V>] {
    const mapping = {};
    const newRow: Row<V> = {};
    for(const k in row) {
        const val = row[k];
        if(val instanceof Variable) {
            const newVar = mapping[val.id];
            if(newVar === void(0)) {
                const [[v], s2] = sub.fresh(1);
                mapping[val.id] = v;
                sub = s2;
                newRow[k] = v;
            } else {
                newRow[k] = newVar;
            }
        } else {
            newRow[k] = row[k];
        }
    }
    return [newRow, sub];
}

type Json = any

// No occurs check.
function unifyJson(x: Json | Variable, y: Json | Variable, sub: Substitution<Json | Variable>): Substitution<Json | Variable> | null {
    if(x instanceof Variable) x = sub.lookupAsVar(x);
    if(y instanceof Variable) y = sub.lookupAsVar(y);
    if(x instanceof Variable) {
        if(y instanceof Variable) {
            return sub.unifyVar(x, y);
        } else {
            return sub.bind(x, y);
        }
    } else if(y instanceof Variable) {
        return unifyJson(y, x, sub); // Not the most efficient thing, but it saves code.
    } else {
        switch(typeof x) {
            case 'object':
                if(x === null) {
                    return y === null ? sub : null;
                } else if(x instanceof Array) {
                    if(y instanceof Array) {
                        const len = x.length;
                        if(len !== y.length) return null;
                        for(let i = 0; i < len; ++i) {
                            sub = unifyJson(x[i], y[i], sub);
                            if(sub === null) return null;
                        }
                        return sub;
                    } else {
                        return null;
                    }
                } else { // it's an object
                    if(y === null || typeof y !== 'object' || y instanceof Array) return null;
                    const xKeys = Object.keys(x);
                    const yKeys = Object.keys(y);
                    const len = xKeys.length;
                    if(len !== yKeys.length) return null;
                    for(let i = 0; i < len; ++i) {
                        const key = xKeys[i];
                        if(key !== yKeys[i]) return null;
                        sub = unifyJson(x[key], y[key], sub);
                        if(sub === null) return null;
                    }
                    return sub;
                }
            case 'undefined':
            case 'number':
            case 'string':
            case 'boolean':
                return x === y ? sub : null;
        }
    }
}

type CPS<A> = (k: (value: A) => void) => void;
type LP<V, A> = (generator: Generator<V>) => (sub: Substitution<V>) => CPS<A>;

type Queue<A> = Array<A>;

interface RowIterator<A> {
    next(): A | undefined;
    isComplete: boolean;
}

class Generator<V> {
    private readonly table: Table<V | Variable, Row<V>>;
    private processes: Queue<() => void>;
    private completed = false;
    constructor(process: () => void, indexSpec: Array<Array<string>>, rows: Array<Row<V>> = []) {
        this.table = Table.create(rows, indexSpec);
        this.processes = [process];
    }

    getAnswerIterator(): RowIterator<Row<V>> {
    }

    enqueue(process: () => void): void {
        this.processes.push(process);
    }

    executeRound(): boolean {
        const waiters = this.processes;
        this.processes = [];
        const len = waiters.length;
        const tableLength = this.table.length;
        for(let i = 0; i < len; ++i) {
            waiters[i]();
        }
        return this.table.length !== tableLength;
    }

    static create<V>(body: LP<V, Substitution<V>>): Generator<V> {
        // TODO: This is incomplete and I'm not quite sure where to put this.
        const gen = new Generator(() => body(gen)(s0)(s => gen.insertAnswer(groundRow(row, s))), []);

    }

    private insertAnswer(row: Row<V>): void {
        // TODO
    }
}

class Predicate<V> {
    private readonly generators: Map<Generator<V>> = {};
    private getGenerator(predicate: string, row: Row<V>): Generator<V> {
        const gen = this.generators[predicate];
        return gen;
    }
    consume(row: Row<V>): LP<V, Substitution<V>> {
        return gen => s => k => {
            const generator = this.getGenerator(groundRow(row, s));
            let rowIterator = generator.getAnswerIterator();
            const loop = () => {
                let r = rowIterator.next();
                while(r !== void(0)) {
                    const [r2, s2] = refreshRow(r, s);
                    const s3 = unifyRow(row, r2, s2);
                    if(s2 !== null) k(s3);
                }
                if(rowIterator.isComplete) return;
                gen.enqueue(loop);
            };
            loop(); // NOTE: Alternatively, just immediate enqueue this and return.
        };
    }

    register(predicate: string, body: (row: Row<V>) => LP<V, Substitution<V>>): void {
        
        

    }
}

function conj<V>(...cs: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
    return gen => {
        const cs2 = cs.map(c => c(gen));
        return s => {
            let result = k => k(s);
            const len = cs2.length;
            for(let i = 0; i < len; ++i) {
                const c = cs2[i];
                result = k => result(s2 => c(s2)(k));
            }
            return result;
        };
    };
}

function disj<V>(...ds: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
    return gen => {
        const ds2 = ds.map(d => d(gen));
        return s => k => {
            const len = ds2.length;
            for(let i = 0; i < len; ++i) {
                const d = ds2[i];
                gen.enqueue(() => d(s)(k));
            }
        };
    };
}

function fresh<V, A>(count: number, body: (...vs: Array<Variable>) => LP<V, A>): LP<V, A> {
    return gen => s => k => {
        const [vs, s2] = s.fresh(count);
        return body.apply(null, vs)(gen)(s2)(k);
    };
}

/*
// data Process a = Fail | Done a | Pause (() -> Process a)
interface Process<A> {
    then<B>(f: (a: A) => Process<B>): Process<B>;
}

class Fail implements Process<any> {
    static readonly IT = new Fail();
    private constructor() {}
    then<A, B>(f: (a: A) => Process<B>): Process<B> {
        return Fail.IT;
    }
}

class Done<A> implements Process<A> {
    constructor(readonly value: A) {}
    then<B>(f: (a: A) => Process<B>): Process<B> {
        return f(this.value);
    }
}

class Pause<A> implements Process<A> {
    constructor(readonly continuation: () => Process<A>) {}
    then<B>(f: (a: A) => Process<B>): Process<B> {
        return new Pause(() => this.continuation().then(f));
    }
}

class TopLevel<V> {
    private readonly generators: Array<Generator<V>>;
    private getGenerator(predicate: string, row: Row<V>): Generator<V> {
    }
    consume(predicate: string, row: Row<V>): LP<V, Substitution<V>> {
        return gen => s => {
            const generator = this.getGenerator(predicate, groundRow(row, s));
            let rowIndex = 0;

        };
    }
}    

type LP<V, A> = (generator: Generator<V>) => (sub: Substitution<V>) => Process<A>

function conj<V>(...cs: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
    return gen => {
        const cs2 = cs.map(c => c(gen));
        return sub => {
            let i = 0;
            const csLen = cs2.length;
            const loop = s => {
                for(; i < csLen; ++i) {
                    const result = cs2[i](s);
                    if(result === Fail.IT) return result;
                    if(result instanceof Done) {
                        s = result.value;
                        continue;
                    }
                    if(result instanceof Pause) {
                        return result.then(loop);
                    }
                }
            };
            return loop(sub);
        };
    };
}

function disj<V>(...ds: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
    return gen => 
        const ds2 = ds.map(d => d(gen));
        return s => {
            
        };
    };
}
*/

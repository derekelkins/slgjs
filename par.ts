import { Variable, Substitution } from "./unify"
import { Json, JsonTrieTerm } from "./json-trie"

function groundJson(x: Json, sub: Substitution<Json>): Json {
    if(x instanceof Variable) x = sub.lookupAsVar(x);
    switch(typeof x) {
        case 'object':
            if(x === null) {
                return x;
            } else if(x instanceof Variable) {
                return x;
            } else if(x instanceof Array) {
                return x.map(y => groundJson(y, sub));
            } else { // it's an object
                const result: Json = {};
                for(const key in x) {
                    result[key] = groundJson(x[key], sub);
                }
                return result;
            }
        default:
            return x;
    }
}

function refreshJson(x: Json, sub: Substitution<Json>, mapping: {[index: number]: Variable}): [Json, Substitution<Json>] {
    switch(typeof x) {
        case 'object':
            if(x === null) {
                return [x, sub];
            } else if(x instanceof Variable) {
                const v = mapping[x.id];
                if(v === void(0)) {
                    const t = sub.freshVar();
                    mapping[x.id] = t[0];
                    return t;
                } else {
                    return [v, sub];
                }
            } else if(x instanceof Array) {
                let s = sub;
                const len = x.length;
                const newArray = new Array<Json>(len);
                for(let i = 0; i < len; ++i) {
                    const t = refreshJson(x[i], s, mapping);
                    newArray[i] = t[0];
                    s = t[1];
                }
                return [newArray, s];
            } else { // it's an object
                let s = sub;
                const newObject: Json = {};
                for(const key in x) {
                    const t = refreshJson(x[key], s, mapping);
                    newObject[key] = t[0];
                    s = t[1];
                }
                return [newObject, s];
            }
        default:
            return [x, sub];
    }
}

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
                        let s: Substitution<any> | null = sub;
                        for(let i = 0; i < len; ++i) {
                            s = unifyJson(x[i], y[i], s);
                            if(s === null) return null;
                        }
                        return s;
                    } else {
                        return null;
                    }
                } else { // it's an object
                    if(y === null || typeof y !== 'object' || y instanceof Array) return null;
                    const xKeys = Object.keys(x);
                    const yKeys = Object.keys(y);
                    const len = xKeys.length;
                    if(len !== yKeys.length) return null;
                    let s: Substitution<any> | null = sub;
                    for(let i = 0; i < len; ++i) {
                        const key = xKeys[i];
                        if(key !== yKeys[i]) return null;
                        s = unifyJson(x[key], y[key], s);
                        if(s === null) return null;
                    }
                    return s;
                }
            case 'undefined':
            case 'number':
            case 'string':
            case 'boolean':
                return x === y ? sub : null;
            default:
                return null; // We were given a function or a symbol or some other nonsense.
        }
    }
}

interface Scheduler {
    enqueue(process: () => void): void;
    executeRound(): boolean;
}

class TopLevelScheduler implements Scheduler {
    private processes: Queue<() => void> = [];
    constructor() { }
    
    enqueue(process: () => void): void {
        this.processes.push(process);
    }

    executeRound(): boolean {
        const waiters = this.processes;
        this.processes = [];
        const len = waiters.length;
        for(let i = 0; i < len; ++i) {
            waiters[i]();
        }
        return this.processes.length !== 0;
    }
}

type CPS<A> = (k: (value: A) => void) => void;
export type LP<V, A> = (scheduler: Scheduler) => (sub: Substitution<V>) => CPS<A>;

type Queue<A> = Array<A>;

interface RowIterator<A> {
    next(): A | undefined;
    isComplete: boolean;
}

class GeneratorIterator<A> implements RowIterator<A> {
    private index: number = 0;
    constructor(private readonly array: Array<A>, private readonly gen: Generator) {}

    next(): A | undefined {
        const arr = this.array;
        if(this.index < arr.length) {
            return arr[this.index++];
        } else {
            return void(0);
        }
    }

    get isComplete(): boolean {
        return this.gen.isComplete;
    }
}

class Generator implements Scheduler {
    private processes: Queue<() => void>;
    private completed = false; // TODO: Use this.
    private readonly answerSet: JsonTrieTerm<boolean> = JsonTrieTerm.create();
    constructor(process: () => void, private readonly table: Array<Array<Json>> = []) {
        this.processes = [process];
    }

    getAnswerIterator(): RowIterator<Array<Json>> {
        return new GeneratorIterator(this.table, this);
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
        return this.completed = this.processes.length === 0 && this.table.length === tableLength; // TODO: More is probably needed...
    }

    get isComplete(): boolean { return this.completed; }

    static create<V>(body: LP<Json, Substitution<Json>>, count: number, s0: Substitution<Json>): Generator {
        const gen: Generator = new Generator(() => body(gen)(s0)(s => gen.insertAnswer(count, s)), []);
        return gen;
    }

    private insertAnswer(count: number, sub: Substitution<Json>): void {
        const answer = new Array<Json>(count);
        for(let i = 0; i < count; ++i) {
            answer[i] = sub.lookupById(i);
        }
        this.answerSet.modify(answer, exists => { if(!exists) { this.table.push(answer); }; return true; });
    }
}
export interface Predicate {    
    consume(row: Json): LP<Json, Substitution<Json>>;
}

export class EdbPredicate implements Predicate {
    constructor(private readonly table: Array<Json>) {}

    consume(row: Json): LP<Json, Substitution<Json>> {
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = unifyJson(arr[i], row, s);
                if(s2 !== null) k(s2);
            }
        };
    }
}

export class UntabledPredicate implements Predicate {
    constructor(private readonly body: (row: Json) => LP<Json, Substitution<Json>>) { }

    consume(row: Json): LP<Json, Substitution<Json>> {
        return this.body(row);
    }
}

export class TabledPredicate implements Predicate {
    private readonly generators: JsonTrieTerm<Generator> = JsonTrieTerm.create();
    constructor(private readonly body: (row: Json) => LP<Json, Substitution<Json>>) { }

    private getGenerator(row: Json): [Generator, Array<Variable>] {
        let vm: any = null;
        const g = this.generators.modifyWithVars(row, (gen, varMap: {count: number, [index: number]:number}) => {
            vm = varMap;
            if(gen === void(0)) {
                const [r, s] = refreshJson(row, Substitution.emptyPersistent(), {});
                return Generator.create(this.body(r), varMap.count, s);
            } else {
                return gen;
            }
        });
        const keys = new Array<Variable>(vm.count);
        for(const key in vm) {
            if(key !== 'count') {
                keys[vm[key]] = new Variable(Number(key));
            }
        }
        return [g, keys];
    }

    consume(row: Json): LP<Json, Substitution<Json>> {
        return gen => s => k => {
            const [generator, vs] = this.getGenerator(groundJson(row, s));
            let rowIterator = generator.getAnswerIterator();
            const loop = () => {
                let cs = rowIterator.next();
                const len = vs.length;
                while(cs !== void(0)) {
                    let s2 = s;
                    for(let i = 0; i < len; ++i) {
                        s2 = s2.bind(vs[i], cs[i]);
                    }
                    k(s2);
                    cs = rowIterator.next();
                }
                generator.executeRound();
                if(rowIterator.isComplete) return;
                gen.enqueue(loop);
            };
            //loop(); // NOTE: Alternatively, just immediate enqueue this and return.
            gen.enqueue(loop); // Seems to work correctly with this, but I think the other line should work too but it doesn't.
        };
    }
}

function seq<V, A>(m: LP<V, Substitution<V>>, f: LP<V, A>): LP<V, A> {
    return gen => s => k => m(gen)(s)(s => f(gen)(s)(k))
}

function ground(val: Json): LP<Json, Json> {
    return gen => s => k => k(groundJson(val, s));
}

export function conj<V>(...cs: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
    return gen => {
        const cs2 = cs.map(c => c(gen));
        return s => k => {
            const len = cs2.length;
            const loop = (i: number) => (s2: Substitution<V>) => {
                if(i < len) {
                    cs2[i](s2)(loop(i+1));
                } else {
                    k(s2);
                }
            }
            return loop(0)(s);
        };
    };
}

export function disj<V>(...ds: Array<LP<V, Substitution<V>>>): LP<V, Substitution<V>> {
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

export function fresh<V, A>(count: number, body: (...vs: Array<Variable>) => LP<V, A>): LP<V, A> {
    return gen => s => k => {
        const [vs, s2] = s.fresh(count);
        return body.apply(null, vs)(gen)(s2)(k);
    };
}

export function unify(x: Json, y: Json): LP<Substitution<Json>, Substitution<Json>> {
    return gen => s => k => {
        const s2 = unifyJson(x, y, s);
        if(s2 !== null) {
            return k(s2);
        }
    };
}

export function rule<V>(...alternatives: Array<[number, (...vs: Array<Variable>) => Array<LP<Substitution<V>, Substitution<V>>>]>): LP<Substitution<V>, Substitution<V>> {
    return disj.apply(null, alternatives.map(([n, cs]) => fresh(n, (...vs) => conj.apply(null, cs.apply(null, vs)))));
}

export function runLP<V, A>(sched: Scheduler, m: LP<V, A>, k: (a: A) => void): void {
    return sched.enqueue(() => {
        m(sched)(Substitution.emptyPersistent())(k);

    });
}

(() => {
const append: Predicate = new UntabledPredicate(([Xs, Ys, Zs]: Json) => {
    return rule(
        [0, () =>
            [unify([], Xs), unify(Ys, Zs)]],
        [3, (X1, Xs1, Zs1) =>  
            [unify([X1, Xs1], Xs), unify([X1, Zs1], Zs), append.consume([Xs1, Ys, Zs1])]]); });

function list(...xs: Array<Json>): Json {
    let ys: Json = [];
    for(let i = xs.length-1; i >= 0; --i) {
        ys = [xs[i], ys];
    }
    return ys;
}

const edge: Predicate = new EdbPredicate([
    [1, 2],
    [2, 3],
    [3, 1]]);
const path: Predicate = new TabledPredicate(row => {
    return rule(
        [0, () => [edge.consume(row)]],
        [1, Y  => [path.consume([row[0], Y]), path.consume([Y, row[1]])]]);
});
const path2: Predicate = new TabledPredicate(row => {
    return rule(
        [1, Y  => [path2.consume([row[0], Y]), path2.consume([Y, row[1]])]],
        [0, () => [edge.consume(row)]]);
});

const sched = new TopLevelScheduler();
//runLP(sched, fresh(2, (l, r) => seq(append.consume([l, r, list(1,2,3,4,5)]), ground([l, r]))), a => console.dir(a, {depth: null}));
//runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path2.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
//sched.executeRound();
while(sched.executeRound()) {};
})();

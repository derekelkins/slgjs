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

type Stack<A> = Array<A>;

interface GlobalEnvironment {
    generatorCount: number;
    topOfCompletionStack?: Generator;
}

interface Scheduler {
    push(process: () => void): void;
    dependOn(gen: Generator): void;
    readonly globalEnv: GlobalEnvironment;
}

class TopLevelScheduler implements Scheduler {
    private processes: Queue<() => void> = [];
    readonly globalEnv: GlobalEnvironment = {generatorCount: 0, topOfCompletionStack: void(0)};
    constructor() { }
    
    push(process: () => void): void {
        this.processes.push(process);
    }

    execute(): void {
        const waiters = <Array<() => void>>this.processes;
        let waiter = waiters.pop();
        while(waiter !== void(0)) { waiter(); waiter = waiters.pop(); }
    }

    dependOn(gen: Generator): void { } // Don't need to do anything.
}

type CPS<A> = (k: (value: A) => void) => void;
export type LP<V, A> = (scheduler: Scheduler) => (sub: Substitution<V>) => CPS<A>;

type Queue<A> = Array<A>;

class Generator implements Scheduler {
    private readonly selfId: number;
    readonly globalEnv: GlobalEnvironment;
    private prevGenerator?: Generator;
    private directLink: number;
    // When we attempt to complete, we need to determine if we're the leader. The leader is the generator
    // such that prev.selfId < min(this.directLink, minLink(this.selfId)) where prev is the immediately
    // preceding generator in the completionStack, and minLink(id) is the minimum value of the directLink
    // for all generators in the completionStack whose selfId is greater than or equal to id; or it's the
    // top level scheduler. Basically, since an attempt at completion is going to start at the top of the
    // stack (the latest entry), we can walk up the stack maintaining a running minimum of directLinks 
    // until we hit a generator that satisfies the leader condition or hit the bottom of the stack. At 
    // that point, to perform the actual completion, we walk the completion stack from the leader to the
    // top (i.e. newest entry) checking if any answer iterators have unconsumed answers. If not, we mark
    // all the generators including the leader as complete and pop them all from the stack. If there are
    // unconsumed answers, we break out of the stack traversing loop and wake up the consumer blocked on
    // that iterator. It will eventually lead to another completion attempt, at which point the leader
    // may have changed. If LRD-stratified negation is being supported, negative consumers of any of the
    // completed goals need to be woken, however, an exact SCC calculation needs to be performed to
    // correctly support even LRD-stratified negation.

    private /*readonly*/ processes?: Queue<() => void> = [];
    // We check for completion whenever this queue is empty.
    
    private /*readonly*/ consumers?: Array<[number, (cs: Array<Json>) => void]> = [];

    private readonly table: Array<Array<Json>> = [];
    // NOTE: We could have the answerSet store nodes of a linked list which could be traversed
    // by the answer iterators, and that would mean we wouldn't need the table, but I don't think
    // that will really make much difference in time or space, nor is it clear that it is a good
    // trade-off. If there was an easy way to avoid needing to store the answer as an array in
    // the nodes, then it would be worth it. In the "Efficient Access Mechanisms for Tabled Logic
    // Programs" paper, they have parent pointers in the answer trie (but not the subgoal trie)
    // that allow this.
    private /*readonly*/ answerSet?: JsonTrieTerm<boolean> = JsonTrieTerm.create();

    constructor(scheduler: Scheduler) {
        const gEnv = this.globalEnv = scheduler.globalEnv;
        this.selfId = gEnv.generatorCount++;
        this.directLink = this.selfId;
        this.prevGenerator = gEnv.topOfCompletionStack;
        gEnv.topOfCompletionStack = this;
    }

    dependOn(v: Generator): void {
        this.directLink = Math.min(this.directLink, v.directLink);
    }

    consume(k: (cs: Array<Json>) => void): void {
        if(this.isComplete) {
            const answers = this.table;
            const len = answers.length;
            for(let i = 0; i < len; ++i) {
                k(answers[i]);
            }
        } else {
            const cs = <Array<[number, (cs: Array<Json>) => void]>>this.consumers;
            cs.push([0, k]);
            if(cs.length === 1) this.execute();
        }
    }

    private scheduleAnswers(consumer: [number, (cs: Array<Json>) => void]): boolean {
        const answers = this.table;
        const len = answers.length;
        const start = consumer[0];
        const k = consumer[1];
        for(let i = start; i < len; ++i) {
            k(answers[i]);
        }
        consumer[0] = len;
        return start !== len;
    }

    push(process: () => void): void {
        (<Array<() => void>>this.processes).push(process);
    }

    private isLeader(): Array<Generator> | undefined {
        const prev = this.prevGenerator;
        const result: Array<Generator> = [];
        let tos = <Generator>this.globalEnv.topOfCompletionStack;
        let minLink = this.directLink;
        let lastLink = this.directLink;
        let last: Generator | undefined = void(0);
        while(tos !== this) {
            const p = <Generator>tos.prevGenerator;
            if(tos.isComplete) { // unlink completed generators from the completion stack
                if(last !== void(0)) {
                    last.prevGenerator = p;
                }
                tos.prevGenerator = void(0);
            } else {
                result.push(tos);
                last = tos;
                lastLink = tos.directLink;
                minLink = Math.min(lastLink, minLink);
            }
            tos = p;
        }
        result.push(this);
        return prev === void(0) || prev.selfId < Math.min(this.directLink, minLink) ? result : void(0);
    }

    private scheduleResumes(): boolean {
        const cs = <Array<[number, (cs: Array<Json>) => void]>>this.consumers;
        const len = cs.length;
        let wereUnconsumed = false;
        for(let i = 0; i < len; ++i) {
            if(this.scheduleAnswers(cs[i])) {
                wereUnconsumed = true;
            }
        }
        return wereUnconsumed;
    }

    private checkCompletion(): void {
        if(this.isComplete) return;
        completionLoop:
        while(true) {
            const cStack = this.isLeader();
            if(cStack === void(0)) return;
            const len = cStack.length;
            for(let i = len - 1; i >= 0; --i) {
                if(cStack[i].scheduleResumes()) { continue completionLoop; }
            }
            const prev = this.prevGenerator;
            for(let i = len - 1; i >= 0; --i) {
                const gen = cStack[i];
                gen.complete();
                gen.prevGenerator = void(0);
            }
            this.globalEnv.topOfCompletionStack = prev;
            return;
        }
    }

    private execute(): void {
        const waiters = <Array<() => void>>this.processes;
        let waiter = waiters.pop();
        while(waiter !== void(0)) { waiter(); waiter = waiters.pop(); }
        this.checkCompletion();
    }

    private complete(): void {
        this.processes = void(0);
        this.consumers = void(0); // TODO: I need to notify negative consumers here.
        this.answerSet = void(0);
    }

    get isComplete(): boolean { return this.answerSet === void(0); }

    static create<V>(body: LP<Json, Substitution<Json>>, sched: Scheduler, count: number, s0: Substitution<Json>): Generator {
        const gen = new Generator(sched);
        gen.push(() => body(gen)(s0)(s => gen.insertAnswer(count, s)));
        return gen;
    }

    private insertAnswer(count: number, sub: Substitution<Json>): void {
        if(count === 0) { 
            if(this.table.length === 0) { 
                this.table.push([]);
                this.complete();
            } // else, do nothing, we've already completed
        } else {
            // TODO: Early completion. Early completion occurs when an answer is a variant of the goal. Checking this just means
            // that the answer tuple consists of nothing but distinct variables. In such a case, we can clear this.processes.
            // An LRD-stratified program that requires early completion:
            // a :- b, not c. b :- a;d. b. c :- not d. d :- b, e. ?- a.
            // That said, early completion is only *necessary* when there's negation, which for SLG is restricted to applying to
            // (dynamically) ground literals, i.e. count === 0. So the early completion check can be restricted to ground goals at 
            // which point *any* answer entails an early completion.
            const answer = new Array<Json>(count);
            for(let i = 0; i < count; ++i) {
                answer[i] = sub.lookupById(i); // TODO: Should I ground these? I think the answer is it's unnecessary.
            }
            (<JsonTrieTerm<boolean>>this.answerSet).modify(answer, exists => { if(!exists) { this.table.push(answer); }; return true; });
        }
    }
}
export interface Predicate {    
    consume(row: Json): LP<Json, Substitution<Json>>;
}

export class EdbPredicate implements Predicate {
    constructor(private readonly table: Array<Json>) {}

    // NOTE: This spews a ton of answers which can easily lead to a ton of blocked processes.
    // As an alternative, we can produce results one at a time and enqueue the remainder. This
    // doesn't completely solve the problem since we'll still return answers before the earlier
    // alternatives have failed, but it gives them more of an opportunity to complete. We can
    // imagine having a trade-off between these two options; returning a fixed number of answers
    // (or some other approach to throttle) at a time.
    /* */
    consume(row: Json): LP<Json, Substitution<Json>> { // Eager approach.
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = unifyJson(arr[i], row, s);
                if(s2 !== null) k(s2);
            }
        };
    }
    // */
    /* *
    consume(row: Json): LP<Json, Substitution<Json>> { // Less eager approach.
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            let i = 0;
            const loop = () => {
                while(i < len) {
                    const s2 = unifyJson(arr[i++], row, s);
                    if(s2 !== null) { 
                        k(s2);
                        gen.push(loop);
                        return;
                    } 
                }
            };
            loop();
        };
    }
    // */
    /* *
    consume(row: Json): LP<Json, Substitution<Json>> { // Throttled approach.
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            let i = 0;
            const loop = () => {
                let count = this.throttle;
                while(i < len) {
                    const s2 = unifyJson(arr[i++], row, s);
                    if(s2 !== null) { 
                        k(s2);
                        if(--count === 0) {
                            gen.push(loop);
                            return;
                        }
                    } 
                }
            };
            loop();
        };
    }
    // */
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

    private getGenerator(row: Json, sched: Scheduler): [Generator, Array<Variable>] {
        let vm: any = null;
        const g = this.generators.modifyWithVars(row, (gen, varMap: {count: number, [index: number]: number}) => {
            vm = varMap;
            if(gen === void(0)) {
                const [r, s] = refreshJson(row, Substitution.emptyPersistent(), {});
                return Generator.create(this.body(r), sched, varMap.count, s);
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
            const [generator, vs] = this.getGenerator(groundJson(row, s), gen);
            gen.dependOn(generator);
            const len = vs.length;
            generator.consume(cs => {
                let s2 = s;
                for(let i = 0; i < len; ++i) {
                    s2 = s2.bind(vs[i], cs[i]);
                }
                k(s2);
            });
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
            for(let i = len - 1; i >= 0; --i) {
                const d = ds2[i];
                gen.push(() => d(s)(k));
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
    return sched.push(() => m(sched)(Substitution.emptyPersistent())(k));
}

(() => {
const append: Predicate = new UntabledPredicate(([Xs, Ys, Zs]: Json) => rule(
    [0, () =>
        [unify([], Xs), unify(Ys, Zs)]],
    [3, (X1, Xs1, Zs1) =>  
        [unify([X1, Xs1], Xs), unify([X1, Zs1], Zs), append.consume([Xs1, Ys, Zs1])]]));

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
const path: Predicate = new TabledPredicate(row => rule(
    [0, () => [edge.consume(row)]],
    [1, Y  => [path.consume([row[0], Y]), path.consume([Y, row[1]])]]));
const path2: Predicate = new TabledPredicate(row => rule(
    [1, Y  => [path2.consume([row[0], Y]), path2.consume([Y, row[1]])]],
    [0, () => [edge.consume(row)]]));
const path3: Predicate = new TabledPredicate(row => rule(
    [1, Y  => [path3.consume([row[0], Y]), edge.consume([Y, row[1]])]],
    [0, () => [edge.consume(row)]]));
const path4: Predicate = new TabledPredicate(row => rule(
    [1, Y  => [edge.consume([row[0], Y]), path4.consume([Y, row[1]])]],
    [0, () => [edge.consume(row)]]));

const r: Predicate = new TabledPredicate(row => rule(
    [0, () => [r.consume(row)]]));

const p: Predicate = new TabledPredicate(row => rule(
    [0, () => [q.consume(row)]]));
const q: Predicate = new TabledPredicate(row => rule(
    [0, () => [p.consume(row)]]));

const sched = new TopLevelScheduler();
// runLP(sched, fresh(2, (l, r) => seq(append.consume([l, r, list(1,2,3,4,5)]), ground([l, r]))), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path2.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path3.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path4.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, r.consume(null), a => console.log('completed'));
// runLP(sched, p.consume(null), a => console.log('completed'));
sched.execute();
})();

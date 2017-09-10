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
    topOfCompletionStack: Generator | null;
}

interface Scheduler {
    push(process: () => void): void;
    dependOn(gen: Generator): void;
    readonly globalEnv: GlobalEnvironment;
}

class TopLevelScheduler implements Scheduler {
    private processes: Queue<() => void> = [];
    readonly globalEnv: GlobalEnvironment = {generatorCount: 0, topOfCompletionStack: null};
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
    private prevGenerator: Generator | null;
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

    private /*readonly*/ processes: Queue<() => void> | null = [];
    // We check for completion whenever this queue is empty.
    
    private /*readonly*/ consumers: Array<[number, (cs: Array<Json>) => void]> | null = [];

    private readonly table: Array<Array<Json>> = [];
    // NOTE: We could have the answerSet store nodes of a linked list which could be traversed
    // by the answer iterators, and that would mean we wouldn't need the table, but I don't think
    // that will really make much difference in time or space, nor is it clear that it is a good
    // trade-off. If there was an easy way to avoid needing to store the answer as an array in
    // the nodes, then it would be worth it. In the "Efficient Access Mechanisms for Tabled Logic
    // Programs" paper, they have parent pointers in the answer trie (but not the subgoal trie)
    // that allow this.
    private /*readonly*/ answerSet: JsonTrieTerm<boolean> | null = JsonTrieTerm.create();

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
        let last: Generator | null = null;
        while(tos !== this) {
            const p = <Generator>tos.prevGenerator;
            if(tos.isComplete) { // unlink completed generators from the completion stack
                if(last !== null) {
                    last.prevGenerator = p;
                } else {
                    this.globalEnv.topOfCompletionStack = p;
                }
                tos.prevGenerator = null;
            } else {
                result.push(tos);
                last = tos;
                lastLink = tos.directLink;
                minLink = Math.min(lastLink, minLink);
            }
            tos = p;
        }
        result.push(this);
        return prev === null || prev.selfId < Math.min(this.directLink, minLink) ? result : void(0);
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
                gen.prevGenerator = null;
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
        this.processes = null;
        this.consumers = null; // TODO: I need to notify negative consumers here.
        this.answerSet = null;
    }

    get isComplete(): boolean { return this.answerSet === null; }

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

const cyl: Predicate = new EdbPredicate([
    [1,30],
    [1,40],
    [2,43],
    [2,34],
    [3,30],
    [3,33],
    [4,45],
    [4,40],
    [5,31],
    [5,45],
    [6,31],
    [6,48],
    [7,31],
    [7,41],
    [8,25],
    [8,30],
    [9,40],
    [9,31],
    [10,35],
    [10,46],
    [11,32],
    [11,28],
    [12,35],
    [12,43],
    [13,46],
    [13,48],
    [14,39],
    [14,35],
    [15,46],
    [15,28],
    [16,28],
    [16,42],
    [17,33],
    [17,25],
    [18,46],
    [18,27],
    [19,38],
    [19,47],
    [20,27],
    [20,41],
    [21,34],
    [21,38],
    [22,27],
    [22,33],
    [23,26],
    [23,35],
    [24,36],
    [24,25],
    [25,70],
    [25,52],
    [26,59],
    [26,71],
    [27,61],
    [27,58],
    [28,61],
    [28,54],
    [29,63],
    [29,70],
    [30,58],
    [30,53],
    [31,56],
    [31,60],
    [32,58],
    [32,50],
    [33,62],
    [33,66],
    [34,55],
    [34,72],
    [35,63],
    [35,58],
    [36,55],
    [36,64],
    [37,56],
    [37,58],
    [38,68],
    [38,61],
    [39,64],
    [39,52],
    [40,57],
    [40,70],
    [41,69],
    [41,55],
    [42,62],
    [42,53],
    [43,68],
    [43,65],
    [44,56],
    [44,62],
    [45,67],
    [45,71],
    [46,71],
    [46,66],
    [47,61],
    [47,60],
    [48,60],
    [48,54],
    [49,93],
    [49,88],
    [50,90],
    [50,93],
    [51,95],
    [51,92],
    [52,93],
    [52,94],
    [53,83],
    [53,90],
    [54,78],
    [54,79],
    [55,79],
    [55,92],
    [56,96],
    [56,94],
    [57,94],
    [57,80],
    [58,79],
    [58,83],
    [59,75],
    [59,96],
    [60,86],
    [60,79],
    [61,85],
    [61,75],
    [62,82],
    [62,95],
    [63,85],
    [63,78],
    [64,92],
    [64,86],
    [65,76],
    [65,78],
    [66,78],
    [66,81],
    [67,96],
    [67,78],
    [68,88],
    [68,77],
    [69,86],
    [69,90],
    [70,93],
    [70,80],
    [71,92],
    [71,74],
    [72,88],
    [72,81],
    [73,113],
    [73,116],
    [74,101],
    [74,100],
    [75,113],
    [75,109],
    [76,112],
    [76,98],
    [77,109],
    [77,108],
    [78,112],
    [78,117],
    [79,101],
    [79,110],
    [80,110],
    [80,119],
    [81,108],
    [81,98],
    [82,111],
    [82,113],
    [83,116],
    [83,111],
    [84,114],
    [84,103],
    [85,97],
    [85,114],
    [86,107],
    [86,120],
    [87,116],
    [87,105],
    [88,99],
    [88,105],
    [89,118],
    [89,110],
    [90,104],
    [90,108],
    [91,98],
    [91,106],
    [92,100],
    [92,108],
    [93,117],
    [93,114],
    [94,115],
    [94,118],
    [95,99],
    [95,108],
    [96,111],
    [96,98],
    [97,125],
    [97,132],
    [98,134],
    [98,131],
    [99,124],
    [99,136],
    [100,122],
    [100,129],
    [101,140],
    [101,125],
    [102,142],
    [102,137],
    [103,137],
    [103,141],
    [104,135],
    [104,132],
    [105,126],
    [105,137],
    [106,142],
    [106,128],
    [107,123],
    [107,143],
    [108,126],
    [108,132],
    [109,128],
    [109,130],
    [110,124],
    [110,136],
    [111,123],
    [111,141],
    [112,128],
    [112,142],
    [113,130],
    [113,128],
    [114,144],
    [114,139],
    [115,141],
    [115,139],
    [116,134],
    [116,126],
    [117,135],
    [117,131],
    [118,137],
    [118,142],
    [119,133],
    [119,125],
    [120,135],
    [120,139],
    [121,154],
    [121,151],
    [122,150],
    [122,156],
    [123,158],
    [123,168],
    [124,160],
    [124,168],
    [125,159],
    [125,161],
    [126,167],
    [126,156],
    [127,151],
    [127,167],
    [128,164],
    [128,152],
    [129,154],
    [129,158],
    [130,164],
    [130,150],
    [131,165],
    [131,155],
    [132,154],
    [132,157],
    [133,163],
    [133,161],
    [134,147],
    [134,160],
    [135,156],
    [135,148],
    [136,153],
    [136,157],
    [137,159],
    [137,152],
    [138,149],
    [138,152],
    [139,161],
    [139,157],
    [140,167],
    [140,161],
    [141,168],
    [141,145],
    [142,161],
    [142,160],
    [143,146],
    [143,150],
    [144,160],
    [144,163],
    [145,184],
    [145,171],
    [146,187],
    [146,171],
    [147,179],
    [147,182],
    [148,185],
    [148,180],
    [149,187],
    [149,174],
    [150,175],
    [150,190],
    [151,176],
    [151,185],
    [152,169],
    [152,182],
    [153,181],
    [153,188],
    [154,190],
    [154,179],
    [155,184],
    [155,187],
    [156,169],
    [156,184],
    [157,183],
    [157,186],
    [158,174],
    [158,179],
    [159,175],
    [159,172],
    [160,190],
    [160,189],
    [161,180],
    [161,175],
    [162,192],
    [162,182],
    [163,179],
    [163,175],
    [164,174],
    [164,181],
    [165,178],
    [165,185],
    [166,170],
    [166,169],
    [167,183],
    [167,178],
    [168,180],
    [168,181],
    [169,213],
    [169,207],
    [170,206],
    [170,203],
    [171,195],
    [171,209],
    [172,214],
    [172,197],
    [173,205],
    [173,206],
    [174,212],
    [174,214],
    [175,201],
    [175,204],
    [176,206],
    [176,200],
    [177,202],
    [177,207],
    [178,202],
    [178,203],
    [179,216],
    [179,196],
    [180,211],
    [180,197],
    [181,193],
    [181,207],
    [182,196],
    [182,194],
    [183,215],
    [183,199],
    [184,203],
    [184,204],
    [185,196],
    [185,208],
    [186,195],
    [186,212],
    [187,193],
    [187,194],
    [188,204],
    [188,200],
    [189,205],
    [189,201],
    [190,210],
    [190,194],
    [191,193],
    [191,209],
    [192,208],
    [192,209],
    [193,227],
    [193,223],
    [194,240],
    [194,227],
    [195,239],
    [195,230],
    [196,228],
    [196,230],
    [197,234],
    [197,221],
    [198,240],
    [198,222],
    [199,221],
    [199,235],
    [200,230],
    [200,235],
    [201,230],
    [201,225],
    [202,238],
    [202,217],
    [203,224],
    [203,217],
    [204,221],
    [204,234],
    [205,228],
    [205,217],
    [206,221],
    [206,230],
    [207,220],
    [207,240],
    [208,224],
    [208,219],
    [209,217],
    [209,237],
    [210,232],
    [210,239],
    [211,235],
    [211,223],
    [212,228],
    [212,220],
    [213,229],
    [213,234],
    [214,230],
    [214,228],
    [215,223],
    [215,219],
    [216,221],
    [216,240],
    [217,243],
    [217,256],
    [218,246],
    [218,252],
    [219,250],
    [219,247],
    [220,257],
    [220,243],
    [221,245],
    [221,261],
    [222,254],
    [222,245],
    [223,258],
    [223,252],
    [224,244],
    [224,242],
    [225,253],
    [225,250],
    [226,263],
    [226,248],
    [227,251],
    [227,262],
    [228,249],
    [228,248],
    [229,258],
    [229,257],
    [230,258],
    [230,256],
    [231,262],
    [231,254],
    [232,242],
    [232,251],
    [233,244],
    [233,257],
    [234,256],
    [234,260],
    [235,262],
    [235,253],
    [236,259],
    [236,264],
    [237,261],
    [237,242],
    [238,260],
    [238,243],
    [239,260],
    [239,246],
    [240,254],
    [240,263],
    [241,265],
    [241,269],
    [242,283],
    [242,267],
    [243,270],
    [243,288],
    [244,280],
    [244,278],
    [245,271],
    [245,287],
    [246,284],
    [246,277],
    [247,288],
    [247,281],
    [248,280],
    [248,277],
    [249,273],
    [249,270],
    [250,277],
    [250,270],
    [251,286],
    [251,280],
    [252,279],
    [252,268],
    [253,283],
    [253,279],
    [254,277],
    [254,276],
    [255,265],
    [255,285],
    [256,277],
    [256,276],
    [257,284],
    [257,283],
    [258,270],
    [258,271],
    [259,277],
    [259,279],
    [260,284],
    [260,268],
    [261,267],
    [261,279],
    [262,271],
    [262,279],
    [263,268],
    [263,273],
    [264,272],
    [264,277],
    [265,297],
    [265,300],
    [266,302],
    [266,304],
    [267,292],
    [267,308],
    [268,296],
    [268,307],
    [269,306],
    [269,304],
    [270,300],
    [270,308],
    [271,293],
    [271,291],
    [272,294],
    [272,305],
    [273,293],
    [273,291],
    [274,303],
    [274,312],
    [275,294],
    [275,299],
    [276,292],
    [276,305],
    [277,303],
    [277,299],
    [278,297],
    [278,302],
    [279,302],
    [279,294],
    [280,291],
    [280,289],
    [281,294],
    [281,307],
    [282,293],
    [282,296],
    [283,308],
    [283,294],
    [284,302],
    [284,310],
    [285,289],
    [285,308],
    [286,292],
    [286,307],
    [287,293],
    [287,295],
    [288,296],
    [288,292],
    [289,322],
    [289,331],
    [290,333],
    [290,313],
    [291,326],
    [291,314],
    [292,334],
    [292,317],
    [293,317],
    [293,315],
    [294,333],
    [294,331],
    [295,321],
    [295,335],
    [296,314],
    [296,322],
    [297,321],
    [297,322],
    [298,332],
    [298,316],
    [299,321],
    [299,330],
    [300,320],
    [300,315],
    [301,317],
    [301,326],
    [302,335],
    [302,318],
    [303,336],
    [303,325],
    [304,325],
    [304,322],
    [305,332],
    [305,321],
    [306,335],
    [306,325],
    [307,323],
    [307,326],
    [308,316],
    [308,320],
    [309,321],
    [309,336],
    [310,322],
    [310,328],
    [311,332],
    [311,335],
    [312,332],
    [312,322],
    [313,359],
    [313,347],
    [314,348],
    [314,349],
    [315,350],
    [315,352],
    [316,351],
    [316,342],
    [317,354],
    [317,349],
    [318,340],
    [318,358],
    [319,359],
    [319,339],
    [320,357],
    [320,355],
    [321,357],
    [321,341],
    [322,344],
    [322,355],
    [323,340],
    [323,338],
    [324,342],
    [324,356],
    [325,355],
    [325,342],
    [326,345],
    [326,353],
    [327,345],
    [327,339],
    [328,360],
    [328,356],
    [329,358],
    [329,351],
    [330,359],
    [330,353],
    [331,341],
    [331,356],
    [332,344],
    [332,339],
    [333,351],
    [333,355],
    [334,355],
    [334,359],
    [335,350],
    [335,339],
    [336,342],
    [336,354],
    [337,365],
    [337,374],
    [338,364],
    [338,384],
    [339,373],
    [339,375],
    [340,380],
    [340,368],
    [341,372],
    [341,362],
    [342,368],
    [342,367],
    [343,364],
    [343,369],
    [344,382],
    [344,373],
    [345,367],
    [345,375],
    [346,370],
    [346,372],
    [347,363],
    [347,381],
    [348,371],
    [348,365],
    [349,372],
    [349,364],
    [350,379],
    [350,372],
    [351,381],
    [351,364],
    [352,381],
    [352,362],
    [353,370],
    [353,377],
    [354,373],
    [354,362],
    [355,367],
    [355,382],
    [356,370],
    [356,384],
    [357,371],
    [357,372],
    [358,361],
    [358,378],
    [359,371],
    [359,366],
    [360,382],
    [360,364],
    [361,407],
    [361,408],
    [362,392],
    [362,393],
    [363,393],
    [363,394],
    [364,387],
    [364,400],
    [365,397],
    [365,392],
    [366,400],
    [366,408],
    [367,401],
    [367,388],
    [368,389],
    [368,394],
    [369,388],
    [369,399],
    [370,405],
    [370,385],
    [371,398],
    [371,397],
    [372,404],
    [372,387],
    [373,404],
    [373,390],
    [374,396],
    [374,397],
    [375,401],
    [375,397],
    [376,399],
    [376,395],
    [377,397],
    [377,391],
    [378,392],
    [378,385],
    [379,390],
    [379,386],
    [380,408],
    [380,394],
    [381,398],
    [381,403],
    [382,385],
    [382,403],
    [383,385],
    [383,386],
    [384,397],
    [384,387],
    [385,418],
    [385,429],
    [386,419],
    [386,415],
    [387,413],
    [387,429],
    [388,415],
    [388,418],
    [389,429],
    [389,417],
    [390,417],
    [390,424],
    [391,409],
    [391,425],
    [392,418],
    [392,409],
    [393,428],
    [393,414],
    [394,427],
    [394,431],
    [395,429],
    [395,430],
    [396,418],
    [396,419],
    [397,432],
    [397,419],
    [398,420],
    [398,414],
    [399,419],
    [399,412],
    [400,415],
    [400,410],
    [401,420],
    [401,424],
    [402,426],
    [402,412],
    [403,431],
    [403,419],
    [404,428],
    [404,422],
    [405,417],
    [405,428],
    [406,422],
    [406,411],
    [407,424],
    [407,427],
    [408,410],
    [408,416],
    [409,436],
    [409,435],
    [410,442],
    [410,439],
    [411,456],
    [411,436],
    [412,449],
    [412,456],
    [413,453],
    [413,449],
    [414,440],
    [414,434],
    [415,436],
    [415,437],
    [416,433],
    [416,452],
    [417,433],
    [417,444],
    [418,436],
    [418,452],
    [419,445],
    [419,444],
    [420,451],
    [420,455],
    [421,439],
    [421,455],
    [422,445],
    [422,454],
    [423,456],
    [423,445],
    [424,445],
    [424,448],
    [425,434],
    [425,448],
    [426,442],
    [426,440],
    [427,437],
    [427,438],
    [428,453],
    [428,446],
    [429,437],
    [429,452],
    [430,444],
    [430,438],
    [431,449],
    [431,443],
    [432,442],
    [432,450],
    [433,469],
    [433,476],
    [434,476],
    [434,479],
    [435,478],
    [435,461],
    [436,467],
    [436,471],
    [437,479],
    [437,468],
    [438,474],
    [438,467],
    [439,459],
    [439,473],
    [440,458],
    [440,459],
    [441,467],
    [441,458],
    [442,470],
    [442,472],
    [443,477],
    [443,460],
    [444,475],
    [444,474],
    [445,471],
    [445,480],
    [446,477],
    [446,474],
    [447,472],
    [447,476],
    [448,469],
    [448,474],
    [449,465],
    [449,471],
    [450,465],
    [450,459],
    [451,458],
    [451,475],
    [452,457],
    [452,462],
    [453,478],
    [453,459],
    [454,472],
    [454,461],
    [455,469],
    [455,479],
    [456,457],
    [456,458],
    [457,482],
    [457,500],
    [458,492],
    [458,488],
    [459,488],
    [459,489],
    [460,483],
    [460,500],
    [461,504],
    [461,486],
    [462,491],
    [462,492],
    [463,499],
    [463,493],
    [464,483],
    [464,502],
    [465,495],
    [465,502],
    [466,483],
    [466,487],
    [467,491],
    [467,503],
    [468,492],
    [468,498],
    [469,501],
    [469,504],
    [470,484],
    [470,487],
    [471,502],
    [471,487],
    [472,499],
    [472,490],
    [473,500],
    [473,495],
    [474,481],
    [474,487],
    [475,488],
    [475,494],
    [476,488],
    [476,500],
    [477,492],
    [477,489],
    [478,504],
    [478,481],
    [479,502],
    [479,491],
    [480,497],
    [480,487],
    [481,528],
    [481,522],
    [482,522],
    [482,520],
    [483,516],
    [483,515],
    [484,526],
    [484,514],
    [485,511],
    [485,508],
    [486,512],
    [486,524],
    [487,525],
    [487,520],
    [488,508],
    [488,520],
    [489,526],
    [489,527],
    [490,517],
    [490,505],
    [491,514],
    [491,512],
    [492,524],
    [492,522],
    [493,524],
    [493,517],
    [494,520],
    [494,518],
    [495,516],
    [495,508],
    [496,508],
    [496,525],
    [497,523],
    [497,505],
    [498,507],
    [498,505],
    [499,510],
    [499,523],
    [500,522],
    [500,518],
    [501,511],
    [501,517],
    [502,506],
    [502,513],
    [503,505],
    [503,514],
    [504,525],
    [504,519],
    [505,547],
    [505,534],
    [506,551],
    [506,538],
    [507,538],
    [507,530],
    [508,551],
    [508,544],
    [509,550],
    [509,551],
    [510,529],
    [510,539],
    [511,544],
    [511,549],
    [512,543],
    [512,549],
    [513,540],
    [513,533],
    [514,551],
    [514,550],
    [515,536],
    [515,547],
    [516,544],
    [516,531],
    [517,535],
    [517,549],
    [518,546],
    [518,542],
    [519,537],
    [519,547],
    [520,547],
    [520,544],
    [521,531],
    [521,544],
    [522,533],
    [522,530],
    [523,538],
    [523,546],
    [524,541],
    [524,531],
    [525,530],
    [525,533],
    [526,530],
    [526,529],
    [527,550],
    [527,529],
    [528,541],
    [528,534],
    [529,564],
    [529,574],
    [530,554],
    [530,564],
    [531,564],
    [531,556],
    [532,569],
    [532,554],
    [533,561],
    [533,566],
    [534,565],
    [534,576],
    [535,570],
    [535,558],
    [536,572],
    [536,571],
    [537,555],
    [537,569],
    [538,564],
    [538,555],
    [539,558],
    [539,566],
    [540,571],
    [540,576],
    [541,567],
    [541,561],
    [542,573],
    [542,570],
    [543,576],
    [543,565],
    [544,572],
    [544,565],
    [545,553],
    [545,554],
    [546,556],
    [546,574],
    [547,553],
    [547,575],
    [548,571],
    [548,573],
    [549,556],
    [549,574],
    [550,575],
    [550,555],
    [551,558],
    [551,569],
    [552,569],
    [552,564]]);
/*
// Non-trivial answers: ['evelyn','dorothy'],['ann', 'bertrand'],
const cyl: Predicate = new EdbPredicate([
    ['dorothy','george'],
    ['evelyn', 'george'],
    ['bertrand','dorothy'],
    ['ann','dorothy'],
    ['hilary','ann'],
    ['charles','everlyn']]);
*/

const sg: Predicate = new TabledPredicate(([X, Y]) => rule(
    [0, () => [unify(X, Y)]],
    [1, Z  => [cyl.consume([X, Z]), sg.consume([Z, Z]), cyl.consume([Y, Z])]]));

const sched = new TopLevelScheduler();
// runLP(sched, fresh(2, (l, r) => seq(append.consume([l, r, list(1,2,3,4,5)]), ground([l, r]))), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path2.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path3.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(path4.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
// runLP(sched, r.consume(null), a => console.log('completed'));
// runLP(sched, p.consume(null), a => console.log('completed'));
runLP(sched, fresh(2, (s, e) => { const row = [s,e]; return seq(sg.consume(row), ground(row)); }), a => console.dir(a, {depth: null}));
sched.execute();
})();

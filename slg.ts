import { Json, JsonTerm, Variable, Substitution, groundJson, looseUnifyJson, unifyJson, refreshJson } from "./unify"
import { VarMap, JsonTrie, JsonTrieTerm } from "./json-trie"

interface GlobalEnvironment {
    generatorCount: number;
    topOfCompletionStack: Generator | null;
    // DEBUG
    sdgEdges: Array<[number, number]>;
}

interface Scheduler {
    push(process: () => void): void;
    dependOn(gen: Generator): void;
    readonly globalEnv: GlobalEnvironment;
}

class TopLevelScheduler implements Scheduler {
    private processes: Queue<() => void> = [];
    readonly globalEnv: GlobalEnvironment = {generatorCount: 0, topOfCompletionStack: null, sdgEdges: []};
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

/**
 * A `void`-valued continuation monad.
 */
type CPS<A> = (k: (value: A) => void) => void;

/**
 * A monad for logic programming given `V`-valued [[Substitution]]s and returning `A`s.
 * 
 * Conceptually, this *should* be something like Haskell's: `ReaderT Scheduler (StateT (Substitution v) (Cont () a))`
 * but what it *actually* is is: `ReaderT Scheduler (ReaderT (Substitution v) (Cont () a))`. However,
 * `a = Substitution v` in the latter, corresponds to `a = ()` in the former. Most of the time, this latter view
 * is what's being implicitly taken, but occasionally the extra flexibility is used. `seq` is the monadic bind
 * restricted to the case where the first argument has `()` return type.
 */
export type LP<V, A> = (scheduler: Scheduler) => (sub: Substitution<V>) => CPS<A>;

type LPSub<V> = LP<V, Substitution<V>>;

/**
 * The type of a typical monadic computation corresponding to, in Haskell syntax, `M ()` for a suitable monad `M`.
 * See [[LP]]. The point is that `LPTerm` corresponds to a logic programming computation on [[JsonTerm]]s.
 */
export type LPTerm = LP<JsonTerm, Substitution<JsonTerm>>;

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

    private processes: Queue<() => void> | null = [];
    // We check for completion whenever this queue is empty.
    
    private consumers: Array<[number, (cs: Array<JsonTerm>) => void]> | null = [];
    private negativeConsumers: Array<() => void> | null = [];

    private readonly table: Array<Array<JsonTerm>> = [];
    // NOTE: We could have the answerSet store nodes of a linked list which could be traversed
    // by the answer iterators, and that would mean we wouldn't need the table, but I don't think
    // that will really make much difference in time or space, nor is it clear that it is a good
    // trade-off. If there was an easy way to avoid needing to store the answer as an array in
    // the nodes, then it would be worth it. In the "Efficient Access Mechanisms for Tabled Logic
    // Programs" paper, they have parent pointers in the answer trie (but not the subgoal trie)
    // that allow this.
    private answerSet: JsonTrieTerm<boolean> | null = JsonTrieTerm.create();

    constructor(scheduler: Scheduler) {
        const gEnv = this.globalEnv = scheduler.globalEnv;
        this.selfId = gEnv.generatorCount++;
        this.directLink = this.selfId;
        this.prevGenerator = gEnv.topOfCompletionStack;
        gEnv.topOfCompletionStack = this;
    }

    dependOn(v: Generator): void {
        this.directLink = Math.min(this.directLink, v.directLink);
        // DEBUG
        this.globalEnv.sdgEdges.push([this.selfId, v.selfId]);
    }

    consume(k: (cs: Array<JsonTerm>) => void): void {
        if(this.isComplete) {
            const answers = this.table;
            const len = answers.length;
            for(let i = 0; i < len; ++i) {
                k(answers[i]);
            }
        } else {
            const cs = <Array<[number, (cs: Array<JsonTerm>) => void]>>this.consumers;
            cs.push([0, k]);
        }
    }

    consumeNegatively(k: () => void): void {
        if(this.isComplete) {
            if(this.table.length === 0) k();
        } else {
            const cs = <Array<() => void>>this.negativeConsumers;
            cs.push(k);
        }
    }

    private scheduleAnswers(consumer: [number, (cs: Array<JsonTerm>) => void]): boolean {
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
        let prev = this.prevGenerator;
        while(prev !== null && prev.isComplete) { prev = prev.prevGenerator; }
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
        const cs = <Array<[number, (cs: Array<JsonTerm>) => void]>>this.consumers;
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
            let anyNegativeConsumers = false;
            for(let i = len - 1; i >= 0; --i) { // this loop corresponds to fixpoint_check.
                const gen = cStack[i];
                if(gen.scheduleResumes()) { continue completionLoop; }
                if((<Array<() => void>>gen.negativeConsumers).length !== 0) anyNegativeConsumers = true;
            }
            if(anyNegativeConsumers) {
                // TODO: Do any exact SCC check and complete those. Unlink them if it is easy.
                // The program is not LRD-stratified if any generators in the exact SCC negatively
                // depend on any others in the SCC.
            } else {
                const prev = this.prevGenerator;
                for(let i = len - 1; i >= 0; --i) {
                    const gen = cStack[i];
                    gen.complete();
                    gen.negativeConsumers = null; // It was empty anyway.
                    gen.prevGenerator = null;
                }
                this.globalEnv.topOfCompletionStack = prev;
                return;
            }
        }
    }

    execute(): void {
        let waiter = (<Array<() => void>>this.processes).pop();
        while(waiter !== void(0)) { 
            waiter(); 
            if(this.processes === null) return; // We're already complete.
            waiter = this.processes.pop(); 
        }
        this.checkCompletion();
    }

    private complete(): void {
        this.processes = null;
        this.consumers = null;
        this.answerSet = null;
    }

    private scheduleNegativeResumes(): void {
        if(this.table.length === 0) {
            const ncs = (<Array<() => void>>this.negativeConsumers);
            const len = ncs.length;
            for(let i = 0; i < len; ++i) {
                ncs[i]();
            }
        }
        this.negativeConsumers = null;
    }

    get isComplete(): boolean { return this.answerSet === null; }

    static create<V>(body: LPTerm, sched: Scheduler, count: number, s0: Substitution<JsonTerm>): Generator {
        const gen = new Generator(sched);
        gen.push(() => body(gen)(s0)(s => gen.insertAnswer(count, s)));
        return gen;
    }

    private insertAnswer(count: number, sub: Substitution<JsonTerm>): void {
        if(count === 0) { 
            if(this.table.length === 0) { 
                this.table.push([]);
                this.scheduleResumes(); // TODO: Is this correct? We do need to notify consumers due to the early completion.
                this.complete();
                this.scheduleNegativeResumes();
            } // else, do nothing, we've already completed
        } else {
            // TODO: Early completion. Early completion occurs when an answer is a variant of the goal. Checking this just means
            // that the answer tuple consists of nothing but distinct variables. In such a case, we can clear this.processes.
            // An LRD-stratified program that requires early completion:
            // a :- b, not c. b :- a;d. b. c :- not d. d :- b, e. ?- a.
            // That said, early completion is only *necessary* when there's negation, which for SLG is restricted to applying to
            // (dynamically) ground literals, i.e. count === 0. So the early completion check can be restricted to ground goals at 
            // which point *any* answer entails an early completion.
            const answer = new Array<JsonTerm>(count);
            for(let i = 0; i < count; ++i) {
                answer[i] = groundJson(sub.lookupById(i), sub);
            }
            (<JsonTrieTerm<boolean>>this.answerSet).modify(answer, exists => { if(!exists) { this.table.push(answer); }; return true; });
        }
    }
}

/**
 * A predicate on [[JsonTerm]]s, or conceptually equivalently, a (multi-)set of [[JsonTerm]]s.
 */
export interface Predicate {    
    /**
     * Produces a computation which succeeds if `row` matches an entry in the extension of the predicate.
     * @param row The [[JsonTerm]] to match against.
     * @returns A computation which succeeds for each way of binding the free variables of `row`
     * consistent with the predicate.
     */
    match(row: JsonTerm): LPTerm;
    // notMatch(row: JsonTerm): LPTerm;
}

/**
 * A predicate representing a fixed set of data stored as a [[JsonTrie]]. This is
 * a form of indexing.
 */
export class TrieEdbPredicate implements Predicate {
    /**
     * This just inserts the data into a trie and returns a predicate built upon it.
     * This will thus inherently eliminate duplicates.
     * @param rows The data to load.
     * @returns A [[Predicate]] backed by a [[JsonTrie]] representing the data in `row`.
     */
    static fromArray(rows: Array<Json>): TrieEdbPredicate {
        const trie = JsonTrie.create<null>();
        const len = rows.length;
        for(let i = 0; i < len; ++i) {
            trie.insert(rows[i], null);
        }
        return new TrieEdbPredicate(trie);
    }

    /**
     * Uses `trie` as the backing store without copying.
     * @param trie The backing store.
     * @returns A [[Predicate]] backed by `trie`.
     */
    static fromJsonTrie(trie: JsonTrie<any>): TrieEdbPredicate {
        return new TrieEdbPredicate(trie);
    }

    constructor(private readonly trie: JsonTrie<any>) {}

    match(row: JsonTerm): LPTerm {
        return gen => s => k => {
            for(let s2 of this.trie.match(row, s)) {
                k(s2);
            }
        };
    }

    /**
     * Produces an computation that fails if `row` matches any entry in the predicate, and
     * succeeds otherwise without binding anything. This *should* be efficient, only
     * requiring a single pass over `row` to determine if there is a match or not.
     * @param row The [[JsonTerm]] to match against.
     * @return A computation succeeding only if `row` is **not** in the extension of the predicate.
     */
    notMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            for(let s2 of this.trie.match(row, s)) {
                return;
            }
            k(s);
        };
    }
}

/**
 * A predicate representing a fixed set of data stored as an array.
 */
export class EdbPredicate implements Predicate {
    constructor(private readonly table: Array<Json>) {}

    match(row: JsonTerm): LPTerm {
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = unifyJson(row, arr[i], s); // TODO: This could be simplified to a "matchJson" if we assume the table contains only ground terms.
                if(s2 !== null) k(s2);
            }
        };
    }

    /**
     * Produces a computation which succeeds for each entry in the extension of the predicate which `row` loosely unifies with.
     * See [[looseUnifyJson]]. That is, it iterates over the backing array doing `looseUnifyJson(row, entry)`.
     * @param row The row to loosely match against.
     * @returns A computation which succeeds for each way of binding the free variables of `row`
     * loosely consistent with the predicate.
     */
    looseMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = looseUnifyJson(row, arr[i], s); // TODO: This could be simplified to a "looseMatchJson" if we assume the table contains only ground terms.
                if(s2 !== null) k(s2);
            }
        };
    }

    /**
     * Produces an computation that fails if `row` matches any entry in the predicate, and
     * succeeds otherwise without binding anything. This simply iterates over the backing
     * array attempting to unify with each entry until it finds a match, in which case it
     * fails, or reaches the end of the array, in which case it succeeds.
     * @param row The [[JsonTerm]] to match against.
     * @return A computation succeeding only if `row` is **not** in the extension of the predicate.
     */
    notMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = unifyJson(arr[i], row, s); // TODO: See above.
                if(s2 !== null) return;
            }
            return k(s);
        };
    }
}

/**
 * An untabled predicate defined by a rule. In SLG terms, it evaluates via Program Clause Resolution.
 * Operationally, it's just a wrapper around a [[JsonTerm]] to [[LPTerm]] function. The hard work is
 * done by the operations which build [[LPTerm]]s. This works exactly like normal Prolog execution with
 * all the pitfalls that implies, e.g. infinite loops in left recursion.
 */
export class UntabledPredicate implements Predicate {
    constructor(private readonly body: (row: JsonTerm) => LPTerm) { }

    match(row: JsonTerm): LPTerm {
        return this.body(row);
    }
}

/**
 * A (variant-based) tabled predicate defined by a rule. Roughly, execution proceeds like normal
 * Prolog except that we store the answers in a table and if we see an answer we've seen before
 * (i.e. a variant of one we've seen before, see [[JsonTrieTerm]]), we return the result from the
 * table rather than recalculate it. This allows us to break loops and stop when we reach a fixed
 * point.
 *
 * Indeed, left-recursive code is ideal for a tabled predicate, whereas for an untabled predicate
 * it is guaranteed to loop forever. Similarly, any Datalog program will terminate and execute
 * with roughly comparable efficiency if all predicates are tabled. (In practice, a mixture of
 * tabled and untabled execution is ideal for performance, and relatively few predicates need to
 * be tabled to guarantee termination.)
 */
export class TabledPredicate implements Predicate {
    private readonly generators: JsonTrieTerm<Generator> = JsonTrieTerm.create();
    constructor(private readonly body: (row: JsonTerm) => LPTerm) { }

    private getGenerator(row: JsonTerm, sched: Scheduler): [Generator, Array<Variable>, boolean] {
        let vs: any = null;
        let isNew = false;
        const g = this.generators.modifyWithVars(row, (gen, varMap: VarMap) => {
            vs = varMap.vars;
            if(gen === void(0)) {
                const t = refreshJson(row, Substitution.emptyPersistent()); 
                isNew = true;
                return Generator.create(this.body(t[0]), sched, vs.length, t[1]);
            } else {
                return gen;
            }
        });
        return [g, vs, isNew];
    }

    match(row: JsonTerm): LPTerm {
        return gen => s => k => {
            // TODO: Can I add back the groundingModifyWithVars to eliminate this groundJson?
            const t = this.getGenerator(groundJson(row, s), gen);
            const generator = t[0];
            const vs = t[1];
            const isNew = t[2];
            gen.dependOn(generator);
            const len = vs.length;
            generator.consume(cs => {
                // const [cs2, s2] = refreshJson(cs, s, vs); // TODO: Combine these or something.
                // const s3 = <Substitution<JsonTerm>>unifyJson(vs, cs2, s2);
                // k(s3);
                let s2 = s;
                for(let i = 0; i < len; ++i) {
                    const t = refreshJson(cs[i], s2, vs); 
                    s2 = t[1]; 
                    cs[i] = t[0];
                }
                for(let i = 0; i < len; ++i) {
                    s2 = <Substitution<JsonTerm>>unifyJson(vs[i], cs[i], s2);
                }
                k(s2);
            });
            if(isNew) generator.execute();
        };
    }

    /*
    notMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            // TODO: Can I add back the groundingModifyWithVars to eliminate this groundJson?
            const t = this.getGenerator(groundJson(row, s), gen);
            const generator = t[0];
            const vs = t[1];
            const isNew = t[2];
            gen.dependNegativelyOn(generator);
            if(vs.length !== 0) throw new Error('TabledPredicate.notMatch: negation of non-ground atom');
            generator.consumeNegatively(() => k(s));
            if(isNew) generator.execute();
        };
    }
    */
}

/**
 * Sequences two computations. See the discussion at [[LP]].
 * If `A = Substitution<V>`, this is essentially `conj(m1, m2)`.
 */
export function seq<V, A>(m1: LPSub<V>, m2: LP<V, A>): LP<V, A> {
    return gen => s => k => m1(gen)(s)(s => m2(gen)(s)(k))
}

function ground(val: JsonTerm): LP<JsonTerm, JsonTerm> {
    return gen => s => k => k(groundJson(val, s));
}

/**
 * A computation that succeeds if all of its arguments do. That is, the conjunction.
 */
export function conj<V>(...cs: Array<LPSub<V>>): LPSub<V> {
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

/**
 * A computation that succeeds if any of its arguments do. That is, the disjunction.
 */
export function disj<V>(...ds: Array<LPSub<V>>): LPSub<V> {
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

/**
 * A computation which produces `count` fresh variables and passes them to `body`.
 */
export function freshN<V, A>(count: number, body: (...vs: Array<Variable>) => LP<V, A>): LP<V, A> {
    return gen => s => k => {
        const t = s.fresh(count);
        return body.apply(null, t[0])(gen)(t[1])(k);
    };
}

/**
 * By definition, `freshN(body.length, body)`. This means it determines the number of variables
 * to produce based on the arity of `body` which therefore must be fixed (i.e. no rest parameters
 * or `arguments` shenanigans).
 */
export function fresh<V, A>(body: (...vs: Array<Variable>) => LP<V, A>): LP<V, A> {
    return freshN(body.length, body);
}

/**
 * A computation which produces `count` fresh variables and passes them to the conjunction of `body`.
 */
export function clauseN<V>(count: number, body: (...vs: Array<Variable>) => Array<LPSub<V>>): LPSub<V> {
    return gen => s => k => {
        const t = s.fresh(count);
        return conj.apply(null, body.apply(null, t[0]))(gen)(t[1])(k);
    };
}

/**
 * By definition, `clauseN(body.length, body)`. This means it determines the number of variables
 * to produce based on the arity of `body` which therefore must be fixed (i.e. no rest parameters
 * or `arguments` shenanigans).
 */
export function clause<V>(body: (...vs: Array<Variable>) => Array<LPSub<V>>): LPSub<V> {
    return clauseN(body.length, body);
}

/**
 * A computation that succeeds if `unifyJson(x, y)` does.
 * See [[unifyJson]].
 */
export function unify(x: JsonTerm, y: JsonTerm): LPTerm {
    return gen => s => k => {
        const s2 = unifyJson(x, y, s);
        if(s2 !== null) {
            return k(s2);
        }
    };
}

/**
 * A computation that succeeds if `looseUnifyJson(x, y)` does.
 * See [[looseUnifyJson]].
 */
export function looseUnify(x: JsonTerm, y: JsonTerm): LPTerm {
    return gen => s => k => {
        const s2 = looseUnifyJson(x, y, s);
        if(s2 !== null) {
            return k(s2);
        }
    };
}

/**
 * A [[disj]]unction of [[clause]]s. The result looks roughly like a Prolog-style rule, e.g.
 * ```
 * const append: Predicate = new UntabledPredicate(([Xs, Ys, Zs]: JsonTerm) => rule(
 *     () =>
 *         [unify([], Xs), unify(Ys, Zs)],
 *     (X1, Xs1, Zs1) =>  
 *         [unify([X1, Xs1], Xs), unify([X1, Zs1], Zs), append.match([Xs1, Ys, Zs1])]));
 * ```
 * corresponds to the Prolog rule:
 * ```
 * append(Xs, Ys, Zs) :- [] = Xs, Ys = Zs.
 * append(Xs, Ys, Zs) :- [X1, Xs1] = Xs, [X1, Zs1] = Zs, append(Xs1, Ys, Zs1).
 * ```
 */
export function rule<V>(...alternatives: Array<(...vs: Array<Variable>) => Array<LPSub<V>>>): LPSub<V> {
    return disj.apply(null, alternatives.map(cs => clauseN(cs.length, (...vs) => cs.apply(null, vs))));
}

function runLP<V, A>(sched: Scheduler, m: LP<V, A>, k: (a: A) => void): void {
    return sched.push(() => m(sched)(Substitution.emptyPersistent())(k));
}

/**
 * Runs an [[LP]] computation `m` calling `k` each time it succeeds.
 */
function run<V, A>(m: LP<V, A>, k: (a: A) => void): void {
    const sched = new TopLevelScheduler();
    runLP(sched, m, k);
    sched.execute();
}

/**
 * Runs an [[LP]] computation `body` passing it a fresh logic variable and calls `k` with
 * the [[ground]]ing of that variable each time `body` succeeds.
 */
export function runQ(body: (q: Variable) => LPTerm, k: (a: JsonTerm) => void): void {
    run(fresh(Q => seq(body(Q), ground(Q))), k);
}

function toArray<V, A>(m: LP<V, A>): Array<A> {
    const result: Array<A> = [];
    run(m, a => result.push(a));
    return result;
}

/**
 * Runs an [[LP]] computation `body` passing it a fresh logic variable and collects
 * the result of [[ground]]ing of that variable each time `body` succeeds into an array.
 * @returns An array of ground [[JsonTerm]]s representing all successful results of `body`.
 */
export function toArrayQ(body: (q: Variable) => LPTerm): Array<JsonTerm> {
    const results: Array<JsonTerm> = [];
    runQ(body, a => results.push(a));
    return results;
}

// DEBUG
export function debugRunQ(body: (q: Variable) => LPTerm, k: (a: JsonTerm) => void): Array<[number, number]> {
    const sched = new TopLevelScheduler();
    runLP(sched, fresh(Q => seq(body(Q), ground(Q))), k);
    sched.execute();
    return sched.globalEnv.sdgEdges;
}
export function debugToArrayQ(body: (q: Variable) => LPTerm): [Array<[number, number]>, Array<JsonTerm>] {
    const results: Array<JsonTerm> = [];
    const sdgEdges = debugRunQ(body, a => results.push(a));
    return [sdgEdges, results];
}

/*
// Fluent wrapper
export default function term(t: JsonTerm): TermWrapper { return new TermWrapper(t); }

class LPWrapper<V> {
    constructor(private readonly body: LPSub<V>, private readonly alts: Array<LPSub<V>> = []) {}
    and(rest: LPSub<V>): LPWrapper<V> { return new LPWrapper(seq(this.body, rest), this.alts); }
    or(rest: LPSub<V>): LPWrapper<V> {
        const newAlts = this.alts.slice();
        newAlts.push(this.body);
        return new LPWrapper(rest, newAlts);
    }
    to(q: Variable): LPTerm {
        const newAlts = this.alts.slice();
        newAlts.push(seq(this.body, ground(q)));
        return disj.apply(null, newAlts);
    }
}

class TermWrapper {
    constructor(private readonly term: JsonTerm) {}
    is(t: JsonTerm): LPWrapper<JsonTerm> { return new LPWrapper(unify(this.term, t)); }
    isLoosely(t: JsonTerm): LPWrapper<JsonTerm> { return new LPWrapper(looseUnify(this.term, t)); }
    isIn(pred: Predicate): LPWrapper<JsonTerm> { return new LPWrapper(pred.match(this.term)); }
    isLooselyIn(pred: EdbPredicate): LPWrapper<JsonTerm> { return new LPWrapper(pred.looseMatch(this.term)); }
    ground(): LP<JsonTerm, JsonTerm> { return ground(this.term); }
}
*/

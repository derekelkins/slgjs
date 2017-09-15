import { Json, JsonTerm, Variable, Substitution, 
         groundJson, completelyGroundJson, looseUnifyJson, unifyJson, matchJson, looseMatchJson, refreshJson } from "./unify"
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
    dependNegativelyOn(gen: Generator): void;
    readonly globalEnv: GlobalEnvironment;
}

class TopLevelScheduler implements Scheduler {
    private processes: Queue<() => void> = [];
    readonly globalEnv: GlobalEnvironment = {generatorCount: 0, topOfCompletionStack: null, sdgEdges: []};
    constructor() { }
    
    push(process: () => void): void {
        this.processes.push(process);
    }

    execute(): void { // TODO: Maybe don't use pop here.
        const waiters = <Array<() => void>>this.processes;
        let waiter = waiters.pop();
        while(waiter !== void(0)) { waiter(); waiter = waiters.pop(); }
    }

    dependOn(gen: Generator): void { } // Don't need to do anything.

    dependNegativelyOn(gen: Generator): void { } // Don't need to do anything.
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
    private completionListeners: Array<() => void> | null = [];
    private successors: {[index: number]: Generator} | null = {};
    private negativeSuccessors: {[index: number]: Generator} | null = {};

    // These are for Tarjan's algorithm.
    private sccIndex: number = -1;
    private sccLowLink: number = -1;
    private onSccStack: boolean = false;

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
        if(this.isComplete) return;
        this.directLink = Math.min(this.directLink, v.directLink);
        (<{[index: number]: Generator}>this.successors)[v.selfId] = v;
        // DEBUG
        this.globalEnv.sdgEdges.push([this.selfId, v.selfId]);
    }

    dependNegativelyOn(v: Generator): void {
        if(this.isComplete) return;
        this.directLink = Math.min(this.directLink, v.directLink);
        (<{[index: number]: Generator}>this.negativeSuccessors)[v.selfId] = v;
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
            (<Array<[number, (cs: Array<JsonTerm>) => void]>>this.consumers).push([0, k]);
        }
    }

    consumeNegatively(k: () => void): void {
        if(this.isComplete) {
            if(this.table.length === 0) k();
        } else {
            (<Array<() => void>>this.completionListeners).push(() => this.table.length === 0 ? k() : void(0));
        }
    }

    consumeToCompletion(k: (cs: Array<JsonTerm>) => void, onComplete: () => void): void {
        if(this.isComplete) {
            const answers = this.table;
            const len = answers.length;
            for(let i = 0; i < len; ++i) {
                k(answers[i]);
            }
            onComplete();
        } else {
            (<Array<[number, (cs: Array<JsonTerm>) => void]>>this.consumers).push([0, k]);
            (<Array<() => void>>this.completionListeners).push(onComplete);
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

    private isLeader(): Array<Generator> | null {
        let prev = this.prevGenerator;
        while(prev !== null && prev.isComplete) { 
            const p = prev.prevGenerator;
            prev.prevGenerator = null;
            prev = p;
        }
        this.prevGenerator = prev;
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
        return prev === null || prev.selfId < Math.min(this.directLink, minLink) ? result : null;
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
    
    // The following is LRD-stratified, but if p is changed to 
    //      p :- not s, not r, q. 
    // it ceases to be, though it's still dynamically stratified:
    //
    // p :- q, not r, not s.
    // q :- r, not p.
    // r :- p, not q.
    // s :- not p, not q, not r.
    //
    // ?- s. succeeds, but in the non-LRD-stratified version, we'd
    // get s blocked on not s  in p which, if we completed without
    // considering the literals following not s would incorrectly
    // determine s to be false.

    // This iterates through the SCCs in reverse topological order.
    // As each SCC is found, all the generators are completed and then
    // all their negative consumers are notified as appropriate. **If**
    // the program isn't LRD-stratified, when the the negative consumers
    // are woken up, some will proceed to wake up subgoals that we just
    // completed, and possibly produce answers even though we just failed
    // them.
    private static completeScc(gen: Generator): void {
        let index = 0;
        const stack: Array<Generator> = [];

        const scc = (g: Generator) => {
            g.sccIndex = g.sccLowLink = index++;
            stack.push(g);
            g.onSccStack = true;

            const negSuccs = <{[index: number]: Generator}>g.negativeSuccessors;
            for(const k in negSuccs) {
                const w = negSuccs[k];
                if(w.sccIndex === -1 && !w.isComplete) {
                    scc(w);
                    g.sccLowLink = Math.min(g.sccLowLink, w.sccLowLink);
                } else if(w.onSccStack) {
                    g.sccLowLink = Math.min(g.sccLowLink, w.sccIndex);
                } // else already visited and assigned to a different SCC
            }
            const succs = <{[index: number]: Generator}>g.successors;
            for(const k in succs) {
                const w = succs[k];
                if(w.sccIndex === -1 && !w.isComplete) {
                    scc(w);
                    g.sccLowLink = Math.min(g.sccLowLink, w.sccLowLink);
                } else if(w.onSccStack) {
                    g.sccLowLink = Math.min(g.sccLowLink, w.sccIndex);
                } // else already visited and assigned to a different SCC
            }

            if(g.sccLowLink === g.sccIndex) {
                const sccLen = stack.length;
                let i = sccLen - 1;
                for(let gen = stack[i]; gen !== g; gen = stack[--i]) {
                    gen.onSccStack = false;
                    gen.complete();
                    gen.prevGenerator = null;
                }
                g.onSccStack = false;
                g.complete();
                g.prevGenerator = null;
                // TODO: Can we combine these loops? I think it's fine for
                // LRD-stratified programs, but it may make it harder to 
                // detect violations of LRD-stratification. If we can
                // combine these loops, we can just move the body of
                // scheduleNegativeResumes into complete (at a slight
                // cost to cases that don't involve negation).
                for(let j = i; j < sccLen; ++j) {
                    stack[j].scheduleNegativeResumes();
                }

                stack.length = i;
            }
        };
        scc(gen);
    }

    private checkCompletion(): void {
        if(this.isComplete) return;
        completionLoop:
        while(true) {
            const cStack = this.isLeader();
            if(cStack === null) return;
            const len = cStack.length;
            let anyNegativeConsumers = false;
            for(let i = len - 1; i >= 0; --i) { // this loop corresponds to fixpoint_check.
                const gen = cStack[i];
                if(gen.scheduleResumes()) { continue completionLoop; }
                if((<Array<() => void>>gen.completionListeners).length !== 0) anyNegativeConsumers = true;
            }
            if(anyNegativeConsumers) {
                // TODO: Do any exact SCC check and complete those. Unlink them if it is easy.
                // The program is not LRD-stratified if any generators in the exact SCC negatively
                // depend on any others in the SCC.
                const prev = this.prevGenerator;
                Generator.completeScc(this);
                this.globalEnv.topOfCompletionStack = prev;
                return;
            } else {
                const prev = this.prevGenerator;
                for(let i = len - 1; i >= 0; --i) {
                    const gen = cStack[i];
                    gen.complete();
                    gen.completionListeners = null; // It was empty anyway.
                    gen.prevGenerator = null;
                }
                this.globalEnv.topOfCompletionStack = prev;
                return;
            }
        }
    }

    execute(): void { // TODO: Maybe don't use pop on this.
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
        this.successors = null;
        this.negativeSuccessors = null;
    }

    private scheduleNegativeResumes(): void {
        // NOTE: Each completionListener corresponding to a negation will
        // individually check (redundantly) that the table is empty before
        // notifying the listener. Aggregates just want to know when the
        // table is complete regardless of whether the table is empty or
        // not, so this lets approach lets them know.
        const ncs = this.completionListeners;
        if(ncs === null) return; // This has already been called.
        const len = ncs.length;
        for(let i = 0; i < len; ++i) {
            ncs[i]();
        }
        this.completionListeners = null;
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

    /*
     * Applies a function to each resulting term which are required to have no unbound variables,
     * otherwise an exception will be thrown.
     * @param row The [[JsonTerm]] to match against.
     * @param f The function applied to each completely grounded result. See [[completelyGroundJson]].
     * @returns A predicate containing the image of `f`.
     */
    //map(row: JsonTerm, f: (x: Json) => Json): Predicate;

    /*
     * Produces a predicate filtered to those terms which match `row` and satisfy `pred`. The terms
     * in the original predicate are required to have no unbound variables, otherwise an exception
     * will be thrown.
     * @param row The [[JsonTerm]] to match against.
     * @param pred The condition to filter against. Returns a truthy result for elements that should
     * be kept.
     * @returns A filtered predicate.
     */
    //filter(row: JsonTerm, pred: (x: Json) => boolean): Predicate;
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
     */
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
                const s2 = matchJson(row, arr[i], s);
                if(s2 !== null) k(s2);
            }
        };
    }

    /**
     * Produces a computation which succeeds for each entry in the extension of the predicate which `row` loosely matches with.
     * See [[looseMatchJson]]. That is, it iterates over the backing array doing `looseMatchJson(row, entry, ...)`.
     * @param row The row to loosely match against.
     * @returns A computation which succeeds for each way of binding the free variables of `row`
     * loosely consistent with the predicate.
     */
    looseMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            const arr = this.table;
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const s2 = looseMatchJson(row, arr[i], s);
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
                const s2 = matchJson(row, arr[i], s);
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

    /*
    negationAsFailure(row: JsonTerm): LPTerm {

    }
    */
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
            const len = vs.length;
            const rs = new Array<JsonTerm>(len);
            gen.dependOn(generator);
            generator.consume(cs => {
                // const [cs2, s2] = refreshJson(cs, s, vs); // TODO: Combine these or something.
                // const s3 = <Substitution<JsonTerm>>unifyJson(vs, cs2, s2);
                // k(s3);
                let s2 = s;
                for(let i = 0; i < len; ++i) {
                    const t = refreshJson(cs[i], s2, vs); 
                    s2 = t[1]; 
                    rs[i] = t[0];
                }
                for(let i = 0; i < len; ++i) {
                    s2 = <Substitution<JsonTerm>>unifyJson(vs[i], rs[i], s2);
                }
                k(s2);
            });
            if(isNew) generator.execute();
        };
    }

    // TODO: Update these docs when I understand the behavior of non-LRD-stratified programs better.
    /**
     * Tabled negation. It succeeds when the tabled predicate is guaranteed to never produce a result.
     * Currently, it only supports LRD-stratified negation. LRD-stratified negation is dynamically
     * stratified negation assuming a left-to-right selection of literals (i.e. evaluation of
     * conjuction). A program is dynamically stratified if no call ever depends negatively on itself
     * during execution. Any statically stratified program, i.e. any program where the body rule doesn't
     * directly or indirectly call itself through negation, is LRD-dynamically stratified.
     *
     * This form of negation can only be used on terms that have no unbound variables at the time it
     * is executed. An attempt to negate a non-groundable term will throw a floundering exception.
     *
     * If the program isn't LRD-stratified, I don't know what it will do. It will probably produce a
     * field lookup on `null` exception, but it may just produce incorrect results. I intend to have
     * it produce better error messages for this.
     * @param row A [[JsonTerm]] **that contains no unbound variables** to match against.
     * @returns A computation that succeeds only if the predicate doesn't match `row`.
     */
    notMatch(row: JsonTerm): LPTerm {
        return gen => s => k => {
            // TODO: Can I add back the groundingModifyWithVars to eliminate this groundJson?
            const t = this.getGenerator(groundJson(row, s), gen);
            const generator = t[0];
            const vs = t[1];
            const isNew = t[2];
            if(vs.length !== 0) throw new Error('TabledPredicate.notMatch: negation of non-ground atom (floundering)');
            gen.dependNegativelyOn(generator);
            generator.consumeNegatively(() => k(s));
            if(isNew) generator.execute();
        };
    }

    /**
     * Non-monotonic aggregation. This behaves similarly to [[notMatch]]. It takes the operations of
     * a commutative monoid and will apply them to the *set* of results (there's guaranteed to be no
     * duplicates). For this, the predicate must only produce fully groundable [[JsonTerm]]s, i.e.
     * ones with no unbound [[Variable]]s. It will throw an error if a term is produced that has
     * unbound variables.
     *
     * Like [[notMatch]] this can (currently) only be used in an LRD-stratified manner.
     *
     * @param M A type of a commutative monoid which is a subtype of [[Json]], i.e. `Json | M = Json`.
     * @param inject Turns a fully ground [[Json]] into an element of `M`.
     * @param unit A unit element for a commutative monoid.
     * @param mult The multiplication of a commutative monoid. That is, it's associative, commutative,
     * and `unit` is a left and right unit.
     * @returns A function taking two parameters. The first, `row`, specifies which elements to consider,
     * namely those which match `row`, while the resulting aggregate will be unified against `agg` which
     * typically will be a [[Variable]] to hold the result aggregate.
     */
    aggregate<M>(inject: (t: Json) => M, unit: M, mult: (x: M, y: M) => M): (row: JsonTerm, agg: JsonTerm) => LPTerm { 
        return (row, result) => gen => s => k => {
            // TODO: Can I add back the groundingModifyWithVars to eliminate this groundJson?
            const t = this.getGenerator(groundJson(row, s), gen);
            const generator = t[0];
            const vs = t[1];
            const isNew = t[2];
            const len = vs.length;
            const rs = new Array<JsonTerm>(len);
            let agg = unit;
            gen.dependNegativelyOn(generator);
            generator.consumeToCompletion(cs => {
                let s2 = s;
                for(let i = 0; i < len; ++i) {
                    const t = refreshJson(cs[i], s2, vs); 
                    s2 = t[1]; 
                    rs[i] = t[0];
                }
                for(let i = 0; i < len; ++i) {
                    s2 = <Substitution<JsonTerm>>unifyJson(vs[i], rs[i], s2);
                }
                agg = mult(agg, inject(completelyGroundJson(row, s2)));
            }, () => { 
                const s2 = matchJson(result, agg, s); 
                if(s2 !== null) k(s2);
            });
            if(isNew) generator.execute();
        };
    }

    private static isNumber(t: JsonTerm): number {
        if(typeof t === 'number') return t;
        throw new Error('TabledPredicate.isNumber: expected a number');
    }

    /**
     * Sums over the elements. They are required to be numbers.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    sum: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<number>(TabledPredicate.isNumber, 0, (x, y) => x+y);

    /**
     * Calculates the product over the elements. They are required to be numbers.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    product: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<number>(TabledPredicate.isNumber, 1, (x, y) => x*y);

    /**
     * Finds the minimum of the elements. They are required to be numbers.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    min: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<number>(TabledPredicate.isNumber, Number.POSITIVE_INFINITY, Math.min);

    /**
     * Finds the maximum of the elements. They are required to be numbers.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    max: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<number>(TabledPredicate.isNumber, Number.NEGATIVE_INFINITY, Math.max);

    /**
     * Calculates the disjunction of the elements.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    count: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<Json>(_ => 1, 0, (x, y) => x+y);

    /**
     * Calculates the conjunction of the elements.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    and: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<Json>(x => x, true, (x, y) => x && y);

    /**
     * Calculates the disjunction of the elements.
     *
     * This is built on [[aggregate]] and has the same restrictions.
     */
    or: (row: JsonTerm, agg: JsonTerm) => LPTerm = this.aggregate<Json>(x => x, false, (x, y) => x || y);
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
 * Expects `In` to be completely groundable and applies `f` to it unifying `Out` to
 * the result.
 */
export function apply(f: (x: Json) => Json): (In: JsonTerm, Out: JsonTerm) => LPTerm {
    return (In, Out) => gen => s => k => {
        const result = matchJson(Out, f(completelyGroundJson(In, s)), s);
        if(result !== null) return k(result);
    };
}

/**
 * A computation that succeeds if all of its arguments do. That is, the conjunction.
 */
export function conj<V>(...cs: Array<LPSub<V>>): LPSub<V> {
    return gen => {
        const len = cs.length;
        const cs2 = new Array<(sub: Substitution<V>) => CPS<Substitution<V>>>(len);
        for(let i = 0; i < len; ++i) {
            cs2[i] = cs[i](gen);
        }
        return s => k => {
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
        /*
        const len = ds.length;
        const ds2 = new Array<(sub: Substitution<V>) => CPS<Substitution<V>>>(len);
        for(let i = 0; i < len; ++i) {
            ds2[i] = ds[i](gen);
        }
        */
        const ds2 = ds.map(d => d(gen));
        return s => k => {
            for(let i = ds2.length - 1; i >= 0; --i) {
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
    /*
    const len = alternatives.length;
    const alts = new Array<LPSub<V>>(len);
    for(let i = 0; i < len; ++i) {
        const cs = alternatives[i];
        alts[i] = clauseN(cs.length, cs);
    }
    return disj.apply(null, alts);
    */
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

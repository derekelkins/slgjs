import { Variable, Substitution } from "./unify"

/*

   The idea is that P :- A,B; C,D. is interpreted as a process:
   process P {
   fork(do C; D);
   A;
   B;
   }

   Example trace:
   :- table path/2.
   path(X,Z) :- edge(X,Y), path(Y,Z).
   path(X,Y) :- edge(X,Y).
   edge(1,2). edge(1,3). edge(2,2). edge(3,1).
   ?- path(1,Y).

   1.  path(1,Y) :- path(1,Y)
   2.  path(1,Y) :- edge(1,Z), path(Z,Y)
   3.  path(1,Y) :- path(2,Y)
   10. path(1,2) :-
   11. path(1,Y) :- path(3,Y)
   16. path(1,2) :-
   19. path(1,1) :-
   25. path(1,3) :-
   21. path(1,Y) :- edge(1,Y)
   22. path(1,2) :-
   23. path(1,3) :-

   4.  path(2,Y) :- path(2,Y)
   5.  path(2,Y) :- edge(2,Z), path(Z,Y)
   6.  path(2,Y) :- path(2,Y)
   9.  path(2,2) :-
   7.  path(2,Y) :- edge(2,Y)
   8.  path(2,2) :-

   12. path(3,Y) :- path(3,Y)
   13. path(3,Y) :- edge(3,Z), path(Z,Y)
   14. path(3,Y) :- path(1,Y)
   15. path(3,2) :-
   20. path(3,1) :-
   24. path(3,3) :-
   17. path(3,Y) :- edge(3,Y)
   18. path(3,1) :-

   0. Since path(1,_) process DOES NOT exist ?- path(1,Y) spawns it and blocks reading from it.
   1. Fork off the path(X,Y) :- edge(X,Y) branch and continue with the path(X,Z) :- edge(X,Y), path(Y,Z) branch.
   2. Read from the edge(1,_) process and (immediately) get a response edge(1,2).
   3. Since path(2,_) process DOES NOT exist, spawn it and block reading from it.
   4. Fork off the path(X,Y) :- edge(X,Y) branch and continue with the path(X,Z) :- edge(X,Y), path(Y,Z) branch.
   5. Read from the edge(2,_) process and (immediately) get a response edge(2,2).
   6. Since path(2,_) process DOES exist, just block reading from it.
   7. Read from the edge(2,_) process and (immediately) get a response edge(2,2).
   8. Write path(2,2) to path(2,_) process (thus waking 6).
   9. Write path(2,2) to path(2,_) process (thus waking 3), path(2,_) process terminates.
   10. Write path(1,2) to path(1,_) process 
   (thus waking 0 which rejects path(1,2) causing path(1,_) to backtrack and read path(2,_) which is complete 
   so it backtracks and reads edge(1,_) getting a response edge(1,3)).
   11. Since path(3,_) process DOES NOT exist, spawn it and block reading from it.
   12. Fork off the path(X,Y) :- edge(X,Y) branch and continue with the path(X,Z) :- edge(X,Y), path(Y,Z) branch.
   13. Read from the edge(3,_) process and (immediately) get a response edge(3,1).
   14. Since path(1,_) process DOES exist, read it and (immediately) get a response path(1,2) from the table.
   15. Write path(3,2) to path(3,_) process (thus waking 11).
   16. Write path(1,2) to path(1,_) process 
   (thus waking 0 which rejects path(1,2) causing path(1,_) to backtrack and block reading path(3,_)).
   17. Read from the edge(3,_) process and (immediately) get a response edge(3,1).
   18. Write path(3,1) to path(3,_) process (thus waking 11).
   19. Write path(1,1) to path(1,_) process 
   (thus waking 0 which rejects path(1,1) causing path(1,_) to backtrack and block reading path(3,_)).




*/

/*
// Below is somewhat conceptual. This will probably need to be embedded in a monad.

const [pathIn, pathOut]: [ReceiveChan<[Substitution<A>, Tuple<A>, FailingChan<Substitution<A>>]>, 
SendChan<[Substitution<A>, Tuple<A>, FailingChan<Substitution<A>>]>] = makeTabledChannel();
const edgeIn: ReceiveChan<[Substitution<A>, Tuple<A>, Chan<Tuple<A>>]> = makeChannelFromTable(edgeTable);
spawn(() => {
    spawn(() => {
        const [sub, t, responseChan] = pathIn.receive();
        edgeIn.send([sub, t, responseChan]);
    });
    const [sub1, {start: x, end: z}, responseChan] = pathIn.receive();
    const [eIn, eOut] = makeFailingChannel();
    const [y, sub2] = fresh(sub1);
    edgeIn.send([sub2, {start: x, end: y}, eOut]);
    const sub3 = eIn.receive():
    pathOut.send([sub3, {start: y, end: z}, responseChan]);
});

const [resultIn, resultOut] = makeFailingChannel();
const [x, sub] = fresh(Susbtitution.empty());
pathOut.send([sub, {start: 1, end: x}, resultOut]);
findAll(resultIn);
*/

interface ReceiveChan<A> {
    receive(): PromiseLike<A>;
}

interface SendChan<A> {
    send(x: A): PromiseLike<void>;
}

interface FailingChan<A> extends SendChan<A> {
    close(): void; // causes receiver to fail.
}

interface Scheduler<R> {
    fork(p: () => PromiseLike<R>): void;
    makeFailingChannel<A>(): [ReceiveChan<A>, FailingChan<A>];
    makePersistentChannel<A>(): [ReceiveChan<A>, SendChan<A>];
}

interface Row<V> {
    [index: string]: V | Variable;
}

type LP<S, A> = (sk: (value: A, fk: () => void) => void, fk: () => void) => (sub: S) => void;

function conj<S>(...cs: Array<LP<S, S>>): LP<S, S> {
    return (sk, fk) => {
        let k = sk;
        for(let i = cs.length - 1; i >= 0; --i) {
            const c = cs[i](k, fk);
            k = (s, _) => c(s);
        }
        return s => k(s, fk);
    };
}

function disj<S, A>(...ds: Array<LP<S, A>>): LP<S, A> {
    return (sk, fk) => s => {
        let k = fk;
        for(let i = ds.length - 1; i >= 0; --i) {
            const d = ds[i](sk, k);
            k = () => d(s);
        }
        return k();
    };
}

// TODO: Assumes that the rows have the same fields.
function unifyRow<V>(x: Row<V>, y: Row<V>, sub: Substitution<V>): Substitution<V> | null {
    let s: Substitution<V> | null = sub;
    for(const k in x) {
        const xkPre = x[k];
        const xk = xkPre instanceof Variable ? s.lookupAsVar(xkPre) : xkPre;
        const ykPre = y[k];
        const yk = ykPre instanceof Variable ? s.lookupAsVar(ykPre) : ykPre;
        if(xk instanceof Variable) {
            if(yk instanceof Variable) {
                s = s.unifyVar(xk, yk);
            } else {
                s = s.bind(xk, yk);
            }
        } else {
            if(yk instanceof Variable) {
                s = s.bind(yk, xk);
            } else if (xk !== yk) {
                return null;
            }
        }
        if(s === null) return null;
    }
    return s;
}

function unify<V>(x: Row<V>, y: Row<V>): LP<Substitution<V>, Substitution<V>> {
    return (sk, fk) => s => {
        const s2 = unifyRow(x, y, s);
        if(s2 !== null) {
            sk(s2, fk);
        } else {
            fk();
        }
    };
}

function groundRow<V>(row: Row<V>, sub: Substitution<V>): Row<V> {
    const result: Row<V> = {};
    for(const k in row) {
        const v = row[k];
        result[k] = v instanceof Variable ? sub.lookupAsVar(v) : v;
    }
    return result;
}

function fresh<V, A>(count: number, body: (...vs: Array<Variable>) => LP<Substitution<V>, A>): LP<Substitution<V>, A> {
    return (sk, fk) => s => {
        const [vs, s2] = s.fresh(count);
        return body.apply(null, vs)(sk, fk)(s2);
    };
}

function rule<V>(...alternatives: Array<[number, (...vs: Array<Variable>) => Array<LP<Substitution<V>, Substitution<V>>>]>): LP<Substitution<V>, Substitution<V>> {
    return disj.apply(null, alternatives.map(([n, cs]) => fresh(n, (...vs) => conj.apply(null, cs.apply(null, vs)))));
}

function findAll<S, A>(s0: S, sk: (value: A) => void, m: LP<S, A>): void {
    m((v, fk) => { sk(v); fk(); }, () => void(0))(s0);
}

/*
class PrintChan implements SendChan<any> {
    send(x: any): Promise<void> {
        console.log(x);
        return Promise.resolve();
    }
}

class GroundChan<V> implements SendChan<Substitution<V>> {
    constructor(private readonly row: Row<V>) {}
    send(sub: Substitution<V>): Promise<void> {
        console.log(groundRow(this.row, sub));
        return Promise.resolve();
    }
}
*/

(function() {
function example(row: {start: number | Variable, end: number | Variable}, sub: Substitution<number>): void {
    const X = row.start;
    const Z = row.end;
    findAll(sub, s => console.log(groundRow(row, s)),
        rule<number>(
            [0, ()  => [unify(row, {start: 1, end: 2})]],
            [0, ()  => [unify(row, {start: 2, end: 3})]],
            [1, (Y) => [unify(row, {start: X, end: Y}), unify(row, {start: Y, end: Z})]]));
}

const sub: Substitution<number> = Substitution.emptySemiPersistent();

console.log('Example 1: \n');
example({start: 5, end: 7}, sub);
console.log('Example 2: \n');
example({start: 5, end: 5}, sub);
console.log('Example 3: \n');
example({start: 1, end: 2}, sub);

console.log('Example 4: \n');
const [[X, Y], sub2] = sub.fresh(2);
example({start: X, end: Y}, sub2);
})();

/*
type Process<V> = SendChan<[Substitution<Row<V>>, Row<V>, FailingChan<Substitution<Row<V>>>]>;

// Not tabled
function persistentProcess<R, V>(scheduler: Scheduler<R>, body: (sub: Substitution<Row<V>>, row: Row<V>, respChan: SendChan<Substitution<Row<V>>>) => Promise<void>) : Process<V> {
    const [recvChan, sendChan] = scheduler.makePersistentChannel<[Substitution<Row<V>>, Row<V>, FailingChan<Substitution<Row<V>>>]>();

    recvChan.receive().then(([sub, row, respChan]) => body(sub, row, respChan).then(() => respChan.close()));

    return sendChan;
}

type Conc<S, A> = (scheduler: Scheduler<S>) => (subst: S) => PromiseLike<A>;

       
// TODO: Add some assertions.
class RendezvousChan<A> implements ReceiveChan<A>, FailingChan<A> {
    private waitingReceiverResolver?: (value: A) => void;
    private waitingReceiverRejector?: () => void;
    private waitingSenderResolver?: () => void;
    private waitingSenderValue?: A;
    constructor() {}

    receive(): PromiseLike<A>  {
        const value = this.waitingSenderValue;
        const resolver = this.waitingSenderResolver;
        if(value !== void(0) && resolver !== void(0)) {
            this.waitingSenderResolver = void(0);
            this.waitingSenderResolver = void(0);
            resolver();
            return Promise.resolve(value);
        } else {
            return new Promise((resolve, reject) => {
                this.waitingReceiverResolver = resolve;
                this.waitingReceiverRejector = reject;
            });
        }
    }

    send(x: A): PromiseLike<void> {
        const resolver = this.waitingReceiverResolver;
        if(resolver !== void(0)) {
            this.waitingReceiverResolver = void(0);
            this.waitingReceiverRejector = void(0);
            resolver(x);
            return Promise.resolve();
        } else {
            this.waitingSenderValue = x;
            return new Promise((resolve, reject) => {
                this.waitingSenderResolver = resolve;
            });
        }
    }

    close(): void {
        const rejector = this.waitingReceiverRejector;
        if(rejector !== void(0)) {
            this.waitingReceiverResolver = void(0);
            this.waitingReceiverRejector = void(0);
            rejector();
        }
    }
}

// TODO: Add some assertions.
class SimpleTabledChan<A> implements ReceiveChan<A>, FailingChan<A> {
    private readonly waitingResolvers: Array<(value: A) => void> = [];
    private readonly waitingRejectors: Array<() => void> = [];
    private readonly table: Array<A> = [];
    private closed: boolean = false;
    constructor() {}

    receive(): PromiseLike<A>  {
        
    }

    send(x: A): PromiseLike<void> {
        this.table.push(x);
        for(const resolve of this.waitingResolvers) {
            resolve(x);
        }
        return Promise.resolve();
    }

    close(): void {
        this.closed = true;
        for(const reject of this.waitingRejectors) {
            reject();
        }
        this.waitingResolvers.length = 0;
        this.waitingRejectors.length = 0;
    }
}

function conj<S>(...cs: Array<Conc<S, S>>): Conc<S, S> {
    return scheduler => {
        const cs2 = cs.map(c => c(scheduler));
        return subst => {
            let promise = Promise.resolve(subst);
            for(const c of cs2) {
                promise = promise.then(c);
            }
            return promise;
        };
    };
}

function disj<S>(...ds: Array<Conc<S, S>>): Conc<S, S> {
    const len = ds.length;
    if(len === 0) return scheduler => subst => Promise.reject('Empty disjunction.');
    return scheduler => {
        const ds2 = ds.map(d => d(scheduler));
        const d0 = ds2[0];
        return subst => {
            for(let i = 1; i < len; ++i) {
                scheduler.fork(ds2[i](subst));
            }
            return d0(subst);
        };
    };
}
*/

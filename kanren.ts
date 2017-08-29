// This is primarily to test the other parts.

import { Variable, Substitution } from "./unify"

interface Term<C> {
    match<A>(varCase: (v: Variable) => A, constCase: (c: C) => A, tupleCase: (xs: Array<Term<C>>) => A): A;
    unify(y: Term<C>, s: Substitution<Term<C>>): Substitution<Term<C>> | null;
    contains(normalizedId: number, s: Substitution<Term<C>>): boolean;
    ground(s: Substitution<Term<C>>): Term<C>;
}

class Var<C> implements Term<C> {
    constructor(readonly variable: Variable) { }
    match<A>(varCase: (v: Variable) => A, constCase: (c: C) => A, tupleCase: (xs: Array<Term<C>>) => A): A {
        return varCase(this.variable);
    }

    contains(normalizedId: number, s: Substitution<Term<C>>): boolean {
        return s.normalizedId(this.variable) === normalizedId;
    }

    unify(y: Term<C>, s: Substitution<Term<C>>): Substitution<Term<C>> | null {
        const v = s.lookup(this.variable);
        if(typeof v === 'number') {
            if(y.contains(v, s)) return null;
            return y.match(n => s.unifyVar(this.variable, n),
                           _ => s.bind(this.variable, y),
                           _ => s.bind(this.variable, y));                        
        } else {
            return v.unify(y, s);
        }
    }

    ground(s: Substitution<Term<C>>): Term<C> {
        const t = s.lookup(this.variable);
        if(typeof t === 'number') {
            return this;
        } else {
            return t.ground(s);
        }
    }

    toString(): string {
        return '?'+this.variable.id;
    }
}

export class Const<C> implements Term<C> {
    constructor(readonly constant: C) { }
    match<A>(varCase: (v: Variable) => A, constCase: (c: C) => A, tupleCase: (xs: Array<Term<C>>) => A): A {
        return constCase(this.constant);
    }

    contains(normalizedId: number, s: Substitution<Term<C>>): boolean {
        return false;
    }

    unify(y: Term<C>, s: Substitution<Term<C>>): Substitution<Term<C>> | null {
        return y.match(_ => y.unify(this, s),
                       c => c === this.constant ? s : null,
                       _ => null);                        
    }

    ground(s: Substitution<Term<C>>): Term<C> {
        return this;
    }

    toString(): string {
        return this.constant.toString();
    }
}

export class Tuple<C> implements Term<C> {
    constructor(readonly subterms: Array<Term<C>>) { }
    match<A>(varCase: (v: Variable) => A, constCase: (c: C) => A, tupleCase: (xs: Array<Term<C>>) => A): A {
        return tupleCase(this.subterms);
    }

    contains(normalizedId: number, s: Substitution<Term<C>>): boolean {
        const sts = this.subterms;
        const len = sts.length;
        for(let i = 0; i < len; ++i) {
            if(sts[i].contains(normalizedId, s)) return true;
        }
        return false;
    }

    unify(y: Term<C>, s: Substitution<Term<C>>): Substitution<Term<C>> | null {
        return y.match(_ => y.unify(this, s),
                       _ => null,
                       ts => {
                            const sts = this.subterms;
                            const len = sts.length;
                            if(ts.length !== len) return null;
                            let curr: Substitution<Term<C>> | null = s;
                            for(let i = 0; i < len; ++i) {
                                curr = sts[i].unify(ts[i], curr);
                                if(curr === null) return null;
                            }
                            return curr;
                       });
    }

    ground(s: Substitution<Term<C>>): Term<C> {
        return new Tuple(this.subterms.map(t => t.ground(s)));
    }

    toString(): string {
        return `[${this.subterms.toString()}]`;
    }
}


export type LP<C> = (s: Substitution<Term<C>>) => Iterable<Substitution<Term<C>>>;

export function unify<C>(x: Term<C>, y: Term<C>): LP<C> {
    return function* (s) {
        const s2 = x.unify(y, s);
        if(s2 !== null) yield s2;
    };
}

function* interleave<A>(xsIter: Iterator<A>, ys: Iterable<A>): Iterable<A> {
    let {value: v, done: isDone} = xsIter.next();
    if(isDone) {
        yield* ys;
    } else {
        yield v;
        const ysIter = ys[Symbol.iterator](); 
        ({value: v, done: isDone} = ysIter.next());
        while(!isDone) {
            yield v;
            ({value: v, done: isDone} = xsIter.next());
            if(isDone) {
                ({value: v, done: isDone} = ysIter.next());
                while(!isDone) {
                    yield v;
                    ({value: v, done: isDone} = ysIter.next());
                }
                return;
            }
            yield v;
            ({value: v, done: isDone} = ysIter.next());
        } 
        ({value: v, done: isDone} = xsIter.next());
        while(!isDone) {
            yield v;
            ({value: v, done: isDone} = xsIter.next());
        }
    }
}

function* interleaveMap<A,B>(xs: Iterator<A>, f: (x: A) => Iterable<B>): Iterable<B> {
    const {value: x, done: isDone} = xs.next();
    if(!isDone) {
        const ysIter = f(x)[Symbol.iterator]();
        yield* interleave(ysIter, interleaveMap(xs, f));
    }
}

export function disj<C>(...rs: Array<LP<C>>): LP<C> {
    const len = rs.length;
    return function* (s) {
        function* loop(i: number): Iterable<Substitution<Term<C>>> {
            if(i < len) {
                const rIter = rs[i](s)[Symbol.iterator]();
                yield* interleave(rIter, loop(i+1));
            }
        };
        yield* loop(0);
    };
}

export function conj<C>(...rs: Array<LP<C>>): LP<C> {
    const len = rs.length;
    function loop(i: number): LP<C> {
        return function* (s) {
            if(i < len) {
                const rIter = rs[i](s)[Symbol.iterator]();
                yield* interleaveMap(rIter, loop(i+1));
            } else {
                yield s;
            }
        };
    };
    return loop(0);
}

export function fresh<C,R>(count: number, body: (...vs: Array<Term<C>>) => LP<R>): LP<R> {
    return function (s) {
        const [vs, s2] = s.fresh(count);
        return body.apply(null, vs.map(v => new Var(v)))(s2);
    };
}

export function* runLP<C>(body: (q: Term<C>) => LP<C>): Iterable<Term<C>> {
    const [[q], s] = Substitution.emptySemiPersistent<Term<C>>().fresh(1);
    const vq = new Var<C>(q);
    for(const sr of body(vq)(s)) {
        const t = sr.lookup(q);
        if(typeof t === 'number') {
            yield vq;
        } else {
            yield t.ground(sr);
        }
    }
}

export function rule<C>(...alternatives: Array<[number, (...vs: Array<Term<C>>) => Array<LP<C>>]>): LP<C> {
    return disj.apply(null, alternatives.map(([n, cs]) => fresh(n, (...vs) => conj.apply(null, cs.apply(null, vs)))));
}

const nil: Term<any> = new Const('nil');

function cons<C>(x: Term<C>, xs: Term<C>): Term<C> {
    return new Tuple([x, xs]);
}

function append<C>(Xs: Term<C>, Ys: Term<C>, Zs: Term<C>): LP<C> {
    return rule<C>([0, () =>
                        [unify(nil, Xs), unify(Ys, Zs)]],
                   [3, (X1, Xs1, Zs1) =>  
                        [unify(cons(X1, Xs1), Xs), unify(cons(X1, Zs1), Zs), append(Xs1, Ys, Zs1)]]);
}

function list<C>(...xs: Array<C>): Term<C> {
    let ys: Term<C> = nil;
    for(let i = xs.length-1; i >= 0; --i) {
        ys = cons(new Const(xs[i]), ys);
    }
    return ys;
}

for(const t of runLP(q => fresh(2, (l,r) => conj(unify(cons(l,r), q), append(l, r, list(1,2,3,4,5)))))) {
    console.log(t.toString());
}

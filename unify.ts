import PUF from "./puf"

/**
 * This represents a unification variable.
 *
 */
export class Variable {
    constructor(readonly id: number) {}
}    

/**
 * Intended to be restricted to JavaScript objects that correspond to JSON.
 * In particular, no functions.
 */
export type Json = any;

/**
 * Intended to be [[Json]] except that we may have [[Variable]]s at any point.
 */
export type JsonTerm = Json | Variable;

/**
 * A collection of bindings for unification variables.
 *
 * @param A The type of values held by the unification variables.
 */
export class Substitution<A> {
    private constructor(private readonly uf: PUF<A>, private readonly nextVariable = 0) {}

    /**
     * Create a new [[Substitution]] which can be used persistently that has no variables.
     * @param initialCapacity The number of variables to pre-allocate.
     */
    static emptyPersistent<A>(initialCapacity = 10): Substitution<A> { return new Substitution<A>(PUF.createPersistent(initialCapacity)); }

    /**
     * Create a new [[Substitution]] which can be used semi-persistently that has no variables.
     * This means that as soon as you make a change to an old substitution, any other substitutions
     * built from it become invalid.
     *
     * ```
     * const [X, s0] = Substitution.emptySemiPersistent().freshVar();
     * const s1 = s0.bind(X, 1); // s0 is still valid.
     * const s2 = s0.bind(X, 2); // s1 is no longer valid, but s0 is still valid.
     * s1.lookup(X); // ERROR
     * ```
     * @param initialCapacity The number of variables to pre-allocate.
     */
    static emptySemiPersistent<A>(initialCapacity = 10): Substitution<A> { return new Substitution<A>(PUF.createSemiPersistent(initialCapacity)); }

    /**
     * Extend the current [[Substitution]] with a new, unbound [[Variable]] and return
     * it and the extended [[Substitution]].
     */
    freshVar(): [Variable, Substitution<A>] {
        const nv = this.nextVariable;
        return [new Variable(nv), new Substitution(this.uf, nv+1)];
    }

    /**
     * Extend the current [[Substitution]] with a `count` new, unbound [[Variable]]s and return
     * them and the extended [[Substitution]].
     * @param count The number of variables to create.
     */
    fresh(count: number): [Array<Variable>, Substitution<A>] {
        if(count < 0) throw new Error('Substitution.fresh: attempt to create negative number of variables.'); // ASSERTION
        const nv = this.nextVariable;
        const newSize = nv + count;
        const vs = new Array<Variable>(count);
        for(let i = 0; i < count; ++i) {
            vs[i] = new Variable(nv + i);
        }
        return [vs, new Substitution(this.uf, newSize)];
    }

    /**
     * Return the ID of the representative for this [[Variable]].
     * If two variables have been unified, their normalized IDs will be the same.
     * @param v The [[Variable]] for which to get the normalized ID.
     * @returns The normalized variable ID.
     */
    normalizedId(v: Variable): number {
        return this.uf.find(v.id).id;
    }

    /**
     * Return the value bound to the `v` or the ID of its representative if it is unbound.
     * If `A | number = A` then you will not be able to tell whether or not it is unbound.
     * See [[lookupVar]] and [[lookupAsVar]] instead.
     * @param v The [[Variable]] whose value you want to look up.
     * @returns Either the value if bound or the ID of the representative unbound variable.
     */
    lookup(v: Variable): A | number {
        const x = this.uf.find(v.id);
        const val = x.value;
        return val === void(0) ? x.id : val;
    }

    /**
     * Return the ID of th representative [[Variable]] for `v` and its value if any.
     * @param v The [[Variable]] whose value or representative you want to look up.
     * @returns The ID of the representative [[Variable]] and its value if bound.
     */
    lookupVar(v: Variable): {id: number, value?: A} {
        return this.uf.find(v.id);
    }

    /**
     * Return the value bound to the `v` or the representative [[Variable]] if it is unbound.
     * @param v The [[Variable]] whose value you want to look up.
     * @returns Either the value if bound or the representative unbound [[Variable]].
     */
    lookupAsVar(v: Variable): A | Variable {
        const x = this.uf.find(v.id);
        const val = x.value;
        return val === void(0) ? new Variable(x.id) : val;
    }

    /**
     * Return the value bound to the [[Variable]] with ID `id` or the representative [[Variable]] if it is unbound.
     * @param id The ID of the [[Variable]] whose value you want to look up.
     * @returns Either the value if bound or the representative unbound [[Variable]].
     */
    lookupById(id: number): A | Variable {
        const x = this.uf.find(id);
        const val = x.value;
        return val === void(0) ? new Variable(x.id) : val;
    }

    /**
     * Bind a variable to a value and return the extended [[Substitution]].
     * This assumes `v` is unbound, otherwise it will throw an error.
     * @param v The [[Variable]] to bind.
     * @param value The value to bind to `v`.
     * @returns A [[Substitution]] extended with the binding.
     */
    bind(v: Variable, value: A): Substitution<A> {
        return new Substitution(this.uf.bindValue(v.id, value), this.nextVariable);
    }

    /**
     * Unify two [[Variable]]s.
     * @returns `null` if unification fails, otherwise a [[Substitution]] where the [[Variable]]s are unified.
     */
    unifyVar(x: Variable, y: Variable): Substitution<A> | null {
        const {id: xId, value: xVal} = this.uf.find(x.id);
        const {id: yId, value: yVal} = this.uf.find(y.id);
        if(xVal === void(0)) {
            return new Substitution(this.uf.bindVariable(xId, yId), this.nextVariable);
        } else {
            if(yVal === void(0)) {
                return new Substitution(this.uf.bindVariable(yId, xId), this.nextVariable);
            } else {
                return xVal === yVal ? this : null;
            }
        }
    }
}

// const sub = Substitution.emptyPersistent();
// let [vs, s] = sub.fresh(30);
// s = s.bind(vs[0], [1,2]);
// for(let i = 1; i < vs.length; ++i) {
//     s = s.bind(vs[i], [vs[i-1],vs[i-1]]);
// }
// console.log('slow');
// groundJsonNoSharing(vs[vs.length - 1], s);
// console.log('fast');
// groundJson(vs[vs.length - 1], s);

/**
 * Traverse a [[JsonTerm]] looking up [[Variable]]s in `sub` producing a [[JsonTerm]] that
 * only has unbound variables. This makes no attempt to preserve the sharing represented by
 * the variables so the result can be exponentially larger in pathological cases.
 * @param x The [[JsonTerm]] to ground.
 * @param sub The bindings against which to ground.
 * @returns A [[JsonTerm]] with only unbound [[Variable]]s.
 */
export function groundJsonNoSharing(x: JsonTerm, sub: Substitution<JsonTerm>): JsonTerm {
    if(x instanceof Variable) x = sub.lookupAsVar(x);
    switch(typeof x) {
        case 'object':
            if(x === null) {
                return x;
            } else if(x instanceof Variable) {
                return x;
            } else if(x instanceof Array) {
                return x.map(y => groundJsonNoSharing(y, sub));
            } else { // it's an object
                const result: JsonTerm = {};
                for(const key in x) {
                    result[key] = groundJsonNoSharing(x[key], sub);
                }
                return result;
            }
        default:
            return x;
    }
}

/**
 * Traverse a [[JsonTerm]] looking up [[Variable]]s in `sub` producing a [[JsonTerm]] that
 * only has unbound variables. This preserves the sharing represented by the variables.
 * @param x The [[JsonTerm]] to ground.
 * @param sub The bindings against which to ground.
 * @returns A [[JsonTerm]] with only unbound [[Variable]]s.
 */
export function groundJson(x: JsonTerm, sub: Substitution<JsonTerm>, mapping: {[id: number]: JsonTerm} = {}): JsonTerm {
    let id: number | null = null;
    if(x instanceof Variable) { 
        const v = sub.lookupVar(x);
        id = v.id;
        const shared = mapping[id];
        if(shared !== void(0)) return shared;
        x = v.value === void(0) ? new Variable(id) : v.value;
    }
    switch(typeof x) {
        case 'object':
            if(x === null) {
                return x;
            } else if(x instanceof Variable) {
                return x;
            } else if(x instanceof Array) {
                const result = x.map(y => groundJson(y, sub, mapping));
                if(id !== null) mapping[id] = result;
                return result;
            } else { // it's an object
                const result: JsonTerm = {};
                for(const key in x) {
                    result[key] = groundJson(x[key], sub, mapping);
                }
                if(id !== null) mapping[id] = result;
                return result;
            }
        default:
            return x;
    }
}

/**
 * Traverse a [[JsonTerm]] replacing any [[Variable]]s with fresh variables allocated from `sub`.
 * @param x The [[JsonTerm]] whose [[Variable]]s will be replaced. This should usually be a ground term as produced, e.g. by [[groundJson]].
 * @param sub The [[Substitution]] to extend with fresh variables.
 * @returns The "refreshed" [[JsonTerm]] and a [[Substitution]] extended with fresh variables.
 */
export function refreshJson(x: JsonTerm, sub: Substitution<JsonTerm>, mapping: {[index: number]: Variable} = {}): [JsonTerm, Substitution<JsonTerm>] {
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
                const newArray = new Array<JsonTerm>(len);
                for(let i = 0; i < len; ++i) {
                    const t = refreshJson(x[i], s, mapping);
                    newArray[i] = t[0];
                    s = t[1];
                }
                return [newArray, s];
            } else { // it's an object
                let s = sub;
                const newObject: JsonTerm = {};
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

/**
 * Unify `x` against `y` except only require that for any objects in `x`, their keys are a subset of the corresponding
 * keys of `y`. This makes [[looseUnifyJson]] asymmetric unlike [[unifyJson]]. For example, `looseUnify({},{foo:1})`
 * succeeds, but `looseUnify({foo:1},{})` does not.
 * @param x A [[JsonTerm]] to loosely unify against.
 * @param y A [[JsonTerm]] potentially with additional keys to loosely unify against.
 * @param sub Bindings for the [[Variable]]s in `x` and `y`.
 * @returns `null` if unification fails, otherwise `sub` extended with bindings such that `x` grounds to a [[JsonTerm]]
 * that is identical to the grounding of `y` except that it may have fewer keys in any objects.
 */
export function looseUnifyJson(x: JsonTerm, y: JsonTerm, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {
    if(x instanceof Variable) x = sub.lookupAsVar(x);
    if(y instanceof Variable) y = sub.lookupAsVar(y);
    if(x instanceof Variable) {
        if(y instanceof Variable) {
            return sub.unifyVar(x, y);
        } else {
            return sub.bind(x, y);
        }
    } else if(y instanceof Variable) {
        return sub.bind(y, x);
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
                            s = looseUnifyJson(x[i], y[i], s);
                            if(s === null) return null;
                        }
                        return s;
                    } else {
                        return null;
                    }
                } else { // it's an object
                    if(y === null || typeof y !== 'object' || y instanceof Array) return null;
                    let s: Substitution<any> | null = sub;
                    for(const key in x) {
                        if(!(key in y)) return null;
                        s = looseUnifyJson(x[key], y[key], s);
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

/**
 * Unify to [[JsonTerm]]s. That is, calculate the most general unifier if possible.
 * @returns The most general unifier or `null` if there is none.
 */
export function unifyJson(x: JsonTerm, y: JsonTerm, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {
    if(x instanceof Variable) x = sub.lookupAsVar(x);
    if(y instanceof Variable) y = sub.lookupAsVar(y);
    if(x instanceof Variable) {
        if(y instanceof Variable) {
            return sub.unifyVar(x, y);
        } else {
            return sub.bind(x, y);
        }
    } else if(y instanceof Variable) {
        return sub.bind(y, x);
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
                    const xKeys = Object.keys(x).sort();
                    const yKeys = Object.keys(y).sort();
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

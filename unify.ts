import PUF from "./puf"

/**
 * This represents a unification variable.
 *
 */
export class Variable {
    constructor(readonly id: number) {}
}    

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

import PUF from "./puf"

export class Variable {
    constructor(readonly id: number) {}
}    

export class Substitution<A> {
    private constructor(private readonly uf: PUF<A>, private readonly nextVariable = 0) {}

    static emptyPersistent<A>(): Substitution<A> { return new Substitution<A>(PUF.createPersistent(10)); }
    static emptySemiPersistent<A>(): Substitution<A> { return new Substitution<A>(PUF.createSemiPersistent(10)); }

    freshVar(): [Variable, Substitution<A>] {
        const nv = this.nextVariable;
        return [new Variable(nv), new Substitution(this.uf, nv+1)];
    }

    fresh(count: number): [Array<Variable>, Substitution<A>] {
        const nv = this.nextVariable;
        const newSize = nv + count;
        const vs = new Array<Variable>(count);
        for(let i = 0; i < count; ++i) {
            vs[i] = new Variable(nv + i);
        }
        return [vs, new Substitution(this.uf, newSize)];
    }

    withFresh<R>(count: number, body: (...vs: Array<Variable>) => R):  R {
        return body.apply(null, this.fresh(count));
    }

    normalizedId(v: Variable): number {
        return this.uf.find(v.id).id;
    }

    lookup(v: Variable): A | number {
        const x = this.uf.find(v.id);
        const val = x.value;
        return val === void(0) ? x.id : val;
    }

    lookupAsVar(v: Variable): A | Variable {
        const x = this.uf.find(v.id);
        const val = x.value;
        return val === void(0) ? new Variable(x.id) : val;
    }

    lookupById(id: number): A | Variable {
        const x = this.uf.find(id);
        const val = x.value;
        return val === void(0) ? new Variable(x.id) : val;
    }

    bind(v: Variable, value: A): Substitution<A> {
        return new Substitution(this.uf.bindValue(v.id, value), this.nextVariable);
    }

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

import { Json, JsonTerm, Variable, Substitution } from "./unify"

function emptyObjectUnless(x: any): any { return x === void(0) ? {} : x; }

function convert(type: "boolean" | "number" | "string", val: string): Json {
    if(type === 'boolean') return Boolean(val);
    if(type === 'number') return Number(val);
    return val; // It's a string.
}

/**
 * A key-value mapping keyed by JSON objects. This can also be used as a representation
 * for a collection of JSON objects that shares prefixes (where object keys are stored
 * in sorted order).
 *
 * @param A The type of values
 */
export class JsonTrie<A> {
    private constructor(private trie: any = {}) {}

    /**
     * Create a [[JsonTrie]] from a JSON representation of its contents. `json` should not be modified
     * externally after calling this and will be mutated by an [[JsonTrie]] operations that perform mutation.
     *
     * This doesn't verify the validity of the supplied JSON.
     * @param json Expects a JavaScript object that (correctly!) represents a trie. **This won't be copied.**
     * @returns A [[JsonTrie]] built from the passed in object.
     */
    static fromJson<A>(json: Json): JsonTrie<A> {
        return new JsonTrie(json);
    }

    /**
     * Create an empty [[JsonTrie]].
     * @returns An empty [[JsonTrie]].
     */
    static create<A>(): JsonTrie<A> {
        return new JsonTrie();
    }

    /**
     * The JSON backing. **This isn't a copy.** This means the object should not be mutated and will be mutated if the [[JsonTrie]] is.
     */
    get json(): Json {
        return this.trie;
    }

    /**
     * Insert `val` at the location represented by `key` overwriting whatever was there.
     * @param key The [[Json]] key.
     * @param val The value to insert.
     * @returns `val`
     */
    insert(key: Json, val: A): A {
        return JsonTrie.insertRec(key, val, this.trie);
    }

    /**
     * Modify the value at the location represented by `key` with the function `f`.
     *
     * `insert(key, val)` is equivalent to `modify(key, _ => val)`.
     * @param key The [[Json]] key.
     * @param f A function that will be given the old value or `undefined` if there was no old value.
     * @returns The result of the modification, i.e. the result of `f` on the found value or `undefined`.
     */
    modify(key: Json, f: (a: A | undefined) => A): A {
        return JsonTrie.modifyRec(key, f, this.trie);
    }

    /**
     * Empties the trie.
     */
    clear(): void {
        this.trie = {};
    }

    /**
     * Checks whether the `key` is in the [[JsonTrie]]. This is independent of the value stored.
     * @param key The [[Json]] key to check.
     * @returns `true` if `key` was found, `false` otherwise.
     */
    contains(key: Json): boolean {
        return JsonTrie.containsRec(key, this.trie);
    }

    /**
     * Look up the value associated with `key`. If `A | undefined = A` you will not be able to distinguish
     * between not finding a value and a value of `undefined`. Use [[contains]] in that situation.
     * @param key The [[Json]] key to look up.
     * @returns The value found or `undefined` if no value was found.
     */
    lookup(key: Json): A | undefined {
        return JsonTrie.lookupRec(key, this.trie);
    }

    /**
     * The set of keys in the [[JsonTrie]] in no particular order.
     *
     * `keys()` is equivalent to `entries().map(([k, _]) => k)`.
     * @returns An iterable over the keys.
     */
    *keys(): Iterable<Json> {
        for(const t of JsonTrie.rowRec(this.trie)) {
            yield t[0];
        }
    }

    /**
     * The list of values in the [[JsonTrie]] in no particular order. There will be duplicates if
     * multiple keys mapped to the same value.
     *
     * `values()` is equivalent to `entries().map(([_, v]) => v)`.
     * @returns An iterable over the values.
     */
    *values(): Iterable<A> {
        for(const t of JsonTrie.rowRec(this.trie)) {
            yield t[1];
        }
    }

    /**
     * The list of key-value pairs in the [[JsonTrie]] in no particular order.
     * @returns An iterable of the key-value pairs.
     */
    entries(): Iterable<[Json, A]> {
        return JsonTrie.rowRec(this.trie);
    }

    /**
     * Behaves as:
     * ```
     * for(const [key, val] of this.entries()) {
     *      k(key, val);
     * }
     * ```
     */
    entriesCont(k: (key: Json, val: A) => void): void {
        return JsonTrie.rowContRec(this.trie, k);
    }

    /**
     * Given a [[JsonTerm]] with potentially some unbound variables in the substitution `sub`,
     * this returns a sequence of extended [[Substitution]]s binding the unbound variables to
     * the corresponding parts of the keys in the [[JsonTrie]].
     *
     * `match(key, sub)` is equivalent to `matchWithValue(key, sub).map(([k, _]) => k)`.
     * In particular, `match(key, sub)` is equivalent to unifying key against each result of `keys()`
     * and yielding the resulting [[Substitution]].
     * @param key A [[JsonTerm]] serving as a template to match against.
     * @param sub A [[Substitution]] to extend with bindings found when `key` matches a key in the [[JsonTrie]].
     * @returns An iterable of extended [[Substitution]]s, one for each matching key.
     */
    *match(key: JsonTerm, sub: Substitution<JsonTerm>): Iterable<Substitution<JsonTerm>> {
        for(const t of JsonTrie.matchRec(key, sub, this.trie)) {
            yield t[1];
        }
    }

    /**
     * Given a [[JsonTerm]] with potentially some unbound variables in the substitution `sub`,
     * this returns a sequence of extended [[Substitution]]s binding the unbound variables to
     * the corresponding parts of the keys in the [[JsonTrie]] and the value corresponding to that key.
     *
     * @param key A [[JsonTerm]] serving as a template to match against.
     * @param sub A [[Substitution]] to extend with bindings found when `key` matches a key in the [[JsonTrie]].
     * @returns An iterable of extended [[Substitution]]s, one for each matching key, paired with the corresponding value.
     */
    matchWithValue(key: JsonTerm, sub: Substitution<JsonTerm>): Iterable<[A, Substitution<JsonTerm>]> {
        return JsonTrie.matchRec(key, sub, this.trie);
    }

    /**
     * Conceptually,
     * ```
     * for(const [val, sub] of this.matchWithValue(key, sub)) {
     *      k(sub, val);
     * }
     * ```
     * except more efficient.
     */
    matchCont(key: JsonTerm, sub: Substitution<JsonTerm>, k: (s: Substitution<JsonTerm>, value: A) => void): void {
        return JsonTrie.matchContRec(key, sub, this.trie, k);
    }

    private static *matchRecArray(key: Array<JsonTerm>, i: number, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        if(i < key.length) {
            for(const t of JsonTrie.matchRec(key[i], sub, curr)) {
                yield* JsonTrie.matchRecArray(key, i+1, t[1], t[0]);
            }
        } else {
            if('empty' in curr) yield [curr.empty, sub];
        }
    }

    private static *matchRecObject(key: JsonTerm, keys: Array<string>, i: number, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        if(i < keys.length) {
            let node = curr.more;
            if(node === void(0)) return;
            const k = keys[i];
            node = node[k];
            if(node === void(0)) return;
            for(const t of JsonTrie.matchRec(key[k], sub, node)) {
                yield* JsonTrie.matchRecObject(key, keys, i+1, t[1], t[0]);
            }
        } else {
            if('empty' in curr) yield [curr.empty, sub];
        }
    }

    private static *matchRec(key: JsonTerm, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                if('null' in curr) yield [curr.null, sub];
            } else if(key instanceof Variable) {
                const v = sub.lookupAsVar(key);
                if(v instanceof Variable) { // it's unbound
                    for(const t of JsonTrie.rowRec(curr)) {
                        yield [t[1], sub.bind(v, t[0])];
                    }
                } else {
                    yield* JsonTrie.matchRec(v, sub, curr);
                }
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node !== void(0)) {
                    yield* JsonTrie.matchRecArray(key, 0, sub, node);
                }
            } else { // it's an object
                let node = curr.object;
                if(node !== void(0)) {
                    const keys = Object.keys(key).sort();
                    yield* JsonTrie.matchRecObject(key, keys, 0, sub, node);
                }
            }
        } else if(type === 'undefined') {
            if('undefined' in curr) yield [curr.undefined, sub];
        } else {
            const node = curr[type];
            if(node !== void(0)) {
                if(key in node) yield [node[key], sub];
            }
        }
    }

    private static matchContRecArray(key: Array<JsonTerm>, i: number, sub: Substitution<JsonTerm>, curr: any, k: (s: Substitution<JsonTerm>, v: any) => void): void {
        if(i < key.length) {
            return JsonTrie.matchContRec(key[i], sub, curr, (s, v) => {
                return JsonTrie.matchContRecArray(key, i+1, s, v, k);
            });
        } else {
            if('empty' in curr) return k(sub, curr.empty);
        }
    }

    private static matchContRecObject(key: JsonTerm, keys: Array<string>, i: number, sub: Substitution<JsonTerm>, curr: any, k: (s: Substitution<JsonTerm>, v: any) => void): void {
        if(i < keys.length) {
            let node = curr.more;
            if(node === void(0)) return;
            const ki = keys[i];
            node = node[ki];
            if(node === void(0)) return;
            return JsonTrie.matchContRec(key[ki], sub, node, (s, v) => {
                return JsonTrie.matchContRecObject(key, keys, i+1, s, v, k);
            });
        } else {
            if('empty' in curr) return k(sub, curr.empty);
        }
    }

    private static matchContRec(key: JsonTerm, sub: Substitution<JsonTerm>, curr: any, k: (s: Substitution<JsonTerm>, v: any) => void): void {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                if('null' in curr) return k(sub, curr.null);
            } else if(key instanceof Variable) {
                const v = sub.lookupAsVar(key);
                if(v instanceof Variable) { // it's unbound
                    return JsonTrie.rowContRec(curr, (x, val) => k(sub.bind(v, x), val));
                } else {
                    return JsonTrie.matchContRec(v, sub, curr, k);
                }
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node !== void(0)) {
                    return JsonTrie.matchContRecArray(key, 0, sub, node, k);
                }
            } else { // it's an object
                let node = curr.object;
                if(node !== void(0)) {
                    const keys = Object.keys(key).sort();
                    return JsonTrie.matchContRecObject(key, keys, 0, sub, node, k);
                }
            }
        } else if(type === 'undefined') {
            if('undefined' in curr) return k(sub, curr.undefined);
        } else {
            const node = curr[type];
            if(node !== void(0)) {
                if(key in node) return k(sub, node[key]);
            }
        }
    }

    private static *rowRecObject(curr: any, result: Array<[string, Json]>): Iterable<[Json, any]> {
        if('empty' in curr) {
            const obj: Json = {};
            for(const t of result) {
                obj[t[0]] = t[1];
            }
            yield [obj, curr.empty];
        }
        const moreNode = curr.more;
        if(moreNode === void(0)) return;
        for(const k in moreNode) {
            const node = moreNode[k];
            for(const type in node) {
                switch(type) {
                    case 'array':
                        for(const t of JsonTrie.rowRecArray(node.array, [])) {
                            result.push([k, t[0]]);
                            yield* JsonTrie.rowRecObject(t[1], result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const t of JsonTrie.rowRecObject(node.object, [])) {
                            result.push([k, t[0]]);
                            yield* JsonTrie.rowRecObject(t[1], result);
                            result.pop();
                        }
                        break;
                    case 'null':
                        result.push([k, null]);
                        yield* JsonTrie.rowRecObject(node.null, result);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        yield* JsonTrie.rowRecObject(node.undefined, result);
                        result.pop();
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, convert(type, k2)]);
                            yield* JsonTrie.rowRecObject(valNode[k2], result);
                            result.pop();
                        }
                }
            }
        }
    }

    private static *rowRecArray(curr: any, result: Array<Json>): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    yield [result.slice(), curr.empty];
                    break;
                case 'array':
                    for(const t of JsonTrie.rowRecArray(curr.array, [])) {
                        result.push(t[0]);
                        yield* JsonTrie.rowRecArray(t[1], result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const t of JsonTrie.rowRecObject(curr.object, [])) {
                        result.push(t[0]);
                        yield* JsonTrie.rowRecArray(t[1], result);
                        result.pop();
                    }
                    break;
                case 'null':
                    result.push(null);
                    yield* JsonTrie.rowRecArray(curr.null, result);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    yield* JsonTrie.rowRecArray(curr.undefined, result);
                    result.pop();
                    break;
                case 'number':
                case 'boolean':
                case 'string':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(convert(type, k));
                        yield* JsonTrie.rowRecArray(valNode[k], result);
                        result.pop();
                    }
            }
        }
    }

    private static *rowRec(curr: any): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    yield* JsonTrie.rowRecArray(curr.array, []);
                    break;
                case 'object':
                    yield* JsonTrie.rowRecObject(curr.object, []);
                    break;
                case 'null':
                    yield [null, curr.null];
                    break;
                case 'undefined':
                    yield [void(0), curr.undefined];
                    break;
                case 'number':
                case 'boolean':
                case 'string':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        yield [convert(type, k), valNode[k]];
                    }
            }
        }
    }

    private static rowContRecObject(curr: any, result: Array<[string, Json]>, cont: (key: Json, v: any) => void): void {
        if('empty' in curr) {
            const obj: Json = {};
            for(const t of result) {
                obj[t[0]] = t[1];
            }
            cont(obj, curr.empty);
        }
        const moreNode = curr.more;
        if(moreNode === void(0)) return;
        for(const k in moreNode) {
            const node = moreNode[k];
            for(const type in node) {
                switch(type) {
                    case 'array':
                        JsonTrie.rowContRecArray(node.array, [], (key, v) => {
                            result.push([k, key]);
                            JsonTrie.rowContRecObject(v, result, cont);
                            result.pop();
                        });
                        break;
                    case 'object':
                        JsonTrie.rowContRecObject(node.object, [], (key, v) => {
                            result.push([k, key]);
                            JsonTrie.rowContRecObject(v, result, cont);
                            result.pop();
                        });
                        break;
                    case 'null':
                        result.push([k, null]);
                        JsonTrie.rowContRecObject(node.null, result, cont);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        JsonTrie.rowContRecObject(node.undefined, result, cont);
                        result.pop();
                        break;
                    case 'number':
                    case 'boolean':
                    case 'string':
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, convert(type, k2)]);
                            JsonTrie.rowContRecObject(valNode[k2], result, cont);
                            result.pop();
                        }
                }
            }
        }
    }

    private static rowContRecArray(curr: any, result: Array<Json>, cont: (key: Json, v: any) => void): void {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    cont(result.slice(), curr.empty);
                    break;
                case 'array':
                    JsonTrie.rowContRecArray(curr.array, [], (k, v) => {
                        result.push(k);
                        JsonTrie.rowContRecArray(v, result, cont);
                        result.pop();
                    });
                    break;
                case 'object':
                    JsonTrie.rowContRecObject(curr.object, [], (k, v) => {
                        result.push(k);
                        JsonTrie.rowContRecArray(v, result, cont);
                        result.pop();
                    });
                    break;
                case 'null':
                    result.push(null);
                    JsonTrie.rowContRecArray(curr.null, result, cont);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    JsonTrie.rowContRecArray(curr.undefined, result, cont);
                    result.pop();
                    break;
                case 'number':
                case 'boolean':
                case 'string':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(convert(type, k));
                        JsonTrie.rowContRecArray(valNode[k], result, cont);
                        result.pop();
                    }
            }
        }
    }

    private static rowContRec(curr: any, cont: (key: Json, v: any) => void): void {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    JsonTrie.rowContRecArray(curr.array, [], cont);
                    break;
                case 'object':
                    JsonTrie.rowContRecObject(curr.object, [], cont);
                    break;
                case 'null':
                    cont(null, curr.null);
                    break;
                case 'undefined':
                    cont(void(0), curr.undefined);
                    break;
                case 'number':
                case 'boolean':
                case 'string':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        cont(convert(type, k), valNode[k]);
                    }
            }
        }
    }

    private static lookupRec(key: Json, curr: any): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return void(0);
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrie.lookupRec(key[i], node);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                return node;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) return void(0);
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    node = node.more;
                    if(node === void(0)) return void(0);
                    node = node[k];
                    if(node === void(0)) return void(0);
                    node = JsonTrie.lookupRec(key[k], node);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                return node;
            }
        } else if(type === 'undefined') {
            return curr.undefined;
        } else {
            const node = curr[type];
            if(node === void(0)) return void(0);
            return node[key];
        }
    }

    private static containsRec(key: Json, curr: any): boolean {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return 'null' in curr;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return false;
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrie.lookupRec(key[i], node);
                    if(node === void(0)) return false;
                }
                return 'empty' in node;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) return false;
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    node = node.more;
                    if(node === void(0)) return false;
                    node = node[k];
                    if(node === void(0)) return false;
                    node = JsonTrie.lookupRec(key[k], node);
                    if(node === void(0)) return false;
                }
                return 'empty' in node;
            }
        } else if(type === 'undefined') {
            return 'undefined' in curr;
        } else {
            const node = curr[type];
            if(node === void(0)) false;
            return key in node;
        }
    }

    private static insertRec(key: Json, val: any, curr: any): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                let node = curr.null;
                if(node === void(0)) curr.null = node = val;
                return node;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrie.insertRec(key[i], {}, node);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = val;
                return node2;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[k];
                    if(node3 === void(0)) node2[k] = node3 = {};
                    node = JsonTrie.insertRec(key[k], {}, node3);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = val;
                return node2;
            }
        } else if(type === 'undefined') {
            let node = curr.undefined;
            if(node === void(0)) curr.undefined = node = val;
            return node;
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            let node2 = node[key];
            if(node2 === void(0)) node[key] = node2 = val;
            return node2;
        }
    }

    private static modifyRec<A>(key: Json, f: (a: A | undefined) => A, curr: any): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null = f(curr.null);
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrie.modifyRec(key[i], emptyObjectUnless, node);
                }
                return node.empty = f(node.empty);
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[k];
                    if(node3 === void(0)) node2[k] = node3 = {};
                    node = JsonTrie.modifyRec(key[k], emptyObjectUnless, node3);
                }
                return node.empty = f(node.empty);
            }
        } else if(type === 'undefined') {
            return curr.undefined = f(curr.undefined);
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            return node[key] = f(node[key]);
        }
    }
}

/**
 * The represents a list of [[Variable]]s and a mapping of their IDs onto the
 * interval [0, N) where N is the length of the list of variables. This corresponds
 * to a variable renaming of a term assuming one of the term's variables are have
 * contiguous IDs starting at 0. This also means that [[VarMap]] represents a bijection as
 * you can view the array as a mapping going the other direction.
 */
export type VarMap = {vars: Array<Variable>, [index: number]: number};

/**
 * A key-value mapping keyed by [[JsonTerm]]s modulo variable renaming. That is,
 * a key is in the [[JsonTrieTerm]] if a variant of it, in the logic programming sense, is.
 *
 * For example, a [[JsonTerm]] like `[X, Y]` is a variant of `[Z, W]` and `[X, W]` but not of `[1, Y]` or `[X, X]`
 * where the uppercase letters here represent [[Variable]]s. This is an equivalence relation so `[X, X]` is also
 * not a variant of `[X, Y]`. In particular, this is *not* subsumption.
 *
 * @param A The type of values
 */
export class JsonTrieTerm<A> {
    private constructor(private trie: any = {}) {}

    /**
     * Create a [[JsonTrieTerm]] from a JSON representation of its contents. `json` should not be modified
     * externally after calling this and will be mutated by an [[JsonTrieTerm]] operations that perform mutation.
     *
     * This doesn't verify the validity of the supplied JSON.
     * @param json Expects a JavaScript object that (correctly!) represents a trie. **This won't be copied.**
     * @returns A [[JsonTrieTerm]] built from the passed in object.
     */
    static fromJson<A>(json: Json): JsonTrieTerm<A> {
        return new JsonTrieTerm(json);
    }

    /**
     * Create an empty [[JsonTrieTerm]].
     * @returns An empty [[JsonTrieTerm]].
     */
    static create<A>(): JsonTrieTerm<A> {
        return new JsonTrieTerm();
    }

    private static convert(type: "boolean" | "number" | "string" | "variable", val: string): JsonTerm {
        if(type === 'boolean') return Boolean(val);
        if(type === 'number') return Number(val);
        if(type === 'variable') return new Variable(Number(val));
        return val; // It's a string.
    }

    /**
     * The JSON backing. **This isn't a copy.** This means the object should not be mutated and will be mutated if the [[JsonTrieTerm]] is.
     */
    get json(): Json {
        return this.trie;
    }

    /**
     * Insert `val` at the location represented by `key` overwriting whatever was there.
     * The key comparison is a variant check. See [[JsonTrieTerm]] for an explanation.
     * @param key The [[JsonTerm]] key.
     * @param val The value to insert.
     * @returns `val`
     */
    insert(key: JsonTerm, val: A): A {
        return JsonTrieTerm.insertRec(key, val, this.trie, {count: 0});
    }

    /**
     * Modify the value at the location represented by `key` with the function `f`.
     * The key comparison is a variant check. See [[JsonTrieTerm]] for an explanation.
     *
     * `insert(key, val)` is equivalent to `modify(key, _ => val)`.
     * @param key The [[JsonTerm]] key.
     * @param f A function that will be given the old value or `undefined` if there was no old value.
     * @returns The result of the modification, i.e. the result of `f` on the found value or `undefined`.
     */
    modify(key: JsonTerm, f: (a: A | undefined, exists: boolean) => A): A {
        return JsonTrieTerm.modifyRec(key, f, this.trie, {count: 0});
    }

    /**
     * Modify the value at the location represented by `key` with the function `f`.
     * `f` will additionally be provided with a [[VarMap]] providing a mapping between the
     * unbound [[Variable]]s in `key` and the [[Variable]]s of the key in the [[JsonTrieTerm]]
     * which represents the variable renaming required by the variant check.
     * The key comparison is a variant check. See [[JsonTrieTerm]] for an explanation.
     *
     * `modify(key, f)` is equivalent to `modifyWithVars(key, (x, _) => f(x))`.
     * @param key The [[JsonTerm]] key.
     * @param f A function that will be given the old value or `undefined` if there was no old value.
     * @returns The result of the modification, i.e. the result of `f` on the found value or `undefined`.
     */
    modifyWithVars(key: JsonTerm, f: (a: A | undefined, varMap: VarMap) => A): A {
        return JsonTrieTerm.modifyWithVarsRec(key, f, this.trie, {vars: []});
    }

    /**
     * Empties the trie.
     */
    clear(): void {
        this.trie = {};
    }

    /**
     * Checks whether the `key` is in the [[JsonTrieTerm]]. This is independent of the value stored.
     * The key comparison is a variant check. See [[JsonTrieTerm]] for an explanation.
     * @param key The [[JsonTerm]] key to check.
     * @returns `true` if `key` was found, `false` otherwise.
     */
    contains(key: JsonTerm): boolean {
        return JsonTrieTerm.containsRec(key, this.trie, {count: 0});
    }

    /**
     * Look up the value associated with `key`. If `A | undefined = A` you will not be able to distinguish
     * between not finding a value and a value of `undefined`. Use [[contains]] in that situation.
     * The key comparison is a variant check. See [[JsonTrieTerm]] for an explanation.
     * @param key The [[JsonTerm]] key to look up.
     * @returns The value found or `undefined` if no value was found.
     */
    lookup(key: JsonTerm): A | undefined {
        return JsonTrieTerm.lookupRec(key, this.trie, {count: 0});
    }

    /**
     * The set of keys in the [[JsonTrieTerm]] in no particular order.
     *
     * `keys()` is equivalent to `entries().map(([k, _]) => k)`.
     * @returns An iterable over the keys.
     */
    *keys(): Iterable<JsonTerm> {
        for(const t of JsonTrieTerm.rowRec(this.trie)) {
            yield t[0];
        }
    }

    /**
     * The list of values in the [[JsonTrieTerm]] in no particular order. There will be duplicates if
     * multiple keys mapped to the same value.
     *
     * `values()` is equivalent to `entries().map(([_, v]) => v)`.
     * @returns An iterable over the values.
     */
    *values(): Iterable<A> {
        for(const t of JsonTrieTerm.rowRec(this.trie)) {
            yield t[1];
        }
    }

    /**
     * The list of key-value pairs in the [[JsonTrieTerm]] in no particular order.
     * @returns An iterable of the key-value pairs.
     */
    entries(): Iterable<[JsonTerm, A]> {
        return JsonTrieTerm.rowRec(this.trie);
    }

    /**
     * Behaves as:
     * ```
     * for(const [key, val] of this.entries()) {
     *      k(key, val);
     * }
     * ```
     */
    entriesCont(k: (key: JsonTerm, val: A) => void): void {
        return JsonTrieTerm.rowContRec(this.trie, k);
    }

    private static *rowRecObject(curr: any, result: Array<[string, JsonTerm]>): Iterable<[JsonTerm, any]> {
        if('empty' in curr) {
            const obj: JsonTerm = {};
            for(const t of result) {
                obj[t[0]] = t[1];
            }
            yield [obj, curr.empty];
        }
        const moreNode = curr.more;
        if(moreNode === void(0)) return;
        for(const k in moreNode) {
            const node = moreNode[k];
            for(const type in node) {
                switch(type) {
                    case 'array':
                        for(const t of JsonTrieTerm.rowRecArray(node.array, [])) {
                            result.push([k, t[0]]);
                            yield* JsonTrieTerm.rowRecObject(t[1], result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const t of JsonTrieTerm.rowRecObject(node.object, [])) {
                            result.push([k, t[0]]);
                            yield* JsonTrieTerm.rowRecObject(t[1], result);
                            result.pop();
                        }
                        break;
                    case 'null':
                        result.push([k, null]);
                        yield* JsonTrieTerm.rowRecObject(node.null, result);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        yield* JsonTrieTerm.rowRecObject(node.undefined, result);
                        result.pop();
                        break;
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'variable':
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, JsonTrieTerm.convert(type, k2)]);
                            yield* JsonTrieTerm.rowRecObject(valNode[k2], result);
                            result.pop();
                        }
                        break;
                    // default: // ignore
                }
            }
        }
    }

    private static *rowRecArray(curr: any, result: Array<JsonTerm>): Iterable<[JsonTerm, any]> {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    yield [result.slice(), curr.empty];
                    break;
                case 'array':
                    for(const t of JsonTrieTerm.rowRecArray(curr.array, [])) {
                        result.push(t[0]);
                        yield* JsonTrieTerm.rowRecArray(t[1], result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const t of JsonTrieTerm.rowRecObject(curr.object, [])) {
                        result.push(t[0]);
                        yield* JsonTrieTerm.rowRecArray(t[1], result);
                        result.pop();
                    }
                    break;
                case 'null':
                    result.push(null);
                    yield* JsonTrieTerm.rowRecArray(curr.null, result);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    yield* JsonTrieTerm.rowRecArray(curr.undefined, result);
                    result.pop();
                    break;
                case 'number':
                case 'string':
                case 'boolean':
                case 'variable':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(JsonTrieTerm.convert(type, k));
                        yield* JsonTrieTerm.rowRecArray(valNode[k], result);
                        result.pop();
                    }
                    break;
                //default: // ignore
            }
        }
    }

    private static *rowRec(curr: any): Iterable<[JsonTerm, any]> {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    yield* JsonTrieTerm.rowRecArray(curr.array, []);
                    break;
                case 'object':
                    yield* JsonTrieTerm.rowRecObject(curr.object, []);
                    break;
                case 'null':
                    yield [null, curr.null];
                    break;
                case 'undefined':
                    yield [void(0), curr.undefined];
                    break;
                case 'number':
                case 'string':
                case 'boolean':
                case 'variable':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        yield [JsonTrieTerm.convert(type, k), valNode[k]];
                    }
                    break;
                // default: // ignore
            }
        }
    }

    private static rowContRecObject(curr: any, result: Array<[string, JsonTerm]>, cont: (key: JsonTerm, val: any) => void): void {
        if('empty' in curr) {
            const obj: JsonTerm = {};
            for(const t of result) {
                obj[t[0]] = t[1];
            }
            cont(obj, curr.empty);
        }
        const moreNode = curr.more;
        if(moreNode === void(0)) return;
        for(const k in moreNode) {
            const node = moreNode[k];
            for(const type in node) {
                switch(type) {
                    case 'array':
                        JsonTrieTerm.rowContRecArray(node.array, [], (key, val) => {
                            result.push([k, key]);
                            JsonTrieTerm.rowContRecObject(val, result, cont);
                            result.pop();
                        });
                        break;
                    case 'object':
                        JsonTrieTerm.rowContRecObject(node.object, [], (key, val) => {
                            result.push([k, key]);
                            JsonTrieTerm.rowContRecObject(val, result, cont);
                            result.pop();
                        });
                        break;
                    case 'null':
                        result.push([k, null]);
                        JsonTrieTerm.rowContRecObject(node.null, result, cont);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        JsonTrieTerm.rowContRecObject(node.undefined, result, cont);
                        result.pop();
                        break;
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'variable':
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, JsonTrieTerm.convert(type, k2)]);
                            JsonTrieTerm.rowContRecObject(valNode[k2], result, cont);
                            result.pop();
                        }
                        break;
                    // default: // ignore
                }
            }
        }
    }

    private static rowContRecArray(curr: any, result: Array<JsonTerm>, cont: (key: JsonTerm, val: any) => void): void {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    cont(result.slice(), curr.empty);
                    break;
                case 'array':
                    JsonTrieTerm.rowContRecArray(curr.array, [], (key, val) => {
                        result.push(key);
                        JsonTrieTerm.rowContRecArray(val, result, cont);
                        result.pop();
                    });
                    break;
                case 'object':
                    JsonTrieTerm.rowContRecObject(curr.object, [], (key, val) => {
                        result.push(key);
                        JsonTrieTerm.rowContRecArray(val, result, cont);
                        result.pop();
                    });
                    break;
                case 'null':
                    result.push(null);
                    JsonTrieTerm.rowContRecArray(curr.null, result, cont);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    JsonTrieTerm.rowContRecArray(curr.undefined, result, cont);
                    result.pop();
                    break;
                case 'number':
                case 'string':
                case 'boolean':
                case 'variable':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(JsonTrieTerm.convert(type, k));
                        JsonTrieTerm.rowContRecArray(valNode[k], result, cont);
                        result.pop();
                    }
                    break;
                //default: // ignore
            }
        }
    }

    private static rowContRec(curr: any, cont: (key: JsonTerm, val: any) => void): void {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    JsonTrieTerm.rowContRecArray(curr.array, [], cont);
                    break;
                case 'object':
                    JsonTrieTerm.rowContRecObject(curr.object, [], cont);
                    break;
                case 'null':
                    cont(null, curr.null);
                    break;
                case 'undefined':
                    cont(void(0), curr.undefined);
                    break;
                case 'number':
                case 'string':
                case 'boolean':
                case 'variable':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        cont(JsonTrieTerm.convert(type, k), valNode[k]);
                    }
                    break;
                // default: // ignore
            }
        }
    }

    private static lookupRec(key: JsonTerm, curr: any, varMap: {count: number, [index: number]: number}): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null;
            } else if(key instanceof Variable) {
                let node = curr.variable;
                if(node === void(0)) return void(0);
                let vId = varMap[key.id];
                if(vId === void(0)) {
                    varMap[key.id] = vId = varMap.count++;
                }
                return node[vId];
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return void(0);
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.lookupRec(key[i], node, varMap);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                return node;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) return void(0);
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    node = node.more;
                    if(node === void(0)) return void(0);
                    node = node[k];
                    if(node === void(0)) return void(0);
                    node = JsonTrieTerm.lookupRec(key[k], node, varMap);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                return node;
            }
        } else if(type === 'undefined') {
            return curr.undefined;
        } else {
            const node = curr[type];
            if(node === void(0)) return void(0);
            return node[key];
        }
    }

    private static containsRec(key: JsonTerm, curr: any, varMap: {count: number, [index: number]: number}): boolean {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return 'null' in curr;
            } else if(key instanceof Variable) {
                let node = curr.variable;
                if(node === void(0)) return false;
                let vId = varMap[key.id];
                if(vId === void(0)) {
                    varMap[key.id] = vId = varMap.count++;
                    return true;
                }
                return vId in node;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return false;
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.lookupRec(key[i], node, varMap);
                    if(node === void(0)) return false;
                }
                return 'empty' in node;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) return false;
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    node = node.more;
                    if(node === void(0)) return false;
                    node = node[k];
                    if(node === void(0)) return false;
                    node = JsonTrieTerm.lookupRec(key[k], node, varMap);
                    if(node === void(0)) return false;
                }
                return 'empty' in node;
            }
        } else if(type === 'undefined') {
            return 'undefined' in curr;
        } else {
            const node = curr[type];
            if(node === void(0)) return false
            return key in node;
        }
    }

    private static insertRec(key: JsonTerm, val: any, curr: any, varMap: {count: number, [index: number]: number}): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                let node = curr.null;
                if(node === void(0)) curr.null = node = val;
                return node;
            } else if(key instanceof Variable) {
                let vId = varMap[key.id];
                if(vId === void(0)) varMap[key.id] = vId = varMap.count++;
                let node = curr.variable;
                if(node === void(0)) curr.variable = node = {};
                let node2 = node[vId];
                if(node2 === void(0)) node[vId] = node2 = val;
                return node2;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.insertRec(key[i], {}, node, varMap);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = val;
                return node2;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[k];
                    if(node3 === void(0)) node2[k] = node3 = {};
                    node = JsonTrieTerm.insertRec(key[k], {}, node3, varMap);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = val;
                return node2;
            }
        } else if(type === 'undefined') {
            let node = curr.undefined;
            if(node === void(0)) curr.undefined = node = val;
            return node;
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            let node2 = node[key];
            if(node2 === void(0)) node[key] = node2 = val;
            return node2;
        }
    }

    private static modifyRec<A>(key: JsonTerm, f: (a: A | undefined, exists: boolean) => A, curr: any, varMap: {count: number, [index: number]: number}): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null = f(curr.null, 'null' in curr);
            } else if(key instanceof Variable) {
                let vId = varMap[key.id];
                if(vId === void(0)) varMap[key.id] = vId = varMap.count++;
                let node = curr.variable;
                if(node === void(0)) curr.variable = node = {};
                return node[vId] = f(node[vId], vId in node);
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.modifyRec(key[i], emptyObjectUnless, node, varMap);
                }
                return node.empty = f(node.empty, 'empty' in node);
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[k];
                    if(node3 === void(0)) node2[k] = node3 = {};
                    node = JsonTrieTerm.modifyRec(key[k], emptyObjectUnless, node3, varMap);
                }
                return node.empty = f(node.empty, 'empty' in node);
            }
        } else if(type === 'undefined') {
            return curr.undefined = f(curr.undefined, 'undefined' in curr);
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            return node[key] = f(node[key], key in node);
        }
    }

    private static modifyWithVarsRec<A>(key: JsonTerm, f: (a: A | undefined, varMap: VarMap) => A, curr: any, varMap: VarMap): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null = f(curr.null, varMap);
            } else if(key instanceof Variable) {
                let vId = varMap[key.id];
                if(vId === void(0)) {
                    varMap[key.id] = vId = varMap.vars.length;
                    varMap.vars.push(key);
                }
                let node = curr.variable;
                if(node === void(0)) curr.variable = node = {};
                return node[vId] = f(node[vId], varMap);
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.modifyWithVarsRec(key[i], emptyObjectUnless, node, varMap);
                }
                return node.empty = f(node.empty, varMap);
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(key).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const k = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[k];
                    if(node3 === void(0)) node2[k] = node3 = {};
                    node = JsonTrieTerm.modifyWithVarsRec(key[k], emptyObjectUnless, node3, varMap);
                }
                return node.empty = f(node.empty, varMap);
            }
        } else if(type === 'undefined') {
            return curr.undefined = f(curr.undefined, varMap);
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            return node[key] = f(node[key], varMap);
        }
    }
}

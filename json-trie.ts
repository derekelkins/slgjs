import { Variable, Substitution } from "./unify"

function emptyObjectUnless(x: any): any { return x === void(0) ? {} : x; }

export type Json = any;

export type JsonTerm = Json | Variable;

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
    private constructor(private readonly trie: any = {}) {}

    /**
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
     * The JSON backing. **This isn't a copy.**
     */
    get json(): Json {
        return this.trie;
    }

    insert(key: Json, val: A): A {
        return JsonTrie.insertRec(key, val, this.trie);
    }

    modify(key: Json, f: (a: A | undefined) => A): A {
        return JsonTrie.modifyRec(key, f, this.trie);
    }

    contains(key: Json): boolean {
        return JsonTrie.containsRec(key, this.trie);
    }

    lookup(key: Json): A | undefined {
        return JsonTrie.lookupRec(key, this.trie);
    }

    *keys(): Iterable<Json> {
        for(const [k, _] of JsonTrie.rowRec(this.trie)) {
            yield k;
        }
    }

    *values(): Iterable<A> {
        for(const [_, v] of JsonTrie.rowRec(this.trie)) {
            yield v;
        }
    }

    entries(): Iterable<[Json, A]> {
        return JsonTrie.rowRec(this.trie);
    }

    *match(key: JsonTerm, sub: Substitution<JsonTerm>): Iterable<Substitution<JsonTerm>> {
        for(let [_, s] of JsonTrie.matchRec(key, sub, this.trie)) {
            yield s;
        }
    }

    matchWithValue(key: JsonTerm, sub: Substitution<JsonTerm>): Iterable<[A, Substitution<JsonTerm>]> {
        return JsonTrie.matchRec(key, sub, this.trie);
    }

    private static *matchRecArray(key: Array<JsonTerm>, i: number, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        if(i < key.length) {
            for(const [node, s] of JsonTrie.matchRec(key[i], sub, curr)) {
                yield* JsonTrie.matchRecArray(key, i+1, s, node);
            }
        } else {
            const node = curr.empty;
            if(node !== void(0)) yield [node, sub];
        }
    }

    private static *matchRecObject(key: JsonTerm, keys: Array<string>, i: number, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        if(i < keys.length) {
            let node = curr.more;
            if(node === void(0)) return;
            const k = keys[i];
            node = node[k];
            if(node === void(0)) return;
            for(const [node2, s] of JsonTrie.matchRec(key[k], sub, node)) {
                yield* JsonTrie.matchRecObject(key, keys, i+1, s, node2);
            }
        } else {
            const node = curr.empty;
            if(node !== void(0)) yield [node, sub];
        }
    }

    private static *matchRec(key: JsonTerm, sub: Substitution<JsonTerm>, curr: any): Iterable<[any, Substitution<JsonTerm>]> {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) { 
                const node = curr.null;
                if(node !== void(0)) yield [node, sub];
            } else if(key instanceof Variable) {
                const v = sub.lookupAsVar(key);
                if(v instanceof Variable) { // it's unbound
                    for(let [val, node] of JsonTrie.rowRec(curr)) {
                        yield [node, sub.bind(v, val)];
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
            const node = curr.undefined;
            if(node !== void(0)) yield [node, sub];
        } else {
            let node = curr[type];
            if(node !== void(0)) {
                node = node[key];
                if(node !== void(0)) yield [node, sub];
            }
        }
    }

    private static *rowRecObject(curr: any, result: Array<[string, Json]>): Iterable<[Json, any]> {
        if(curr.empty !== void(0)) {
            const obj: Json = {};
            for(const [k, v] of result) {
                obj[k] = v;
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
                        for(const [key, rest] of JsonTrie.rowRecArray(node.array, []) ){
                            result.push([k, key]);
                            yield* JsonTrie.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const [key, rest] of JsonTrie.rowRecObject(node.array, []) ){
                            result.push([k, key]);
                            yield* JsonTrie.rowRecObject(rest, result);
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
                    for(const [key, rest] of JsonTrie.rowRecArray(curr.array, []) ){
                        result.push(key);
                        yield* JsonTrie.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const [key, rest] of JsonTrie.rowRecObject(curr.object, []) ){
                        result.push(key);
                        yield* JsonTrie.rowRecArray(rest, result);
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

export type VarMap = {vars: Array<Variable>, [index: number]: number};

// Also has variables
export class JsonTrieTerm<A> {
    private constructor(private readonly trie: any = {}) {}

    // Expects a JavaScript object that (correctly!) represents a trie.
    static fromJson<A>(json: Json): JsonTrieTerm<A> {
        return new JsonTrieTerm(json);
    }

    static create<A>(): JsonTrieTerm<A> {
        return new JsonTrieTerm();
    }

    private static convert(type: "boolean" | "number" | "string" | "variable", val: string): JsonTerm {
        if(type === 'boolean') return Boolean(val);
        if(type === 'number') return Number(val);
        if(type === 'variable') return new Variable(Number(val));
        return val; // It's a string.
    }

    get json(): Json {
        return this.trie;
    }

    insert(key: JsonTerm, val: A): A {
        return JsonTrieTerm.insertRec(key, val, this.trie, {count: 0});
    }

    modify(key: JsonTerm, f: (a: A | undefined) => A): A {
        return JsonTrieTerm.modifyRec(key, f, this.trie, {count: 0});
    }

    modifyWithVars(key: JsonTerm, f: (a: A | undefined, varMap: VarMap) => A): A {
        return JsonTrieTerm.modifyWithVarsRec(key, f, this.trie, {vars: []});
    }

    contains(key: JsonTerm): boolean {
        return JsonTrieTerm.containsRec(key, this.trie, {count: 0});
    }

    lookup(key: JsonTerm): A | undefined {
        return JsonTrieTerm.lookupRec(key, this.trie, {count: 0});
    }

    *keys(): Iterable<JsonTerm> {
        for(const [k, _] of JsonTrieTerm.rowRec(this.trie)) {
            yield k;
        }
    }

    *values(): Iterable<A> {
        for(const [_, v] of JsonTrieTerm.rowRec(this.trie)) {
            yield v;
        }
    }

    entries(): Iterable<[JsonTerm, A]> {
        return JsonTrieTerm.rowRec(this.trie);
    }

    private static *rowRecObject(curr: any, result: Array<[string, JsonTerm]>): Iterable<[JsonTerm, any]> {
        if(curr.empty !== void(0)) {
            const obj: JsonTerm = {};
            for(const [k, v] of result) {
                obj[k] = v;
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
                        for(const [key, rest] of JsonTrieTerm.rowRecArray(node.array, []) ){
                            result.push([k, key]);
                            yield* JsonTrieTerm.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const [key, rest] of JsonTrieTerm.rowRecObject(node.array, []) ){
                            result.push([k, key]);
                            yield* JsonTrieTerm.rowRecObject(rest, result);
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
                    for(const [key, rest] of JsonTrieTerm.rowRecArray(curr.array, []) ){
                        result.push(key);
                        yield* JsonTrieTerm.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const [key, rest] of JsonTrieTerm.rowRecObject(curr.object, []) ){
                        result.push(key);
                        yield* JsonTrieTerm.rowRecArray(rest, result);
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

    private static modifyRec<A>(key: JsonTerm, f: (a: A | undefined) => A, curr: any, varMap: {count: number, [index: number]: number}): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null = f(curr.null);
            } else if(key instanceof Variable) {
                let vId = varMap[key.id];
                if(vId === void(0)) varMap[key.id] = vId = varMap.count++;
                let node = curr.variable;
                if(node === void(0)) curr.variable = node = {};
                return node[vId] = f(node[vId]);
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = JsonTrieTerm.modifyRec(key[i], emptyObjectUnless, node, varMap);
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
                    node = JsonTrieTerm.modifyRec(key[k], emptyObjectUnless, node3, varMap);
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

/*
(function() {
    const trie = JsonTrieTerm.create<number>();
    trie.insert([null, {start: 1, end: 2}], 0);
    trie.insert([null, {start: 1, end: 3}], 1);
    trie.insert(['foo', {start: 1, end: 3}], 2);
    trie.insert({start: 1, end: 2}, 3);
    trie.insert({start: 1, end: 3}, 4);
    trie.insert([1,2], 5);
    trie.insert([1,3], 6);
    trie.insert({}, 7);
    trie.insert({ foo: new Variable(0), bar: new Variable(0) }, 8);
    console.log(JSON.stringify(trie.json));
    console.log(trie.contains(['foo', {start: 1, end: 3}]));
    console.log(trie.contains({foo: new Variable(0), bar: new Variable(0)})); // true
    console.log(trie.contains({foo: new Variable(1), bar: new Variable(0)})); // false
    console.log(trie.contains({foo: new Variable(0), bar: new Variable(1)})); // false
    console.log(trie.contains({foo: new Variable(1), bar: new Variable(1)})); // true
    const rows = [];
    for(const row of trie.entries()) { rows.push(row); }
    console.dir(rows, {depth: null});

    const trie2 = JsonTrie.create<number>();
    trie2.insert([null, {start: 1, end: 2}], 0);
    trie2.insert([null, {start: 1, end: 3}], 1);
    trie2.insert(['foo', {start: 1, end: 3}], 2);
    trie2.insert({start: 1, end: 2}, 3);
    trie2.insert({start: 1, end: 3}, 4);
    trie2.insert([1,2], 5);
    trie2.insert([1,3], 6);
    trie2.insert({}, 7);
    trie2.insert({foo: {start: 1, end: 2}, end: 3}, 8);
    trie2.insert({foo: {start: 1, end: 3}, end: 3}, 9);
    const matches = [];
    const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
    for(const s of trie2.match({start: X, end: Y}, sub)) { 
        matches.push([s.lookup(X), s.lookup(Y)]); 
    }
    console.dir(matches, {depth: null});
    matches.length = 0;
    for(const s of trie2.match([X, Y], sub)) { 
        matches.push([s.lookup(X), s.lookup(Y)]); 
    }
    console.dir(matches, {depth: null});
    matches.length = 0;
    for(const s of trie2.match({foo: {start: X, end: Y}, end: Y}, sub)) { 
        matches.push([s.lookup(X), s.lookup(Y)]); 
    }
    console.dir(matches, {depth: null});
})();
*/

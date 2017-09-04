import { Variable, Substitution } from "./unify"

type Json = any;

function convert(type: string, val: string): Json {
    if(type === 'boolean') return Boolean(val);
    if(type === 'number') return Number(val);
    return val; // It's a string. TODO: Assertion.
}

export default class JsonTrie<A> {
    private constructor(private readonly trie: any = {}) {}

    // Expects a JavaScript object that (correctly!) represents a trie.
    static fromJson<A>(json: Json): JsonTrie<A> {
        return new JsonTrie(json);
    }

    static create<A>(): JsonTrie<A> {
        return new JsonTrie();
    }

    get json(): Json {
        return this.trie;
    }

    insert(key: Json, val: A): void {
        this.insertRec(key, val, this.trie);
    }

    contains(key: Json): boolean {
        return this.lookup(key) !== void(0);
    }

    lookup(key: Json): A {
        return this.lookupRec(key, this.trie);
    }

    *keys(): Iterable<Json> {
        for(const [v, _] of this.rowRec(this.trie)) {
            yield v;
        }
    }

    *values(): Iterable<A> {
        for(const [_, v] of this.rowRec(this.trie)) {
            yield v;
        }
    }

    *entries(): Iterable<[Json, A]> {
        yield* this.rowRec(this.trie);
    }

    private *rowRecObject(curr: any, result: Array<[string, Json]>): Iterable<[Json, any]> {
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
                        for(const [key, rest] of this.rowRecArray(node.array, []) ){
                            result.push([k, key]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const [key, rest] of this.rowRecObject(node.array, []) ){
                            result.push([k, key]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'null':
                        result.push([k, null]);
                        yield* this.rowRecObject(node.null, result);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        yield* this.rowRecObject(node.undefined, result);
                        result.pop();
                        break;
                    default: // 'number', 'string', 'boolean'
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, convert(type, k2)]);
                            yield* this.rowRecObject(valNode[k2], result);
                            result.pop();
                        }
                }
            }
        }
    }

    private *rowRecArray(curr: any, result: Array<Json>): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    yield [result.slice(), curr.empty];
                    break;
                case 'array':
                    for(const [key, rest] of this.rowRecArray(curr.array, []) ){
                        result.push(key);
                        yield* this.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const [key, rest] of this.rowRecObject(curr.object, []) ){
                        result.push(key);
                        yield* this.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'null':
                    result.push(null);
                    yield* this.rowRecArray(curr.null, result);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    yield* this.rowRecArray(curr.undefined, result);
                    result.pop();
                    break;
                default: // 'number', 'string', 'boolean'
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(convert(type, k));
                        yield* this.rowRecArray(valNode[k], result);
                        result.pop();
                    }
            }
        }
    }

    private *rowRec(curr: any): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    yield* this.rowRecArray(curr.array, []);
                    break;
                case 'object':
                    yield* this.rowRecObject(curr.object, []);
                    break;
                case 'null':
                    yield [null, curr.null];
                    break;
                case 'undefined':
                    yield [void(0), curr.undefined];
                    break;
                default: // 'number', 'string', 'boolean'
                    const valNode = curr[type];
                    for(const k in valNode) {
                        yield [convert(type, k), valNode[k]];
                    }
            }
        }
    }

    private lookupRec(key: Json, curr: any): any {
        const type = typeof key;
        if(type === 'object') {
            if(key === null) {
                return curr.null;
            } else if(key instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return void(0);
                const len = key.length;
                for(let i = 0; i < len; ++i) {
                    node = this.lookupRec(key[i], node);
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
                    node = this.lookupRec(key[k], node);
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

    private insertRec(key: Json, val: any, curr: any): any {
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
                    node = this.insertRec(key[i], {}, node); // TODO: Is this what we want?
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
                    node = this.insertRec(key[k], {}, node3); // TODO: see above
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
}

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

    private static convert(type: string, val: string): Json {
        if(type === 'boolean') return Boolean(val);
        if(type === 'number') return Number(val);
        if(type === 'variable') return new Variable(Number(val));
        return val; // It's a string. TODO: Assertion.
    }

    get json(): Json {
        return this.trie;
    }

    insert(key: Json, val: A): void {
        this.insertRec(key, val, this.trie, {count: 0});
    }

    contains(key: Json): boolean {
        return this.lookup(key) !== void(0);
    }

    lookup(key: Json): A {
        return this.lookupRec(key, this.trie, {count: 0});
    }

    *keys(): Iterable<Json> {
        for(const [k, _] of this.rowRec(this.trie)) {
            yield k;
        }
    }

    *values(): Iterable<A> {
        for(const [_, v] of this.rowRec(this.trie)) {
            yield v;
        }
    }

    *entries(): Iterable<[Json, A]> {
        yield* this.rowRec(this.trie);
    }

    private *rowRecObject(curr: any, result: Array<[string, Json]>): Iterable<[Json, any]> {
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
                        for(const [key, rest] of this.rowRecArray(node.array, []) ){
                            result.push([k, key]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const [key, rest] of this.rowRecObject(node.array, []) ){
                            result.push([k, key]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'null':
                        result.push([k, null]);
                        yield* this.rowRecObject(node.null, result);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([k, void(0)]);
                        yield* this.rowRecObject(node.undefined, result);
                        result.pop();
                        break;
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'variable':
                        const valNode = node[type];
                        for(const k2 in valNode) {
                            result.push([k, JsonTrieTerm.convert(type, k2)]);
                            yield* this.rowRecObject(valNode[k2], result);
                            result.pop();
                        }
                        break;
                    // default: // ignore
                }
            }
        }
    }

    private *rowRecArray(curr: any, result: Array<Json>): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    yield [result.slice(), curr.empty];
                    break;
                case 'array':
                    for(const [key, rest] of this.rowRecArray(curr.array, []) ){
                        result.push(key);
                        yield* this.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const [key, rest] of this.rowRecObject(curr.object, []) ){
                        result.push(key);
                        yield* this.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'null':
                    result.push(null);
                    yield* this.rowRecArray(curr.null, result);
                    result.pop();
                    break;
                case 'undefined':
                    result.push(void(0));
                    yield* this.rowRecArray(curr.undefined, result);
                    result.pop();
                    break;
                case 'number':
                case 'string':
                case 'boolean':
                case 'variable':
                    const valNode = curr[type];
                    for(const k in valNode) {
                        result.push(JsonTrieTerm.convert(type, k));
                        yield* this.rowRecArray(valNode[k], result);
                        result.pop();
                    }
                    break;
                //default: // ignore
            }
        }
    }

    private *rowRec(curr: any): Iterable<[Json, any]> {
        for(const type in curr) {
            switch(type) {
                case 'array':
                    yield* this.rowRecArray(curr.array, []);
                    break;
                case 'object':
                    yield* this.rowRecObject(curr.object, []);
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

    private lookupRec(key: Json, curr: any, varMap: {count: number, [index: number]: number}): any {
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
                    node = this.lookupRec(key[i], node, varMap);
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
                    node = this.lookupRec(key[k], node, varMap);
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

    private insertRec(key: Json, val: any, curr: any, varMap: {count: number, [index: number]: number}): any {
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
                    node = this.insertRec(key[i], {}, node, varMap);
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
                    node = this.insertRec(key[k], {}, node3, varMap);
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
}

(function() {
    const trie = JsonTrie.create<number>();
    trie.insert([null, {start: 1, end: 2}], 0);
    trie.insert([null, {start: 1, end: 3}], 1);
    trie.insert(['foo', {start: 1, end: 3}], 2);
    trie.insert({start: 1, end: 2}, 3);
    trie.insert({start: 1, end: 3}, 4);
    trie.insert([1,2], 5);
    trie.insert([1,3], 6);
    trie.insert({}, 7);
    //trie.insert({ foo: new Variable(0), bar: new Variable(0) }, 8);
    console.log(JSON.stringify(trie.json));
    console.log(trie.contains(['foo', {start: 1, end: 3}]));
    //console.log(trie.contains({foo: new Variable(0), bar: new Variable(0)}));
    //console.log(trie.contains({foo: new Variable(1), bar: new Variable(0)}));
    const rows = [];
    for(const row of trie.entries()) { rows.push(row); }
    console.dir(rows, {depth: null});
})();

export default class JsonTrie {
    private readonly trie: any = {}
    constructor() {}

    get json(): any {
        return this.trie;
    }

    insert(val: any): void {
        this.insertRec(val, this.trie);
    }

    contains(val: any): boolean {
        return this.lookup(val, this.trie) !== void(0);
    }

    private static convert(type: string, val: string): any {
        if(type === 'boolean') return Boolean(val);
        if(type === 'number') return Number(val);
        return val; // It's a string. TODO: Assertion.
    }

    *rows(): Iterable<any> {
        for(const [v, _] of this.rowRec(this.trie)) {
            yield v;
        }
    }

    private *rowRecObject(curr: any, result: Array<[string, any]>): Iterable<[any, any]> {
        if(curr.empty !== void(0)) {
            const obj: any = {};
            for(const [k, v] of result) {
                obj[k] = v;
            }
            yield [obj, curr.empty];

        }
        const moreNode = curr.more;
        if(moreNode === void(0)) return;
        for(const key in moreNode) {
            const node = moreNode[key];
            for(const type in node) {
                switch(type) {
                    case 'array':
                        for(const [val, rest] of this.rowRecArray(node.array, []) ){
                            result.push([key, val]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'object':
                        for(const [val, rest] of this.rowRecObject(node.array, []) ){
                            result.push([key, val]);
                            yield* this.rowRecObject(rest, result);
                            result.pop();
                        }
                        break;
                    case 'null':
                        result.push([key, null]);
                        yield* this.rowRecObject(node.null, result);
                        result.pop();
                        break;
                    case 'undefined':
                        result.push([key, void(0)]);
                        yield* this.rowRecObject(node.undefined, result);
                        result.pop();
                        break;
                    default: // 'number', 'string', 'boolean'
                        const valNode = node[type];
                        for(const k in valNode) {
                            result.push([key, JsonTrie.convert(type, k)]);
                            yield* this.rowRecObject(valNode[k], result);
                            result.pop();
                        }
                }
            }
        }
    }

    private *rowRecArray(curr: any, result: Array<any>): Iterable<[any, any]> {
        for(const type in curr) {
            switch(type) {
                case 'empty':
                    yield [result.slice(), curr.empty];
                    break;
                case 'array':
                    for(const [val, rest] of this.rowRecArray(curr.array, []) ){
                        result.push(val);
                        yield* this.rowRecArray(rest, result);
                        result.pop();
                    }
                    break;
                case 'object':
                    for(const [val, rest] of this.rowRecObject(curr.object, []) ){
                        result.push(val);
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
                    for(const key in valNode) {
                        result.push(JsonTrie.convert(type, key));
                        yield* this.rowRecArray(valNode[key], result);
                        result.pop();
                    }
            }
        }
    }

    private *rowRec(curr: any): Iterable<[any, any]> {
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
                    for(const key in valNode) {
                        yield [JsonTrie.convert(type, key), valNode[key]];
                    }
            }
        }
    }

    private lookup(val: any, curr: any): any {
        const type = typeof val;
        if(type === 'object') {
            if(val === null) {
                return curr.null;
            } else if(val instanceof Array) {
                let node = curr.array;
                if(node === void(0)) return void(0);
                const len = val.length;
                for(let i = 0; i < len; ++i) {
                    node = this.lookup(val[i], node);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                if(node === void(0)) return void(0);
                return node;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) return void(0);
                const keys = Object.keys(val).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const key = keys[i];
                    node = node.more;
                    if(node === void(0)) return void(0);
                    node = node[key];
                    if(node === void(0)) return void(0);
                    node = this.lookup(val[key], node);
                    if(node === void(0)) return void(0);
                }
                node = node.empty;
                if(node === void(0)) return void(0);
                return node;
            }
        } else if(type === 'undefined') {
            return curr.undefined;
        } else {
            const node = curr[type];
            if(node === void(0)) return void(0);
            return node[val];
        }
    }

    private insertRec(val: any, curr: any): any {
        const type = typeof val;
        if(type === 'object') {
            if(val === null) {
                let node = curr.null;
                if(node === void(0)) curr.null = node = {};
                return node;
            } else if(val instanceof Array) {
                let node = curr.array;
                if(node === void(0)) curr.array = node = {};
                const len = val.length;
                for(let i = 0; i < len; ++i) {
                    node = this.insertRec(val[i], node);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = {};
                return node2;
            } else { // it's an object
                let node = curr.object;
                if(node === void(0)) curr.object = node = {};
                const keys = Object.keys(val).sort();
                const len = keys.length;
                for(let i = 0; i < len; ++i) {
                    const key = keys[i];
                    let node2 = node.more;
                    if(node2 === void(0)) node.more = node2 = {};
                    let node3 = node2[key];
                    if(node3 === void(0)) node2[key] = node3 = {};
                    node = this.insertRec(val[key], node3);
                }
                let node2 = node.empty;
                if(node2 === void(0)) node.empty = node2 = {};
                return node2;
            }
        } else if(type === 'undefined') {
            let node = curr.undefined;
            if(node === void(0)) curr.undefined = node = {};
            return node;
        } else {
            let node = curr[type];
            if(node === void(0)) curr[type] = node = {};
            let node2 = node[val];
            if(node2 === void(0)) node[val] = node2 = {};
            return node2;
        }
    }
}

(function() {
    const trie = new JsonTrie();
    trie.insert([null, {start: 1, end: 2}]);
    trie.insert([null, {start: 1, end: 3}]);
    trie.insert(['foo', {start: 1, end: 3}]);
    trie.insert({start: 1, end: 2});
    trie.insert({start: 1, end: 3});
    trie.insert([1,2]);
    trie.insert([1,3]);
    trie.insert({});
    console.log(JSON.stringify(trie.json));
    console.log(trie.contains(['foo', {start: 1, end: 3}]));
    const rows = [];
    for(const row of trie.rows()) { rows.push(row); }
    console.log(rows);
})();

// Also has variables
export class JsonTrieTerm {

}

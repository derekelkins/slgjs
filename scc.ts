type UFNode<A> = {id: number, value: A}

export class EphemeralUnionFind<A> {
    private readonly ranks: Array<number>; 
    private readonly parents: Array<UFNode<A> | number>;
    private freeListHead: number = -1;
    private sbrk: number = 0;
    constructor(initialCapacity: number = 10) { 
        const rs = this.ranks = new Array<number>(initialCapacity);
        const ps = this.parents = new Array<UFNode<A> | number>(initialCapacity);
        for(let i = 0; i < initialCapacity; ++i) {
            rs[i] = 0;
        }
    }

    newId(makeNode: (id: number) => A): A {
        if(this.freeListHead === -1) {
            const len = this.ranks.length;
            const id = this.sbrk++;
            if(id >= len) this.grow();
            const val = makeNode(id);
            this.parents[id] = {id: id, value: val};
            return val;
        } else {
            const id = this.freeListHead;
            if(typeof this.parents[id] !== 'number') throw new Error('EphemeralUnionFind.newId: shouldn\'t happen'); // ASSERTION
            this.freeListHead = <number>this.parents[id];
            const val = makeNode(id);
            this.parents[id] = {id: id, value: val};
            return val;
        }
    }

    freeId(id: number): void {
        this.parents[id] = this.freeListHead;
        this.freeListHead = id;
    }

    private grow(): void {
        const rs = this.ranks;
        const len = rs.length;
        const newSize = 2*len;
        for(let i = len; i < newSize; ++i) {
            rs[i] = 0;
        }
    }

    find(id: number): A {
        return this.findAux(id).value;
    }

    private findAux(i: number): UFNode<A> {
        if(typeof this.parents[i] !== 'object') throw new Error('EphemeralUnionFind.findAux: searching for unallocated or free id.'); // ASSERTION
        const v = <UFNode<A>>this.parents[i];
        const fi = v.id;
        if(fi === i) {
            return v;
        } else {
            return this.parents[i] = this.findAux(fi);
        }
    }

    combineVariable(x: number, y: number, combine: (x: A, y: A) => A): void {
        const vx = this.findAux(x);
        const vy = this.findAux(y);
        const cx = vx.id;
        const cy = vy.id;
        if (cx !== cy) {
            const rx = this.ranks[cx];
            const ry = this.ranks[cy];
            if (rx > ry) {
                vx.value = combine(vx.value, vy.value);
                this.parents[cy] = vx;
            } else if(rx < ry) {
                vy.value = combine(vx.value, vy.value);
                this.parents[cx] = vy;
            } else {
                this.ranks[cy]++;
                vy.value = combine(vx.value, vy.value);
                this.parents[cx] = vy;
            }
        }
    }
}


// See "A New Approach to Incremental Cycle Detection and Related Problems" SCC maintenance algorithm
// as described in section 5.1 with the simplifying modification described at the end of the section that
// removes the need for the bitmap, M, and deleting edges.

class EdgeSet {
    private set: {[src: number]: {[tgt: number]: boolean}} = {};

    addEdge(srcId: number, tgtId: number): void {
        let tgtSet = this.set[srcId];
        if(tgtSet === void(0)) this.set[srcId] = tgtSet = {};
        tgtSet[tgtId] = true;
    }

    clear(): void {
        this.set = {};
    }

    union(other: EdgeSet): void {
        for(const [srcId, tgtId] of other.enumerate()) {
            this.addEdge(srcId, tgtId);
        }
    }

    *enumerate(): Iterable<[number, number]> {
        const srcSet = this.set;
        for(const srcId in srcSet) {
            for(const tgtId in srcSet[srcId]) {
                yield [Number(srcId), Number(tgtId)]; // JavaScript makes me cry.
            }
        }
    }
}

class Node {
    level = 1; // k
    marked = false;
    readonly inEdges: EdgeSet = new EdgeSet(); // in
    readonly outEdges: EdgeSet = new EdgeSet(); // out
    constructor(readonly id: number) {}

    dfsBackward(visitor: (srcId: number, tgt: Node) => Node | 'skip' | 'stop'): boolean {
        for(const [srcId, _] of this.inEdges.enumerate()) {
            const result = visitor(srcId, this);
            if(result === 'skip') continue;
            if(result === 'stop') return false;
            if(!result.dfsBackward(visitor)) return false;
        }
        return true;
    }

    dfsForward(visitor: (src: Node, tgtId: number) => Node | 'skip'): void {
        for(const [_, tgtId] of this.outEdges.enumerate()) {
            const result = visitor(this, tgtId);
            if(result === 'skip') continue;
            result.dfsForward(visitor);
        }
    }
}

class Graph {
    private readonly uf: EphemeralUnionFind<Node> = new EphemeralUnionFind(100);
    private nodeCount = 0; // n
    private edgeCount = 0; // m

    display(): void {
        const components: {[index: number]: Array<number>} = {};
        const len = this.nodeCount;
        for(let i = 0; i < len; ++i) {
            const sccId = this.uf.find(i).id;
            let nodes = components[sccId];
            if(nodes === void(0)) components[sccId] = nodes = [];
            nodes.push(i);
        }
        //console.dir(components, {depth: null});
        console.log(JSON.stringify(components));
    }

    createNode(): Node {
        this.nodeCount++;
        return this.uf.newId(id => new Node(id));
    }

    // Assumes self-loops or multiple edges will not be added.
    addEdge(vId: number, wId: number): void {
        // Step 1 (test order)
        const u = this.uf.find(vId);
        const z = this.uf.find(wId);
        if(u.level >= z.level) {
            // Step 2 (search backward)
            let cycle = false;
            let delta = Math.ceil(Math.sqrt(this.edgeCount));
            let visited: {[id: number]: boolean} = {}; // B
            visited[u.id] = true;
            u.dfsBackward((xId, y) => {
                const x = this.uf.find(xId);
                if(x.id === y.id || x.level !== u.level || visited[x.id] !== void(0)) return 'skip'; // A loop ignore.
                --delta;
                if(x.id === z.id) {
                    cycle = true;
                    return delta === 0 ? 'stop': 'skip';
                }
                if(visited[x.id] === void(0)) {
                    visited[x.id] = true;
                    return delta === 0 ? 'stop': x;
                }
                return delta === 0 ? 'stop': 'skip';
            });
            if(delta === 0 || z.level !== u.level) {
                if(delta !== 0) { // then z.level < u.level
                    z.level = u.level;
                } else { // z.level <= u.level
                    z.level = u.level + 1;
                    visited = {};
                    visited[u.id] = true;
                }
                z.inEdges.clear();
                // Step 3 (search forward)
                z.dfsForward((x, yId) => {
                    const y = this.uf.find(yId);
                    if(visited[y.id] !== void(0)) cycle = true;
                    if(y.level === z.level) {
                        y.inEdges.addEdge(x.id, yId);
                    } else if(y.level < z.level) {
                        y.level = z.level;
                        y.inEdges.clear();
                        y.inEdges.addEdge(x.id, yId);
                        return y; // Only follow outgoing arcs for canonical vertices whose level increases (i.e. is incremented)
                    }
                    return 'skip';
                });
            } 
            // Step 4 (form component)
            if(cycle) {
                cycle = false;
                z.marked = true;
                visited = {}; // reusing the variable
                visited[u.id] = true;
                const markedNodes: Array<Node> = [];
                const loop: (xId: number, y: Node) => 'skip' = (xId, y) => {
                    const x = this.uf.find(xId);
                    if(x.id === y.id || x.level !== u.level) return 'skip'; // A loop ignore.
                    if(x.marked && !y.marked) {
                        y.marked = true;
                        markedNodes.push(y);
                    } else if(visited[x.id] === void(0)) {
                        visited[x.id] = true;
                        x.dfsBackward(loop);
                        if(x.marked && !y.marked) {
                            y.marked = true;
                            markedNodes.push(y);
                        }
                    }
                    return 'skip';
                };
                u.dfsBackward(loop);

                const len = markedNodes.length;
                for(let i = 0; i < len; ++i) {
                    const x = markedNodes[i];
                    this.uf.combineVariable(z.id, x.id, (z, x) => { 
                        z.inEdges.union(x.inEdges);
                        z.outEdges.union(x.outEdges);
                        return z;
                    });
                    x.marked = false;
                }
                z.marked = false;
            }
        }

        // Step 5 (add edge)
        u.outEdges.addEdge(vId, wId);
        if(u.level === z.level) {
            z.inEdges.addEdge(vId, wId);
        }
        this.edgeCount++;
    }
}

(() => {
let g = new Graph();
g.createNode();
g.createNode();
g.addEdge(0,1);
g.addEdge(1,0);
g.display();
g = new Graph();
const n0 = g.createNode();
const n1 = g.createNode();
const n2 = g.createNode();
const n3 = g.createNode();
const n4 = g.createNode();
const n5 = g.createNode();
const n6 = g.createNode();
g.addEdge(0,1);
g.addEdge(1,2);
g.addEdge(2,3);
g.addEdge(3,4);
g.addEdge(4,5);
g.addEdge(5,6);
g.display();
g.addEdge(6,4);
g.display();
g.addEdge(3,0);
g.display();
g.addEdge(4,3);
g.display();
})();

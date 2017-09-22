// import { Gen } from "./jsqc"
// import "./ts-jsqc"

import { Variable, Substitution, Json, JsonTerm } from "./unify"
import { JsonTrieTerm, JsonTrie } from "./json-trie"
import "jest"

function makeTestJsonTrie(): JsonTrie<number | undefined> {
    const trie = JsonTrie.create<number | undefined>();
    trie.insert([null, {start: 1, end: 2}], void(0));
    trie.insert([null, {start: 1, end: 3}], 1);
    trie.insert(['foo', {start: 1, end: 3}], 2);
    trie.insert({start: 1, end: 2}, 3);
    trie.insert({start: 1, end: 3}, 4);
    trie.insert([1,2], 5);
    trie.insert([1,3], 6);
    trie.insert({}, 7);
    trie.insert({foo: {start: 1, end: 2}, end: 3}, 8);
    trie.insert({foo: {start: 1, end: 3}, end: 3}, 9);
    return trie;
}

describe('JsonTrie tests', () => {
    const trie = makeTestJsonTrie();

    test('successful lookup', () => {
        expect(trie.lookup([1,2])).toBe(5);
    });

    test('successful undefined lookup', () => {
        expect(trie.lookup([null, {start: 1, end: 2}])).toBeUndefined();
    });

    test('successful undefined contains', () => {
        expect(trie.contains([null, {start: 1, end: 2}])).toBeTruthy();
    });

    test('unsuccessful lookup', () => {
        expect(trie.lookup([1,5])).toBeUndefined();
    });

    test('unsuccessful contains', () => {
        expect(trie.contains([1,5])).toBeFalsy();
    });

    test('successful array lookup', () => {
        expect(trie.contains([1, 2])).toBeTruthy();
    });

    test('unsuccessful array lookup', () => {
        expect(trie.contains([1, 4])).not.toBeTruthy();
    });

    test('successful object lookup', () => {
        expect(trie.contains({start: 1, end: 3})).toBeTruthy();
    });

    test('unsuccessful object lookup', () => {
        expect(trie.contains({start:2, end: 3})).not.toBeTruthy();
    });

    test('successful complex lookup', () => {
        expect(trie.contains(['foo', {start: 1, end: 3}])).toBeTruthy();
    });

    test('unsuccessful complex lookup', () => {
        expect(trie.contains(['foo', {start: 2, end: 3}])).not.toBeTruthy();
    });

    test('correct number of entries', () => {
        const rows = [];
        for(const row of trie.entries()) { rows.push(row); }
        expect(rows.length).toBe(10);
    });

    test('correct number of entries, entriesCont', () => {
        const rows: Array<[Json, number | undefined]> = [];
        trie.entriesCont((k, v) => { rows.push([k, v]); });
        expect(rows).toEqual([
            [[null, {end: 2, start: 1}], void(0)],
            [[null, {end: 3, start: 1}], 1],
            [['foo', {end: 3, start: 1}], 2],
            [[1, 2], 5],
            [[1, 3], 6],
            [{}, 7],
            [{end: 2, start: 1}, 3],
            [{end: 3, start: 1}, 4],
            [{end: 3, foo: {end: 2, start: 1}}, 8],
            [{end: 3, foo: {end: 3, start: 1}}, 9]
        ]);
    });

    test('match object pattern', () => {
        const matches = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        for(const s of trie.match({start: X, end: Y}, sub)) {
            matches.push([s.lookup(X), s.lookup(Y)]);
        }
        expect(matches).toEqual([ // TODO: Note order isn't guaranteed.
            [1, 2],
            [1, 3]
        ]);
    });

    test('match array pattern', () => {
        const matches = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        for(const s of trie.match([X, Y], sub)) {
            matches.push([s.lookup(X), s.lookup(Y)]);
        }
        expect(matches).toEqual([ // TODO: Note order isn't guaranteed.
            [null, {end: 2, start: 1}],
            [null, {end: 3, start: 1}],
            ['foo', {end: 3, start: 1}],
            [1, 2],
            [1, 3]
        ]);
    });

    test('match nonlinear pattern', () => {
        const matches = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        for(const s of trie.match({foo: {start: X, end: Y}, end: Y}, sub)) {
            matches.push([s.lookup(X), s.lookup(Y)]);
        }
        expect(matches).toEqual([
            [1, 3]
        ]);
    });

    test('matchCont object pattern', () => {
        const matches: Array<[Json, Json]> = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        trie.matchCont({start: X, end: Y}, sub, s => {
            matches.push([s.lookup(X), s.lookup(Y)]);
        });
        expect(matches).toEqual([ // TODO: Note order isn't guaranteed.
            [1, 2],
            [1, 3]
        ]);
    });

    test('matchCont array pattern', () => {
        const matches: Array<[Json, Json]> = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        trie.matchCont([X, Y], sub, s => {
            matches.push([s.lookup(X), s.lookup(Y)]);
        });
        expect(matches).toEqual([ // TODO: Note order isn't guaranteed.
            [null, {end: 2, start: 1}],
            [null, {end: 3, start: 1}],
            ['foo', {end: 3, start: 1}],
            [1, 2],
            [1, 3]
        ]);
    });

    test('matchCont nonlinear pattern', () => {
        const matches: Array<[Json, Json]> = [];
        const [[X, Y], sub] = Substitution.emptyPersistent().fresh(2);
        trie.matchCont({foo: {start: X, end: Y}, end: Y}, sub, s => {
            matches.push([s.lookup(X), s.lookup(Y)]);
        });
        expect(matches).toEqual([
            [1, 3]
        ]);
    });

    test('modify test', () => {
        const localTrie = makeTestJsonTrie();
        localTrie.modify([null, {start: 1, end: 2}], () => 100);
        localTrie.modify(['foo', {start: 1, end: 3}], () => 100);
        localTrie.modify({start: 1, end: 2}, () => 100);
        localTrie.modify([1,3], x => (<number>x)+100);
        localTrie.modify({}, () => 100);
        localTrie.modify({foo: {start: 1, end: 3}, end: 3}, () => 100);
        const results: Array<Json> = [];
        localTrie.entriesCont((k, v) => results.push([k, v]));
        expect(results).toEqual([
            [[null, {end: 2, start: 1}], 100],
            [[null, {end: 3, start: 1}], 1],
            [['foo', {end: 3, start: 1}], 100],
            [[1, 2], 5],
            [[1, 3], 106],
            [{}, 100],
            [{end: 2, start: 1}, 100],
            [{end: 3, start: 1}, 4],
            [{end: 3, foo: {end: 2, start: 1}}, 8],
            [{end: 3, foo: {end: 3, start: 1}}, 100]
        ]);
    });

    test('modify insert test', () => {
        const localTrie = makeTestJsonTrie();
        localTrie.modify([1,9], () => 100);
        const results: Array<Json> = [];
        localTrie.entriesCont((k, v) => results.push([k, v]));
        expect(results).toEqual([
            [[null, {end: 2, start: 1}], void(0)],
            [[null, {end: 3, start: 1}], 1],
            [['foo', {end: 3, start: 1}], 2],
            [[1, 2], 5],
            [[1, 3], 6],
            [[1,9], 100],
            [{}, 7],
            [{end: 2, start: 1}, 3],
            [{end: 3, start: 1}, 4],
            [{end: 3, foo: {end: 2, start: 1}}, 8],
            [{end: 3, foo: {end: 3, start: 1}}, 9]
        ]);
    });

    test('minus test', () => {
        const localTrie = makeTestJsonTrie();
        const minusTrie = JsonTrie.create<null>();
        minusTrie.insert([null, {start: 1, end: 2}], null);
        minusTrie.insert(['foo', {start: 1, end: 3}], null);
        minusTrie.insert({start: 1, end: 2}, null);
        minusTrie.insert([1,3], null);
        minusTrie.insert({}, null);
        minusTrie.insert({foo: {start: 1, end: 3}, end: 3}, null);
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([
            [null, {start: 1, end: 3}],
            [1, 2],
            {start: 1, end: 3},
            {foo: {start: 1, end: 2}, end: 3}
        ]);
    });

    test('minus extra keys', () => {
        const localTrie = makeTestJsonTrie();
        const minusTrie = JsonTrie.create<null>();
        minusTrie.insert([null, {start: 1, end: 2}], null);
        minusTrie.insert(['foo', {start: 1, end: 3}], null);
        minusTrie.insert(['foo', {start: 1, end: 4}], null);
        minusTrie.insert({start: 1, end: 2}, null);
        minusTrie.insert([1,3], null);
        minusTrie.insert([1,4], null);
        minusTrie.insert({}, null);
        minusTrie.insert({foo: {start: 1, end: 3}, end: 3}, null);
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([
            [null, {start: 1, end: 3}],
            [1, 2],
            {start: 1, end: 3},
            {foo: {start: 1, end: 2}, end: 3}
        ]);
    });

    test('minus all', () => {
        const localTrie = makeTestJsonTrie();
        const minusTrie = makeTestJsonTrie();
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([]);
    });
});

function makeTestJsonTrieTerm(): JsonTrieTerm<number | undefined> {    
    const trie = JsonTrieTerm.create<number | undefined>();
    trie.insert([null, {start: 1, end: 2}], void(0));
    trie.insert([null, {start: 1, end: 3}], 1);
    trie.insert(['foo', {start: 1, end: 3}], 2);
    trie.insert({start: 1, end: 2}, 3);
    trie.insert({start: 1, end: 3}, 4);
    trie.insert([1,2], 5);
    trie.insert([1,3], 6);
    trie.insert({}, 7);
    trie.insert({ foo: new Variable(0), bar: new Variable(0) }, 8);
    return trie;
}

describe('JsonTrieTerm tests', () => {
    const trie = makeTestJsonTrieTerm();

    // TODO: modifyWithVars tests.
    test('successful lookup', () => {
        expect(trie.lookup([1,2])).toBe(5);
    });

    test('successful undefined lookup', () => {
        expect(trie.lookup([null, {start: 1, end: 2}])).toBeUndefined();
    });

    test('successful undefined contains', () => {
        expect(trie.contains([null, {start: 1, end: 2}])).toBeTruthy();
    });

    test('unsuccessful lookup', () => {
        expect(trie.lookup([1,5])).toBeUndefined();
    });

    test('unsuccessful contains', () => {
        expect(trie.contains([1,5])).toBeFalsy();
    });

    test('successful array lookup', () => {
        expect(trie.contains([1, 2])).toBeTruthy();
    });

    test('unsuccessful array lookup', () => {
        expect(trie.contains([1, 4])).not.toBeTruthy();
    });
    test('successful object lookup', () => {
        expect(trie.contains({start: 1, end: 3})).toBeTruthy();
    });

    test('unsuccessful object lookup', () => {
        expect(trie.contains({start:2, end: 3})).not.toBeTruthy();
    });

    test('successful complex lookup', () => {
        expect(trie.contains(['foo', {start: 1, end: 3}])).toBeTruthy();
    });

    test('unsuccessful complex lookup', () => {
        expect(trie.contains(['foo', {start: 2, end: 3}])).not.toBeTruthy();
    });

    test('successful non-linear variant lookup matching variables', () => {
        expect(trie.contains({foo: new Variable(0), bar: new Variable(0)})).toBeTruthy();
    });

    test('unsuccessful non-linear variant lookup first variable doesn\'t match', () => {
        expect(trie.contains({foo: new Variable(1), bar: new Variable(0)})).not.toBeTruthy();
    });

    test('unsuccessful non-linear variant lookup first variable matches', () => {
        expect(trie.contains({foo: new Variable(0), bar: new Variable(1)})).not.toBeTruthy();
    });

    test('successful non-linear variant lookup unmatching variables', () => {
        expect(trie.contains({foo: new Variable(1), bar: new Variable(1)})).toBeTruthy();
    });

    test('correct number of entries', () => {
        const rows = [];
        for(const row of trie.entries()) { rows.push(row); }
        expect(rows.length).toBe(9);
    });

    test('correct number of entries, entriesCont', () => {
        const rows: Array<Json> = [];
        trie.entriesCont(row => { rows.push(row); });
        expect(rows.length).toBe(9);
    });

    test('modify test', () => {
        const localTrie = makeTestJsonTrieTerm();
        localTrie.modify([null, {start: 1, end: 2}], () => 100);
        localTrie.modify(['foo', {start: 1, end: 3}], () => 100);
        localTrie.modify({start: 1, end: 2}, () => 100);
        localTrie.modify([1,3], x => (<number>x)+100);
        localTrie.modify({}, () => 100);
        localTrie.modify({foo: new Variable(0), bar: new Variable(0)}, () => 100);
        const results: Array<Json> = [];
        localTrie.entriesCont((k, v) => results.push([k, v]));
        expect(results).toEqual([
            [[null, {end: 2, start: 1}], 100],
            [[null, {end: 3, start: 1}], 1],
            [['foo', {end: 3, start: 1}], 100],
            [[1, 2], 5],
            [[1, 3], 106],
            [{}, 100],
            [{end: 2, start: 1}, 100],
            [{end: 3, start: 1}, 4],
            [{ foo: new Variable(0), bar: new Variable(0) }, 100]
        ]);
    });

    test('modify insert test', () => {
        const localTrie = makeTestJsonTrieTerm();
        localTrie.modify([1,9], () => 100);
        const results: Array<Json> = [];
        localTrie.entriesCont((k, v) => results.push([k, v]));
        expect(results).toEqual([
            [[null, {end: 2, start: 1}], void(0)],
            [[null, {end: 3, start: 1}], 1],
            [['foo', {end: 3, start: 1}], 2],
            [[1, 2], 5],
            [[1, 3], 6],
            [[1,9], 100],
            [{}, 7],
            [{end: 2, start: 1}, 3],
            [{end: 3, start: 1}, 4],
            [{ foo: new Variable(0), bar: new Variable(0) }, 8]
        ]);
    });

    test('minus test', () => {
        const localTrie = makeTestJsonTrieTerm();
        const minusTrie = JsonTrieTerm.create<null>();
        minusTrie.insert([null, {start: 1, end: 2}], null);
        minusTrie.insert(['foo', {start: 1, end: 3}], null);
        minusTrie.insert({start: 1, end: 2}, null);
        minusTrie.insert([1,3], null);
        minusTrie.insert({}, null);
        minusTrie.insert({foo: new Variable(0), bar: new Variable(0) }, null);
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([
            [null, {start: 1, end: 3}],
            [1, 2],
            {start: 1, end: 3}
        ]);
    });

    test('minus extra keys', () => {
        const localTrie = makeTestJsonTrieTerm();
        const minusTrie = JsonTrieTerm.create<null>();
        minusTrie.insert([null, {start: 1, end: 2}], null);
        minusTrie.insert(['foo', {start: 1, end: 3}], null);
        minusTrie.insert(['foo', {start: 1, end: 4}], null);
        minusTrie.insert({start: 1, end: 2}, null);
        minusTrie.insert([1,3], null);
        minusTrie.insert([1,4], null);
        minusTrie.insert({}, null);
        minusTrie.insert({foo: new Variable(0), bar: new Variable(0) }, null);
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([
            [null, {start: 1, end: 3}],
            [1, 2],
            {start: 1, end: 3}
        ]);
    });

    test('minus all', () => {
        const localTrie = makeTestJsonTrieTerm();
        const minusTrie = makeTestJsonTrieTerm();
        const results: Array<Json> = [];
        localTrie.minus(minusTrie).entriesCont(k => results.push(k));
        expect(results).toEqual([]);
    });
});

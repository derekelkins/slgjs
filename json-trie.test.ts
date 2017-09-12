import { Gen } from "./jsqc"
//import "./ts-jsqc"

import { Variable, Substitution } from "./unify"
import { JsonTrieTerm, JsonTrie } from "./json-trie"

describe('JsonTrie tests', () => {
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

    // TODO: Modify tests.
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
        matches.length = 0;
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
        matches.length = 0;
        for(const s of trie.match({foo: {start: X, end: Y}, end: Y}, sub)) { 
            matches.push([s.lookup(X), s.lookup(Y)]); 
        }
        expect(matches).toEqual([
            [1, 3]
        ]);
    });
});

describe('JsonTrieTerm tests', () => {
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

    // TODO: Modify tests.
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
});

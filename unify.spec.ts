import 'jest'
import { Variable, Substitution,
         groundJsonNoSharing, groundJson, completelyGroundJson, refreshJson } from './unify'

// TODO: Add tests for the *Json functions:
//export function looseMatchJson(x: JsonTerm, y: Json, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {
//export function matchJson(x: JsonTerm, y: Json, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {
//export function looseUnifyJson(x: JsonTerm, y: JsonTerm, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {
//export function unifyJson(x: JsonTerm, y: JsonTerm, sub: Substitution<JsonTerm>): Substitution<JsonTerm> | null {

test('groundJsonNoSharing', () => {
    const [[X, Y, Z, W, A, B, U], sub] = Substitution.emptyPersistent<any>().fresh(7);
    let s = sub.bind(X, {foo: 1, bar: void(0), baz: [1,2], quux: {} });
    s = s.bind(B, 1);
    s = s.bind(Y, [1, void(0), [1,2], {}]);
    s = s.bind(Z, {foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
    s = s.bind(W, [1, void(0), [1,2], {}, X, Y, B, U]);
    s = s.bind(A, [W, Z]);
    expect(groundJsonNoSharing(A, s)).toEqual([
        [1, void(0), [1,2], {}, {foo: 1, bar: void(0), baz: [1,2], quux: {} }, [1, void(0), [1,2], {}], 1, U]
        ,{foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: {foo: 1, bar: void(0), baz: [1,2], quux: {} }, arrVar: [1, void(0), [1,2], {}], primVar: 1, unboundVar: U }
    ]);
});

test('groundJson', () => {
    const [[X, Y, Z, W, A, B, U], sub] = Substitution.emptyPersistent<any>().fresh(7);
    let s = sub.bind(X, {foo: 1, bar: void(0), baz: [1,2], quux: {} });
    s = s.bind(B, 1);
    s = s.bind(Y, [1, void(0), [1,2], {}]);
    s = s.bind(Z, {foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
    s = s.bind(W, [1, void(0), [1,2], {}, X, Y, B, U]);
    s = s.bind(A, [W, Z]);
    expect(groundJson(A, s)).toEqual([
        [1, void(0), [1,2], {}, {foo: 1, bar: void(0), baz: [1,2], quux: {} }, [1, void(0), [1,2], {}], 1, U]
        ,{foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: {foo: 1, bar: void(0), baz: [1,2], quux: {} }, arrVar: [1, void(0), [1,2], {}], primVar: 1, unboundVar: U }
    ]);
});

test('completelyGroundJson success', () => {
    const [[X, Y, Z, W, A, B], sub] = Substitution.emptyPersistent<any>().fresh(6);
    let s = sub.bind(X, {foo: 1, bar: void(0), baz: [1,2], quux: {} });
    s = s.bind(B, 1);
    s = s.bind(Y, [1, void(0), [1,2], {}]);
    s = s.bind(Z, {foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: X, arrVar: Y, primVar: B});
    s = s.bind(W, [1, void(0), [1,2], {}, X, Y, B]);
    s = s.bind(A, [W, Z]);
    expect(completelyGroundJson(A, s)).toEqual([
        [1, void(0), [1,2], {}, {foo: 1, bar: void(0), baz: [1,2], quux: {} }, [1, void(0), [1,2], {}], 1]
        ,{foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: {foo: 1, bar: void(0), baz: [1,2], quux: {} }, arrVar: [1, void(0), [1,2], {}], primVar: 1}
    ]);
});

test('completelyGroundJson unbound variables', () => {
    const [[X, Y, Z, W, A, B, U], sub] = Substitution.emptyPersistent<any>().fresh(7);
    let s = sub.bind(X, {foo: 1, bar: void(0), baz: [1,2], quux: {} });
    s = s.bind(B, 1);
    s = s.bind(Y, [1, void(0), [1,2], {}]);
    s = s.bind(Z, {foo: 1, bar: void(0), baz: [1,2], quux: {}, objVar: X, arrVar: Y, primVar: B, unboundVar: U });
    s = s.bind(W, [1, void(0), [1,2], {}, X, Y, B, U]);
    s = s.bind(A, [W, Z]);
    expect(() => completelyGroundJson(A, s)).toThrow('completelyGroundJson: term contains unbound variables');
});

test('refreshJson simple linear', () => {
    const [[X, Y, Z, W], sub] = Substitution.emptyPersistent<any>().fresh(4);
    const [t, subResult] = refreshJson([Z, W], sub);
    const [v, _] = subResult.freshVar();
    expect([t, v]).toEqual([
        [new Variable(4), new Variable(5)],
        new Variable(6)
    ]);
});

test('refreshJson simple non-linear', () => {
    const [[X, Y, Z, W], sub] = Substitution.emptyPersistent<any>().fresh(4);
    const [t, subResult] = refreshJson([Z, Z], sub);
    const [v, _] = subResult.freshVar();
    expect([t, v]).toEqual([
        [new Variable(4), new Variable(4)],
        new Variable(5)
    ]);
});

test('lookup undefined', () => {
    const [X, sub] = Substitution.emptyPersistent<any>().freshVar();
    const s = sub.bind(X, void(0));
    expect(s.lookupAsVar(X)).toBe(void(0));
});

test('simple lookup unbound', () => {
    const [X, sub] = Substitution.emptyPersistent<string>().freshVar();
    expect(typeof sub.lookup(X)).toBe('number');
});

test('simple lookup bound', () => {
    const [X, sub] = Substitution.emptyPersistent<string>().freshVar();
    const s = sub.bind(X, 'foo');
    expect(s.lookup(X)).toBe('foo');
});

test('persistence test', () => {
    const [X, sub] = Substitution.emptyPersistent<string>().freshVar();
    const s = sub.bind(X, 'foo');
    expect(s.lookup(X)).toBe('foo');
    expect(typeof sub.lookup(X)).toBe('number');
});

test('unify unbound', () => {
    const [[X, Y], sub] = Substitution.emptyPersistent<string>().fresh(2);
    const s = <Substitution<string>>sub.unifyVar(X, Y);
    expect(s).not.toBeNull();
    expect(sub.lookup(X)).not.toEqual(sub.lookup(Y));
    expect(s.lookup(X)).toEqual(s.lookup(Y));
});

test('unify then bind', () => {
    const [[X, Y], sub] = Substitution.emptyPersistent<string>().fresh(2);
    let s = <Substitution<string>>sub.unifyVar(X, Y);
    expect(s).not.toBeNull();
    s = s.bind(X, 'foo');
    expect(s.lookup(X)).toBe('foo');
    expect(s.lookup(Y)).toBe('foo');
});

test('bind then unify', () => {
    const [[X, Y], sub] = Substitution.emptyPersistent<string>().fresh(2);
    let s = sub.bind(X, 'foo');
    s = <Substitution<string>>s.unifyVar(X, Y);
    expect(s).not.toBeNull();
    expect(s.lookup(X)).toBe('foo');
    expect(s.lookup(Y)).toBe('foo');
});

test('unification failed', () => {
    const [[X, Y], sub] = Substitution.emptyPersistent<string>().fresh(2);
    let s = sub.bind(X, 'foo');
    s = s.bind(Y, 'bar');
    const s2 = <Substitution<string>>s.unifyVar(X, Y);
    expect(s2).toBeNull();
    expect(s.lookup(X)).toBe('foo');
    expect(s.lookup(Y)).toBe('bar');
});

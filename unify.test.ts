import "jest"
import { Variable, Substitution } from "./unify"

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

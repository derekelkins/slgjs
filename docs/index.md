---
layout: default
---

## Introduction

This provides a embedding of tabled logic programming in TypeScript/JavaScript.
Currently, it supports LRD-stratified negation, monotonic aggregation via lattice
terms, and non-monotonic aggregation. Adding non-stratified negation and
aggregation is something I'm considering.

The implementation techniques are similar to the SLG-WAM of the XSB Prolog
implementation.

Last-call optimization should happen only when the last call is an untabled
predicate *and* the underlying JavaScript engine does tail-call elimination 
(which has been mandated by EcmaScript 2015 but not implemented in anything
but Safari currently).  If the last call is a tabled (or grouped) predicate,
last-call optimization won't happen regardless of the underlying JavaScript
implementation. However, it's often preferable to put tabled predicates
early, often the *first* call, which will usually avoid unbounded stack usage
as the table gets consulted in the recursive calls rather than unfolding
another layer of execution.

The API will likely change significantly.

[API Reference](doc/index.html)

## Examples

[Transitive Closure](examples/path.html) - A small instance of calculating all
paths in a cyclic graph.

[Pattern Matching](examples/github.html) - An example for which this library is
overkill pattern matching data from a JSON API. A slightly less trivial variant
would show some benefit of the logic programming aspect by trivially performing
joins.

[microKanren](examples/kanren.ts) - This is an implementation of microKanren
that was more made as a test of the underlying system for unification. It
implements (non-tabled) logic programming using a different approach to the
main library.

[Tests](https://github.com/derekelkins/slgjs/blob/master/slg.spec.ts) - The
tests have some other standard examples like append, shortest paths, etc.

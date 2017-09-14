---
layout: default
---

## Introduction

This provides a embedding of tabled logic programming in TypeScript/JavaScript.
Currently, it supports LRD-stratified negation. Adding non-stratified negation is
something I'm considering. There is currently no support for aggregation, but
that is also something I'd like to support.

The implementation techniques are similar to the SLG-WAM of the XSB Prolog
implementation.

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
tests have some other standard examples like append.

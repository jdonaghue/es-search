# es-search

Search a directory/file containing ECMAScript code and find complex structures using a CSS Selector-like syntax.

## Example usage

```js
// variable search
counter
counter=10
var:counter
const:counter
let:counter
window:counter // global
// TODO: support destructuring

// function definition search
fndef:add
fndef:add(a, b, c)
fndef:add(?, b)
fndef:add(?, b='test')
fndef:add(*, a, *)
fndef:add
fndef:* // any function name
fndef:*(a, b, c) // any function name
fndef:(a, b, c) // anonymous

// arrow function search
arrow:()
arrow:(a, b, c)

// function invocation search
fn:add
fn:add(a, b, c)
fn:add(a, b, *) // dont care about whats after 'b'
fn:add(*, a, *) // somewhere there 'a' is passed in

// instance method invocation or property dereference
instanceName.methodName
instanceName.methodName(a, b, c)
instanceName.methodName(?, b)
instanceName.methodName(*, a, *)

// regular expression search
re:/a/g // normal regular expression syntax prefixed by a 're:'

// string literal search
/a/g // normal regular expression syntax

// literal search
10
true
false

// if statement search
if:*  // any conditional expression
if:a==b
if:a===b
if:a
if:!a
if:a!=b
if:a!==b
if:a>b // all operators are supported
if:a&&b===c
if:(a&&b)||c // grouping
if:arrow:(a, b)  // arrow functions
if:fndef:(a, b) // anonymous functions

// while loop search
while:*a // a condition that contains a variable named 'a'
while:*re:/test/g 
while:a==b // same as if statement search

// for loop search
// TODO: implement this
// for:*;a;* // any for loop that contains a condition with a variable named 'a'
// for:*;cond:;* // only care about the condition
// for:variable;cond:;expr:

// for in 
// TODO: implement this
// forin:a
// forin:a>b // a in b

// for of
// TODO: define this

// switch statement search
// TODO: define this

// class definition search
// TODO: define this

// combinators
// Note all of the search right to left except for '<' which searches left to right
fn:add > /test/g  // the '>' is the combinator - means is a descendant of
// TODO: fn:add < /test/g  // the '>' is the combinator - means is a ancestor of
// TODO: fn:add + /test/g // the '+' is the combinator - means following sibling
// TODO: fn:add ~ /test/g // the '~' is the combinator - means preceding sibling
// TODO: fn:add >+ /test/g // immediately following sibling
// TODO: fn:add >~ /test/g // immediately preceding sibling
```
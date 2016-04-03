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
()
(a, b, c)

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

// if statement search
// TODO: define this

// while loop search
// TODO: define this

// for loop search
// TODO: define this

// switch statement search
// TODO: define this

// class definition search
// TODO: define this

// combinators
// Note all of the search right to left except for '<' which searches left to right
fn:add > /test/g  // the '>' is the combinator - means is a descendant of
fn:add < /test/g  // the '>' is the combinator - means is a ancestor of
fn:add + /test/g // the '+' is the combinator - means following sibling
fn:add ~ /test/g // the '~' is the combinator - means preceding sibling
fn:add >+ /test/g // immediately following sibling
fn:add >~ /test/g // immediately preceding sibling
```
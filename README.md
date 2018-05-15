Swagger Paths
=============

This package is basically a shrunken, zero-dependency, version of Wikimedia's
[`swagger-router`](https://www.npmjs.com/package/swagger-router).

While some cleanups and adjustments have been done, all credits and kudos go
to the Wikipedia team!!!

Description
-----------

In its simplest incarnation, `Swagger Paths` gets constructed with an object
keyed by paths (in the format defined by [Swagger](swagger.io)) and matches
them, expanding and returning path parameters.

For example:

```javascript
const Paths = require('swagger-paths');
const paths = new Paths({
  '/': 'the root entry',
  '/foo/{bar}': 'something else'
});

paths.lookup('/');
// returns
//   {
//     params: {},
//     pattern: '/',
//     value: 'the root entry'
//   }

paths.lookup('/foo/baz');
// returns
//   {
//     params: { bar: 'baz' },
//     pattern: '/foo/{bar}',
//     value: 'something else'
//   }
```

Paths Format
------------

Swagger allows a certain flexibility in naming paths, henceforth the matcher
uses a simple syntax augumenting Swagger's own:

* `{normal}`: A normal parameter, not matching any sub-resource.
* `{/optional}`: An optional path parameter, indicating it might be omitted.
* `{+wildcard}`: A wildcard parameter, matching all sub resources.
* `{fixed:value}`: A fixed value parameter, matching a specified value.

For example, in case of normal parameters (e.g. `/foo/{bar}`):

```javascript
const paths = new Paths({ '/foo/{bar}': '...' })

paths.lookup('/foo');
// returns null

paths.lookup('/foo/');
// returns
//   {
//     params: {},
//     pattern: '/foo/{bar}',
//     value: '...'
//   }

paths.lookup('/foo/baz');
// returns
//   {
//     params: { bar: 'baz' },
//     pattern: '/foo/{bar}',
//     value: '...'
//   }
```

Using optional parameters (e.g. `/foo{/bar}`):

```javascript
const paths = new Paths({ '/foo{/bar}': '...' })

paths.lookup('/foo');
// as below returns
//   {
//     params: {},
//     pattern: '/foo{/bar}',
//     value: '...'
//   }

paths.lookup('/foo/');
// as above returns
//   {
//     params: {},
//     pattern: '/foo{/bar}',
//     value: '...'
//   }

paths.lookup('/foo/baz');
// returns
//   {
//     params: { '/bar': 'baz' },
//     pattern: '/foo{/bar}',
//     value: '...'
//   }
```

Wildcard parameters, on the other hand, capture all sub resources:

```javascript
const Paths = require('.');

const paths = new Paths({ '/foo/{+bar}': '...' })

paths.lookup('/foo');
// returns null

paths.lookup('/foo/');
// as above returns
//   {
//     params: {},
//     pattern: '/foo/{+bar}',
//     value: '...'
//   }

paths.lookup('/foo/baz');
// returns
//   {
//     params: { '+bar': 'baz' },
//     pattern: '/foo/{+bar}',
//     value: '...'
//   }

paths.lookup('/foo/baz/qux');
// returns
//   {
//     params: { '+bar: 'baz/qux' },
//     pattern: '/foo/{+bar}',
//     value: '...'
//   }
```

Fixed-value parameters, finally, capture a single, specific value as a path
parameter:

```javascript
const Paths = require('.');

const paths = new Paths({ '/{foo:one}/{bar}': 111,
                          '/{foo:two}/{bar}': 222 });

paths.lookup('/one/baz');
// returns
//   {
//     params: { foo: 'one', bar: 'baz' },
//     pattern: '/{foo:one}/{bar}',
//     value: 111
//   }

paths.lookup('/two/baz');
// returns
//   {
//     params: { foo: 'two', bar: 'baz' },
//     pattern: '/{foo:two}/{bar}',
//     value: 222
//   }

paths.lookup('/three/baz');
// returns null
```

#### NOTE on Parameter Names

In order to have swagger files *properly* validating, parameter names with
modifiers (e.g. `{/optional]}` or `{+wildcard}`) will be returned *unchanged*,
(the modifier *WILL* be included in the parameter name).

Fixed value parameters (e.g. `{fixed:value}`), on the other hand, will not
include the fixed value part, and will therefore generate warnings in the
Swagger editor.

License
-------

[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

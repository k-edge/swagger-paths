Swagger Paths
=============

This package is basically a shrunken, zero-dependency, path matcher. This was
heavily influenced (but is a complete rewrite, as of version 1) of Wikimedia's
[`swagger-router`](https://www.npmjs.com/package/swagger-router).

Description
-----------

A simple

For example:

```javascript
let swaggerPaths = require('swagger-paths')

let paths = swaggerPaths({
  '/': { data: 'root' },
  '/foo': 'this is foo',
  '/foo/{bar}': 123,
  '/{baz}': 'catch all'
})
```

Basically, construction requires an object keyed by _path names_ with any
value associated with it.

Paths are constructed using the normal [_OpenAPI 3_](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)
structure, with path variables wrapped in curly braces (e.g. `{myVar}`)

Matching is performed calling the `match(... path ...)` function, for example:

```javascript
paths.match('/')
// ... will return
// {
//   variables: {},
//   value: {
//     data: 'root'
//   },
//   path: Path {
//     path: '/',
//     pattern: '/',
//     variables: [],
//     components: []
//   }
// }
```

The object returned will include:

* `variables`: an object including all the variables and their values resolved
  resolved when matching a path
* `value`: the value associated with the path at construction
* `path`: an internal structure indicating the path matched

The `match(... path ...)` method will return `null` in case of no matches:

```javascript
paths.match('/foo/bar/baz')
// ... will return null
```

Another example:

```javascript
paths.match('/foo/hello world')
// ... will return
// {
//   "variables": {
//     "bar": "hello world"
//   },
//   "value": 123,
//   "path": ...
// }
```

Note that calling with the path `/foo/hello%20world` (url-encoded version of
the abolve example) will return the same (decoded) variable values.

Care is taken so that path components are re-encoded correctly both when
constructing instances, and matching paths.

Finally, multiple occurrences of the slash character (or leading and trailing
slashes) will be collapsed, henceforth a path such as `/foo/bar` will be
effectively equal to:

* `foo/bar`
* `/foo/bar/`
* `///foo///bar///`

... and so on.

Arrays of paths
---------------

Construction can also happen with array of paths, for example:

```javascript
let paths = swaggerPaths([
  '/',
  '/foo',
  '/foo/{bar}',
  '/{baz}'
])
```

In this case only `variables` will be resolved and the result will not have
any `value`.

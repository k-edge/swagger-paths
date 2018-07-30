'use strict';

/* ========================================================================== *
 * UTILITIES                                                                  *
 * ========================================================================== */
const splitRe = /(\/)(?:\{([+])?([^:}/]+)(?::([^}]+))?}|([^/{]*))|(?:{([/+]))([^:}/]+)(?::([^}]+))?}/g;

function parsePattern(pattern) {
  const res = [];
  splitRe.lastIndex = 0;
  let m;
  do {
    m = splitRe.exec(pattern);
    if (m) {
      if (m[1] === '/') {
        if (m[5] !== undefined) {
          /* plain path segment */
          res.push(decodeURIComponent(m[5]));

        } else if (m[3]) {
          /* templated path segment */
          res.push({
            name: (m[2] || '') + m[3],
            modifier: m[2],
            pattern: m[4]
          });
        }

      } else if (m[7]) {
        /* Optional path segment:
         * - {/foo} or {/foo:bar}
         * - {+foo}
         */
        res.push({
          name: (m[6] || '') + m[7],
          modifier: m[6],
          pattern: m[8]
        });
      } else {
        throw new Error('The impossible happened!');
      }
    }
  } while (m);
  return res;
}

function parsePath(path, isPattern) {
  if (isPattern) return parsePattern(path);

  if (path.charCodeAt(0) === 47 /* "/" */) {
    path = path.substring(1);
  }

  const bits = path.split('/');
  if (/%/.test(path)) {
    for (let i = 0; i < bits.length; i++) {
      if (/%/.test(bits[i])) {
        bits[i] = decodeURIComponent(bits[i]);
      }
    }
  }
  return bits;
};

/* ========================================================================== *
 * NODE OBJECT                                                                *
 * ========================================================================== */

const _keyPrefix = '/';
const _keyPrefixRegExp = /^\//;

/*
 * A node in the lookup graph.
 *
 * We use a single monomorphic type for the JIT's benefit.
 */
class Node {
  constructor(value) {
    /* The value for a path ending on this node. Public property. */
    this.value = value || null;

    /* Internal properties. */
    this._children = {};
    this._paramName = null;
    this._parent = null;
  }

    /** Register a child with a node. */
    setChild(key, child) {
      if (key.constructor === String) {
        this._children[_keyPrefix + key] = child;
      } else if (key.name && key.pattern
        && key.modifier !== '+'
        && key.pattern.constructor === String) {
        /* A named but plain key. */
        child._paramName = key.name;
        this._children[_keyPrefix + key.pattern] = child;
      } else if (key.modifier === '+') {
        child._paramName = key.name;
        this._children['**'] = child;
      } else {
        /* Setting up a wildcard match */
        child._paramName = key.name;
        this._children['*'] = child;
      }
    }

    /** Look up a child in a node. */
    getChild(segment, params, exact) {
      if (segment.constructor === String) {
        /* Fast path */
        let res = this._children[_keyPrefix + segment];
        if (!res && !exact) {
          /* Fall back to the wildcard match. */
          res = this._children['*'];
          if (!res && this._children['**']) {
            res = this._children['**'];
            /* Build up an array for ** matches ({+foo}) */
            if (segment) {
              if (params[res._paramName]) {
                params[res._paramName] += `/${encodeURIComponent(segment)}`;
              } else {
                params[res._paramName] = encodeURIComponent(segment);
              }
            }
            /* We are done. */
            return res;
          }
        }

        if (res) {
          if (res._paramName && segment) {
            params[res._paramName] = segment;
          }
          return res;
        } else {
          return null;
        }

        /* Fall-back cases for internal use during tree construction.
         * These cases are never used for actual routing.
         */
      } else if (segment.pattern) {
        /* Unwrap the pattern */
        return this.getChild(segment.pattern, params, exact);

      } else if (this._children['*']
        && this._children['*']._paramName === segment.name) {
        /* XXX: also compare modifier! */
        return this._children['*'] || null;
      }
    }
  }

/* ========================================================================== *
 * MAIN PATHS OBJECT                                                          *
 * ========================================================================== */

class Paths {
  constructor(paths) {
    if (! paths) throw new Error('Constructed without paths');
    if (typeof paths !== 'object') throw new Error('Parameter should be an object');

    const _root = this._root = new Node();
    Object.keys(paths).sort().forEach((pathPattern) => {
      const path = parsePath(pathPattern, true);
      if (path.length == 0) throw new Error('Invalid empty path');
      this._extend(path, _root, paths[pathPattern], pathPattern);
    });
  }

  /* XXX modules: variant that builds a prefix tree from a path array,
   * but pass in a spec instead of a value
   */
  _buildTree(path, value, pattern) {
    const node = new Node();
    if (path.length) {
      const segment = path[0];
      if (segment.modifier === '+') {
        /* Set up a recursive match and end the traversal */
        const recursionNode = new Node();
        recursionNode.value = value;
        recursionNode.pattern = pattern;
        recursionNode.setChild(segment, recursionNode);
        node.setChild(segment, recursionNode);
      } else {
        const subTree = this._buildTree(path.slice(1), value, pattern);
        node.setChild(segment, subTree);
        if (segment.modifier === '/') {
          /* Set the value for each optional path segment ({/foo}) */
          node.value = value;
          subTree.value = value;
          node.pattern = pattern;
          subTree.pattern = pattern;
        }
      }
    } else {
      node.value = value;
      node.pattern = pattern;
    }
    return node;
  }

  /* Extend an existing route tree with a new path by walking the existing
   * tree and inserting new subtrees at the desired location.
   */
  _extend(path, node, value, pattern) {
    const params = {};
    for (let i = 0; i < path.length; i++) {
      const nextNode = node.getChild(path[i], params, true);
      if (!nextNode || !nextNode.getChild) {
        /* Found our extension point */
        node.setChild(path[i], this._buildTree(path.slice(i + 1), value, pattern));
        return;
      } else {
        node = nextNode;
      }
    }
  }

  /* Lookup worker. */
  _lookup(path, node) {
    const params = {};

    let prevNode;
    for (let i = 0; i < path.length; i++) {
      if (!node || !node.getChild) {
        return null;
      }
      prevNode = node;
      node = node.getChild(path[i], params);
    }

    if (node || prevNode && path[path.length - 1] === '') {
      return {
        params,
        value: (node && node.value || null),
        pattern: (node && node.pattern || null)
      };
    } else {
      return null;
    }
  }

  /* Look up a path in the paths, and return either null or the configured
   * object.
   */
  lookup(path) {
    if (path == null) return null;
    if (typeof path !== 'string') throw new Error('Path must be a string');

    path = parsePath(path);
    const result = this._lookup(path, this._root);
    if (result && result.value) return { params: result.params, value: result.value, pattern: result.pattern };
    return null;
  }
}

/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

module.exports = Paths;

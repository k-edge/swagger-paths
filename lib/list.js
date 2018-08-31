'use strict'

/*
 * TODO: this implements a paths *list* which might be inefficient, we
 * should explore the possibility of building a *tree* of paths, matching
 * each component, but this is left for later...
 */

const Path = require('./path')
const split = require('./split')

class List {
  constructor(list, options) {
    /* At least some basics... */
    if (! list) throw new Error('Must be constructed with some paths')

    /* Our paths and our mappings */
    let paths = [], mappings = new Map()

    /* Process arrays of paths and objects */
    if (Array.isArray(list)) {
      for (let line of list) {
        let path = new Path(line, options)
        paths.push(path)
        mappings.set(path, null)
      }
    } else if ((list != null) && (typeof list === 'object')) {
      let lines = Object.keys(list)
      for (let line of lines) {
        let path = new Path(line, options)
        paths.push(path)
        mappings.set(path, list[line])
      }
    } else {
      throw new Error('Invalid type specified for list construction')
    }

    /* No paths? No list! */
    if (paths.length == 0) throw new Error('No paths specified')

    /* Sort our paths for matching */
    paths.sort((a, b) => {
      /* We replace the "*"" pattern with the last unicode character
         in order to sort string matches before variable matches */
      let ap = a.pattern.replace(/\*/g, '\uFFFF')
      let bp = b.pattern.replace(/\*/g, '\uFFFF')
      let value = ap.localeCompare(bp)

      /* We never want the same pattern in two paths */
      if (value == 0) throw new Error(`Paths "${a.path}" and "${b.path}" are equivalent`)
      return value
    })

    /* Define the properties of this list */
    Object.defineProperties(this, {
      paths: { enumerable: true, value: Object.freeze(paths) },
      mappings: { enumerable: true, value: Object.freeze(mappings) },
    })
  }

  match(path, reencode = true) {
    let parts = Array.isArray(path) ? path : split(path, reencode)

    for (let current of this.paths) {
      let variables = current.match(parts, false)
      if (variables) return { variables, path: current, value: this.mappings.get(current) }
    }

    return null
  }
}

/* Expose "splitPaths" and the "Path" class to the world */
List.splitPath = split
List.Path = Path

/* Export our class */
module.exports = List

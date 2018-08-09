'use strict'

const Component = require('./component')
const split = require('./split')

function parse(original) {
  let parts = split(original, false)

  let components = [], variables = [], paths = [], patterns = []

  for (let part of parts) {
try {
    let component = new Component(part)

    for (let variable of component.variables) {
      if (variables.indexOf(variable) >= 0) {
        throw new Error(`Duplicate variable name "${variable}"`)
      } else {
        variables.unshift(variable)
      }
    }

    components.push(component)
    paths.push(component.path)
    patterns.push(component.pattern)
  } catch (error) {
    let message = error.message.substr(0, 1).toLowerCase() +
                  error.message.substr(1)
    throw new Error(`Error in path "${original}": ${message}`)
  }
}

  /* Reverse the order of variables */
  variables.reverse()

  /* Prepare our final path and pattern */
  let path = '/' + paths.join('/')
  let pattern = '/' + patterns.join('/')

  return { components, variables, path, pattern }
}

module.exports = class Path {
  constructor(original, options = {}) {
    /* The path must be a string */
    if (typeof original !== 'string') throw new Error('Path must be a string')

    /* By default ignoreWarnings is false and strictMode is true */
    let { ignoreWarnings = false, strictMode = true } = options

    /* Re-create our path by concatenating our components */
    let { components, variables, path, pattern } = parse(original)

    /* Check if the re-constructed path is same as the original */
    if (original != path) {
      let message = `Path \"${original}\" normalised to "${path}"`
      if (strictMode) throw new Error(message)
      else if (! ignoreWarnings) console.warn(`WARNING: ${message}`)
    }

    /* Define the properties of this Path */
    Object.defineProperties(this, {
      path: { enumerable: true, value: path },
      pattern: { enumerable: true, value: pattern },
      variables: { enumerable: true, value: Object.freeze(variables) },
      components: { enumerable: true, value: Object.freeze(components) },
    })
  }

  /* Our matcher function, iterating through all the children of this path */
  match(path, reencode = true) {
    let parts = Array.isArray(path) ? path : split(path, reencode)

    /* Quick way out, at least the lengths need to match */
    if (this.components.length != parts.length) return null

    /* Tedious match of all parts */
    let variables = {}
    for (let i = 0; i < this.components.length; i ++) {
      let component = this.components[i]
      let part = parts[i]

      let match = component.match(part, false)
      if (match == null) return null

      /* Just remember our variables */
      Object.assign(variables, match)
    }

    /* Return our variables (maybe empty) */
    return variables
  }
}

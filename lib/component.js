'use strict'

const reencode = require('./reencode')
const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g


function parse(component) {
  /* Identify sub-components (fixed strings and {variables}) */
  let re = /({[^}]*})/g
  let match, subComponents = [], lastIndex = 0, expressions = [],
      variables = [], matchedVariable = false, patterns = []

  /* Iterate for every "fixed{variable}" pattern */
  while ((match = re.exec(component)) != null) {
    /* Get prefix and variable name */
    let prefix = reencode(component.substring(lastIndex, match.index))
    let variable = match[1]
    let variableName = variable.substr(1, variable.length - 2)

    /* Enforce proper JavaScript variable names (restrictive) */
    if (! variableName) {
      throw new Error(`Empty variable name in path component "${component}"`)
    } else if (! variableName.match(/^[A-Za-z_$][A-Za-z0-9_$]*$/)) {
      throw new Error(`Wrong variable name "${variableName}"`)
    }

    /* Encode any string, and pass through any variable */
    if (prefix) {
      subComponents.push(prefix)
    } else if (matchedVariable) {
      throw new Error(`Two consecutive variables in path component "${component}"`)
    }
    subComponents.push(variable)

    /* Remember the parts of this regular expression (variables are groups) */
    if (prefix) expressions.push(prefix.replace(matchOperatorsRe, '\\$&'))
    expressions.push('(.+)')

    /* Save the variable name in order */
    if (variables.indexOf(variableName) >= 0) {
      throw new Error(`Duplicate variable "${variableName}" in path component`)
    }
    variables.push(variableName)

    /* Update our pattern */
    patterns.push(prefix)
    patterns.push('*')

    /* Remember the last index, for any final string sub-component */
    lastIndex = re.lastIndex
    matchedVariable = true
  }

  /* The final part of our path, anything after the last variable */
  let final = reencode(component.substring(lastIndex))
  if (final) expressions.push(final.replace(matchOperatorsRe, '\\$&'))
  subComponents.push(final)
  patterns.push(final)

  /* The "path" is the normalised representation of this path component */
  let path = subComponents.join('')
  let pattern = patterns.join('')

  /* Here is a bit of a trick to optimise our speed:
   * 0 variables, 0 expressions => stringMatch .../foobar/...
   * 1 variables, 1 expressions => the component is a variable .../{var}/...
   * anything else is a regular expression
   */
  let matcher
  if (variables.length == 0) {
    // No variables, so this is somehting like .../foobar/...
    matcher = function simpleMatcher(v, reencodeComponent = true) {
      if (typeof v !== 'string') return false
      if (reencodeComponent) v = reencode(v)

      return path == v ? {} : null
    }
  } else if ((variables.length == 1) && (expressions.length == 1)) {
    // One variable and one expression, something like .../{variable}/...
    matcher = function variableMatcher(v, reencodeComponent = true) {
      if (typeof v !== 'string') return false
      if (reencodeComponent) v = reencode(v)

      return { [variables[0]]: decodeURIComponent(v) }
    }
  } else {
    // More complicated case, like .../foo{bar}baz/... and similar, RE rules!
    let re2 = new RegExp('^' + expressions.join('') + '$')

    matcher = function regexpMatcher(v, reencodeComponent = true) {
      if (typeof v !== 'string') return false
      if (reencodeComponent) v = reencode(v)

      let match2 = re2.exec(v)
      if (! match2) return null

      let result = {}
      for (let i = 0; i < variables.length; i ++) {
        let name = variables[i]
        result[name] = decodeURIComponent(match2[i + 1])
      }
      return result
    }
  }

  /* Join our sub-components */
  return { path, matcher, pattern, variables }
}

module.exports = class Component {
  constructor(component) {
    if (typeof component !== 'string') throw new Error('Path component must be a string')
    if (! component) throw new Error('Path component must be at least 1 character long')
    let { path, matcher, pattern, variables } = parse(component)

    Object.defineProperties(this, {
      path: { enumerable: true, value: path },
      match: { enumerable: true, value: matcher },
      pattern: { enumerable: true, value: pattern },
      variables: { enumerable: true, value: Object.freeze(variables) },
    })
  }
}

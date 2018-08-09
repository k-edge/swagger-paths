'use strict'

let List = require('./lib/list')

module.exports = function create(paths, options) {
  return new List(paths, options)
}

'use strict'

const expect = require('chai').expect
const List = require('../lib/list')

describe('Module test', () => {
  it('should expose a valid constructor for the module', () => {
    let pkg = require('../package.json')
    expect(pkg.main).to.equal('index.js')

    let idx = require('../index.js')
    expect(idx).to.be.a('function')

    let paths = idx([ '/' ])
    expect(paths).to.be.instanceof(List)

    expect(paths.paths.length).to.equal(1)
    expect(paths.paths[0].path).to.equal('/')
  })
})

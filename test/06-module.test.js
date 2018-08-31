'use strict'

const expect = require('chai').expect
const List = require('../lib/list')
const Path = require('../lib/path')
const split = require('../lib/split')

describe('Module test', () => {
  it('should expose a valid constructor for the module', () => {
    let pkg = require('../package.json')
    expect(pkg.main).to.equal('index.js')

    let idx = require('../index.js')
    expect(idx).to.be.a('function')

    expect(idx).to.equal(List)
    expect(idx.Path).to.equal(Path)
    expect(idx.splitPath).to.equal(split)
  })
})

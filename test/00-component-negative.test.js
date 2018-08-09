'use strict'

const expect = require('chai').expect
const Component = require('../lib/component')

describe('Component negative tests', () => {
  it('should not construct without parameters', () => {
    expect(() => new Component()).to.throw('Path component must be a string')
  })

  it('should not construct with the wrong parameters', () => {
    expect(() => new Component(false)).to.throw('Path component must be a string')
    expect(() => new Component(12345)).to.throw('Path component must be a string')
    expect(() => new Component({ x: 1 })).to.throw('Path component must be a string')
  })

  it('should not construct with an empty string', () => {
    expect(() => new Component('')).to.throw('Path component must be at least 1 character long')
  })

  it('should not construct with two consecutive parameters', () => {
    expect(() => new Component('{xxx}{yyy}')).to.throw('Two consecutive variables in path component "{xxx}{yyy}"')
    expect(() => new Component('{xxx}{xxx}')).to.throw('Two consecutive variables in path component "{xxx}{xxx}"')
    expect(() => new Component('aaa{xxx}{yyy}')).to.throw('Two consecutive variables in path component "aaa{xxx}{yyy}"')
    expect(() => new Component('{xxx}{yyy}bbb')).to.throw('Two consecutive variables in path component "{xxx}{yyy}bbb"')
    expect(() => new Component('aaa{xxx}{yyy}bbb')).to.throw('Two consecutive variables in path component "aaa{xxx}{yyy}bbb"')
  })

  it('should not construct with the same variable name twice', () => {
    expect(() => new Component('a{xxx}b{xxx}c')).to.throw('Duplicate variable "xxx" in path component')
  })

  it('should not construct with an empty variable name', () => {
    expect(() => new Component('{}')).to.throw('Empty variable name in path component "{}"')
    expect(() => new Component('aaa{}')).to.throw('Empty variable name in path component "aaa{}"')
    expect(() => new Component('{}bbb')).to.throw('Empty variable name in path component "{}bbb"')
    expect(() => new Component('aaa{}bbb')).to.throw('Empty variable name in path component "aaa{}bbb"')
  })

  it('should not construct with the wrong variable name', () => {
    expect(() => new Component('{x^x}')).to.throw('Wrong variable name "x^x"')
    expect(() => new Component('{1xx}')).to.throw('Wrong variable name "1xx"')
  })
})

'use strict'

const expect = require('chai').expect
const List = require('../lib/list')

describe('List test', () => {
  it('should not construct with the wrong constrtuctor parameters', () => {
    expect(() => new List()).to.throw('Must be constructed with some paths')
    expect(() => new List({})).to.throw('No paths specified')
    expect(() => new List([])).to.throw('No paths specified')
    expect(() => new List('foo')).to.throw('Invalid type specified for list construction')
  })

  it('should not construct with a duplicate path', () => {
    expect(() => new List([ '/', '/' ])).to.throw('Paths "/" and "/" are equivalent')
    expect(() => new List([ '/{abc}', '/{def}' ])).to.throw('Paths "/{abc}" and "/{def}" are equivalent')
    expect(() => new List([ '/foo/{abc}', '/foo/{def}' ])).to.throw('Paths "/foo/{abc}" and "/foo/{def}" are equivalent')
    expect(() => new List([ '/{abc}/foo', '/{def}/foo' ])).to.throw('Paths "/{abc}/foo" and "/{def}/foo" are equivalent')
    expect(() => new List([ '/{abc}x{def}', '/{ghi}x{jkl}' ])).to.throw('Paths "/{abc}x{def}" and "/{ghi}x{jkl}" are equivalent')
  })

  it('should construct with an array of strings (and sort it)', () => {
    let list = new List([ '/abc/{bar}', '/{foo}', '/abc', '/' ])

    expect(list).to.be.instanceOf(List)

    expect(list.paths).to.be.an('array')
    expect(list.paths.length).to.equal(4)

    expect(list.paths[0].path).to.eql('/')
    expect(list.paths[1].path).to.eql('/abc')
    expect(list.paths[2].path).to.eql('/abc/{bar}')
    expect(list.paths[3].path).to.eql('/{foo}')

    expect(list.mappings).to.be.instanceOf(Map)
    expect(list.mappings.size).to.equal(4)

    expect(list.mappings.get(list.paths[0])).to.be.null
    expect(list.mappings.get(list.paths[1])).to.be.null
    expect(list.mappings.get(list.paths[2])).to.be.null
    expect(list.mappings.get(list.paths[3])).to.be.null
  })

  it('should construct with an object keyed by paths (and sort it)', () => {
    let list = new List({
      '/abc/{bar}': 'three',
      '/{foo}': 'four',
      '/abc': 'two',
      '/': 'one',
    })

    expect(list).to.be.instanceOf(List)

    expect(list.paths).to.be.an('array')
    expect(list.paths.length).to.equal(4)

    expect(list.paths[0].path).to.eql('/')
    expect(list.paths[1].path).to.eql('/abc')
    expect(list.paths[2].path).to.eql('/abc/{bar}')
    expect(list.paths[3].path).to.eql('/{foo}')

    expect(list.mappings).to.be.instanceOf(Map)
    expect(list.mappings.size).to.equal(4)

    expect(list.mappings.get(list.paths[0])).to.equal('one')
    expect(list.mappings.get(list.paths[1])).to.equal('two')
    expect(list.mappings.get(list.paths[2])).to.equal('three')
    expect(list.mappings.get(list.paths[3])).to.equal('four')
  })

  it('should correctly match some paths', () => {
    let list = new List({
      '/{baz}/{xyz}': { key: 'five' },
      '/abc/{bar}': { key: 'three' },
      '/{foo}': { key: 'four' },
      '/abc': { key: 'two' },
      '/': { key: 'one' },
    })

    expect(list.match('/')).to.eql({ variables: {}, path: list.paths[0], value: { key: 'one' } })

    expect(list.match('/abc')).to.eql({ variables: {}, path: list.paths[1], value: { key: 'two' } })
    expect(list.match('/abc/')).to.eql({ variables: {}, path: list.paths[1], value: { key: 'two' } })

    expect(list.match('/abc/xxx')).to.eql({ variables: { bar: 'xxx' }, path: list.paths[2], value: { key: 'three' } })
    expect(list.match('/abc/xxx/')).to.eql({ variables: { bar: 'xxx' }, path: list.paths[2], value: { key: 'three' } })

    expect(list.match('/yyy')).to.eql({ variables: { foo: 'yyy' }, path: list.paths[3], value: { key: 'four' } })
    expect(list.match('/yyy/')).to.eql({ variables: { foo: 'yyy' }, path: list.paths[3], value: { key: 'four' } })

    expect(list.match('/zzz/www')).to.eql({ variables: { baz: 'zzz', xyz: 'www' }, path: list.paths[4], value: { key: 'five' } })
    expect(list.match('/zzz/www/')).to.eql({ variables: { baz: 'zzz', xyz: 'www' }, path: list.paths[4], value: { key: 'five' } })
  })

  it('should fail when normalising paths in strict mode', () => {
    expect(() => new List([ '/a^b' ])).to.throw('Path "/a^b" normalised to "/a%5Eb"')
  })

  it('should simply warn of normalisation errors when not in strict mode', () => {
    let warn = console.warn, warning = null
    try {
      console.warn = function(message) {
        warning = message
      }
      let list = new List([ '/a^b' ], { strictMode: false })
      expect(list.paths[0].path).to.eql('/a%5Eb')
    } finally {
      console.warn = warn
    }
    expect(warning).to.eql('WARNING: Path "/a^b" normalised to "/a%5Eb"')
  })

  it('should completely ignore normalisation errors when not in strict mode and instructed to do so', () => {
    let warn = console.warn, warning = false
    try {
      console.warn = function(message) {
        warning = true
      }
      let list = new List([ '/a^b' ], { strictMode: false, ignoreWarnings: true })
      expect(list.paths[0].path).to.eql('/a%5Eb')
    } finally {
      console.warn = warn
    }
    expect(warning).to.be.false
  })
})

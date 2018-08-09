'use strict'

const expect = require('chai').expect
const Path = require('../lib/path')

describe('Path negative test', () => {
  it('should not construct without parameters', () => {
    expect(() => new Path()).to.throw('Path must be a string')
  })

  it('should not construct with the wrong parameters', () => {
    expect(() => new Path(false)).to.throw('Path must be a string')
    expect(() => new Path(12345)).to.throw('Path must be a string')
    expect(() => new Path({ x: 1 })).to.throw('Path must be a string')
  })

  it('should not construct with two consecutive parameters', () => {
    expect(() => new Path('{xxx}{yyy}')).to.throw('Error in path "{xxx}{yyy}": two consecutive variables in path component "{xxx}{yyy}"')
    expect(() => new Path('{xxx}{xxx}')).to.throw('Error in path "{xxx}{xxx}": two consecutive variables in path component "{xxx}{xxx}"')
    expect(() => new Path('aaa{xxx}{yyy}')).to.throw('Error in path "aaa{xxx}{yyy}": two consecutive variables in path component "aaa{xxx}{yyy}"')
    expect(() => new Path('{xxx}{yyy}bbb')).to.throw('Error in path "{xxx}{yyy}bbb": two consecutive variables in path component "{xxx}{yyy}bbb"')
    expect(() => new Path('aaa{xxx}{yyy}bbb')).to.throw('Error in path "aaa{xxx}{yyy}bbb": two consecutive variables in path component "aaa{xxx}{yyy}bbb"')
  })

  it('should not construct with the same variable name twice', () => {
    expect(() => new Path('a{xxx}b{xxx}c')).to.throw('Error in path "a{xxx}b{xxx}c": duplicate variable "xxx" in path component')
  })

  it('should not construct with an empty variable name', () => {
    expect(() => new Path('{}')).to.throw('Error in path "{}": empty variable name in path component "{}"')
    expect(() => new Path('aaa{}')).to.throw('Error in path "aaa{}": empty variable name in path component "aaa{}"')
    expect(() => new Path('{}bbb')).to.throw('Error in path "{}bbb": empty variable name in path component "{}bbb"')
    expect(() => new Path('aaa{}bbb')).to.throw('Error in path "aaa{}bbb": empty variable name in path component "aaa{}bbb"')
  })

  it('should not construct with the wrong variable name', () => {
    expect(() => new Path('{x^x}')).to.throw('Error in path "{x^x}": wrong variable name "x^x"')
    expect(() => new Path('{1xx}')).to.throw('Error in path "{1xx}": wrong variable name "1xx"')
  })

  it('should not construct with the same variable name in two path components', () => {
    expect(() => new Path('/{xxx}/foo{xxx}bar')).to.throw('Error in path "/{xxx}/foo{xxx}bar": duplicate variable name "xxx"')
    expect(() => new Path('/{xxx}a{yyy}/b{xxx}c')).to.throw('Error in path "/{xxx}a{yyy}/b{xxx}c": duplicate variable name "xxx"')
    expect(() => new Path('/{xxx}/{yyy}/{zzz}/{xxx}')).to.throw('Error in path "/{xxx}/{yyy}/{zzz}/{xxx}": duplicate variable name "xxx"')
  })

  it('should not construct in strict mode when paths have the wrong number of slashes', () => {
    expect(()=> new Path('')).to.throw('Path "" normalised to "/"')
    expect(()=> new Path('//')).to.throw('Path "//" normalised to "/"')
    expect(()=> new Path('///')).to.throw('Path "///" normalised to "/"')
    expect(()=> new Path('{x}')).to.throw('Path "{x}" normalised to "/{x}"')
    expect(()=> new Path('/{x}/')).to.throw('Path "/{x}/" normalised to "/{x}"')
    expect(()=> new Path('/{x}//')).to.throw('Path "/{x}//" normalised to "/{x}"')
    expect(()=> new Path('/{x}///')).to.throw('Path "/{x}///" normalised to "/{x}"')
    expect(()=> new Path('/{x}//{y}')).to.throw('Path "/{x}//{y}" normalised to "/{x}/{y}"')
    expect(()=> new Path('/{x}///{y}')).to.throw('Path "/{x}///{y}" normalised to "/{x}/{y}"')
    expect(()=> new Path('//{x}')).to.throw('Path "//{x}" normalised to "/{x}"')
    expect(()=> new Path('///{x}')).to.throw('Path "///{x}" normalised to "/{x}"')
  })

  it('should not construct in strict mode when paths have the wrong characters', () => {
    expect(()=> new Path('/a^b')).to.throw('Path "/a^b" normalised to "/a%5Eb"')
    expect(()=> new Path('/foo/a^b')).to.throw('Path "/foo/a^b" normalised to "/foo/a%5Eb"')
    expect(()=> new Path('/a^b/bar')).to.throw('Path "/a^b/bar" normalised to "/a%5Eb/bar"')
    expect(()=> new Path('/foo/a^b/bar')).to.throw('Path "/foo/a^b/bar" normalised to "/foo/a%5Eb/bar"')
  })
})

describe('Path options test', () => {
  it('should simply warn of normalisation errors when not in strict mode', () => {
    let warn = console.warn, warning = null
    try {
      console.warn = function(message) {
        warning = message
      }
      let path = new Path('/a^b', { strictMode: false })
      expect(path.path).to.eql('/a%5Eb')
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
      let path = new Path('/a^b', { strictMode: false, ignoreWarnings: true })
      expect(path.path).to.eql('/a%5Eb')
    } finally {
      console.warn = warn
    }
    expect(warning).to.be.false
  })
})

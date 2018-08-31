'use strict'

const expect = require('chai').expect
const Component = require('../lib/component')

describe('Component positive test', () => {
  let tests = [
    { input: 'aaa', path: 'aaa', matcher: 'simpleMatcher', variables: [], pattern: 'aaa',
      matches: { 'foo': null,
                 'aaa': {},
                 'f%6f%6f': null,
                 'a%61%61': {},
                 'f%6F%6F': null,
                 'a%61%61': {},
      },
    },
    { input: '{xxx}', path: '{xxx}', matcher: 'variableMatcher', variables: [ 'xxx' ], pattern: '*',
      matches: { 'foo': { xxx: 'foo' },
      },
    },
    { input: 'bbb{xxx}', path: 'bbb{xxx}', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: 'bbb*',
      matches: { 'foo': null,
                 'bbb': null,
                 'bbbfoo': { xxx: 'foo' },
      },
    },
    { input: '{xxx}ccc', path: '{xxx}ccc', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: '*ccc',
      matches: { 'foo': null,
                 'ccc': null,
                 'fooccc': { xxx: 'foo' },
      },
    },
    { input: 'ddd{xxx}eee', path: 'ddd{xxx}eee', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: 'ddd*eee',
      matches: { 'foo': null,
                 'ddd': null,
                 'eee': null,
                 'dddeee': null,
                 'dddfooeee': { xxx: 'foo' },
      },
    },
    { input: 'a^a', path: 'a%5Ea', matcher: 'simpleMatcher', variables: [ ], pattern: 'a%5Ea',
      matches: { 'foo': null,
                 'a^a': {},
                 'a%5Ea': {},
      },
    },
    { input: 'b^b{xxx}', path: 'b%5Eb{xxx}', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: 'b%5Eb*',
      matches: { 'foo': null,
                 'b%5Eb': null,
                 'b^bfoo': { xxx: 'foo' },
                 'b%5Ebfoo': { xxx: 'foo' },
      },
    },
    { input: '{xxx}c^c', path: '{xxx}c%5Ec', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: '*c%5Ec',
      matches: { 'foo': null,
                 'c%5Ec': null,
                 'fooc^c': { xxx: 'foo' },
                 'fooc%5Ec': { xxx: 'foo' },
      },
    },
    { input: 'd^d{xxx}e^e', path: 'd%5Ed{xxx}e%5Ee', matcher: 'regexpMatcher', variables: [ 'xxx' ], pattern: 'd%5Ed*e%5Ee',
      matches: { 'foo': null,

                 'd%5Ed': null,
                 'd^dfoo': null,
                 'd%5Edfoo': null,

                 'e%5Ee': null,
                 'fooe^e': null,
                 'fooe%5Ee': null,

                 'd%5Ede%5Ee': null,
                 'd^dfooe^e': { xxx: 'foo' },
                 'd%5Edfooe%5Ee': { xxx: 'foo' },
      },
    },

    // More complext test case

    { input: 'f^f{xxx}ggg{yyy}h^h', path: 'f%5Ef{xxx}ggg{yyy}h%5Eh', matcher: 'regexpMatcher', variables: [ 'xxx', 'yyy' ], pattern: 'f%5Ef*ggg*h%5Eh',
      matches: { 'f%5Efgggh%5Eh': null,
                 'f%5Effoogggbarh%5Eh': { xxx: 'foo', yyy: 'bar' },
      },
    },

    // What if we have a special RegEx characters?

    { input: '{name}.{ext}', path: '{name}.{ext}', matcher: 'regexpMatcher', variables: [ 'name', 'ext' ], pattern: '*.*',
      matches: { 'fileorext': null,
                 'filename.': null,
                 '.extension': null,
                 'filename.extension': { name: 'filename', ext: 'extension' },
      },
    },

  ]

  for (let test of tests) {
    describe(`Testing input "${test.input}"`, () => {
      let component
      before(() => {
        component = new Component(test.input)
      })

      it('Should produce a valid Component object', () => {
        expect(component).to.be.an.instanceOf(Component)
      })

      it(`Should normalise the component to "${test.path}"`, () => {
        expect(component.path).to.eql(test.path)
      })

      it(`Should produce a pattern equal to "${test.pattern}"`, () => {
        expect(component.pattern).to.eql(test.pattern)
      })

      it(`Should expose the variables ${JSON.stringify(test.variables)}`, () => {
        expect(component.variables).to.eql(test.variables)
      })


      it(`Should match using a "${test.matcher}" function`, () => {
        expect(component.match).to.be.a('function')
        expect(component.match.name).to.eql(test.matcher)
      })

      for (let match in test.matches) {
        if (test.matches.hasOwnProperty(match)) {
          let result = test.matches[match]

          it(`Should match "${match}" as "${JSON.stringify(result)}"`, () => {
            expect(component.match(match)).to.eql(result)
          })
        }
      }
    })
  }

  it('should re-encode a path component when specified to do so', () => {
    let component = new Component('b^b{xxx}')

    expect(component.match('b^bfoo', true)).to.eql({ xxx: 'foo' })
    expect(component.match('b%5Ebfoo', true)).to.eql({ xxx: 'foo' })

    expect(component.match('b^bfoo', true)).to.eql({ xxx: 'foo' })
    expect(component.match('b%5Ebf%6fo', true)).to.eql({ xxx: 'foo' })

    expect(component.match('b^bfoo', false)).to.be.null
    expect(component.match('b%5Ebf%6fo', false)).to.eql({ xxx: 'foo' })

    expect(component.match('b^bfoo', false)).to.be.null
    expect(component.match('b%5Ebf%6fo', false)).to.eql({ xxx: 'foo' })
  })
})

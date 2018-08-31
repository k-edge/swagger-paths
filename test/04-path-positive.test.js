'use strict'

const expect = require('chai').expect
const Path = require('../lib/path')

describe('Path positive test', () => {
  let tests = [
    { input: '/', variables: [], pattern: '/',
      matches: { '': {},
                 '/': {},
                 '//': {},
                 '///': {},
                 '/aaa': null,
      },
    },
    { input: '/{xxx}', variables: [ 'xxx' ], pattern: '/*',
      matches: { '': null,
                 '/': null,
                 '//': null,
                 '///': null,
                 'aaa': { xxx: 'aaa' },
                 '/aaa': { xxx: 'aaa' },
                 '//aaa': { xxx: 'aaa' },
                 '///aaa': { xxx: 'aaa' },
                 '/aaa/bbb': null,
                 '/a%2fb/': { xxx: 'a/b' },
      },
    },
    { input: '/{xxx}.{yyy}', variables: [ 'xxx', 'yyy' ], pattern: '/*.*',
      matches: { '/': null,
                 '/aaa': null,
                 '/aaa.bbb': { xxx: 'aaa', yyy: 'bbb' },
                 '': null,
                 'aaa': null,
                 'aaa.bbb': { xxx: 'aaa', yyy: 'bbb' },
                 'aaa%2ebbb': { xxx: 'aaa', yyy: 'bbb' },
                 '/aaa.bbb/ccc': null,
                 '/a%2fb.c%2fd/': { xxx: 'a/b', yyy: 'c/d' },
      },
    },
    { input: '/foo/{xxx}.{yyy}', variables: [ 'xxx', 'yyy' ], pattern: '/foo/*.*',
      matches: { '/': null,
                 '/foo': null,
                 '/foo/': null,
                 '/foo/bar': null,
                 '/foo/bar.baz': { xxx: 'bar', yyy: 'baz' },
                 '//': null,
                 '//foo': null,
                 '//foo/': null,
                 '//foo/bar': null,
                 '//foo/bar.baz': { xxx: 'bar', yyy: 'baz' },
                 '///': null,
                 '///foo': null,
                 '///foo/': null,
                 '///foo/bar': null,
                 '///foo/bar.baz': { xxx: 'bar', yyy: 'baz' },
                 '': null,
                 'foo': null,
                 'foo/': null,
                 'foo/bar': null,
                 'foo/bar.baz': { xxx: 'bar', yyy: 'baz' },
      },
    },
    { input: '/{xxx}.{yyy}/foo', variables: [ 'xxx', 'yyy' ], pattern: '/*.*/foo',
      matches: { '/': null,
                 '/bar.baz': null,
                 '/bar.baz/': null,
                 '/bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 '/bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 '': null,
                 'bar.baz': null,
                 'bar.baz/': null,
                 'bar.baz//': null,
                 'bar.baz///': null,
                 'bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz//foo': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz//foo/': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz///foo': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz///foo/': { xxx: 'bar', yyy: 'baz' },
                 '': null,
                 'bar.baz': null,
                 'bar.baz/': null,
                 'bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz/foo//': { xxx: 'bar', yyy: 'baz' },
                 'bar.baz/foo///': { xxx: 'bar', yyy: 'baz' },
      },
    },
    { input: '/pre/{xxx}.{yyy}/foo', variables: [ 'xxx', 'yyy' ], pattern: '/pre/*.*/foo',
      matches: { '/pre/': null,
                 '/pre/bar.baz': null,
                 '/pre/bar.baz/': null,
                 '/pre/bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 '/pre/bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 'pre/': null,
                 'pre/bar.baz': null,
                 'pre/bar.baz/': null,
                 'pre/bar.baz//': null,
                 'pre/bar.baz///': null,
                 'pre/bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz//foo': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz//foo/': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz///foo': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz///foo/': { xxx: 'bar', yyy: 'baz' },
                 'pre/': null,
                 'pre/bar.baz': null,
                 'pre/bar.baz/': null,
                 'pre/bar.baz/foo': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz/foo/': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz/foo//': { xxx: 'bar', yyy: 'baz' },
                 'pre/bar.baz/foo///': { xxx: 'bar', yyy: 'baz' },
      },
    },
    { input: '/a%5Ea/{xxx}', variables: [ 'xxx' ], pattern: '/a%5Ea/*',
      matches: { '/a^a/foo': { xxx: 'foo' },
                 '/a%5Ea/foo': { xxx: 'foo' },
      },
    },
  ]

  for (let test of tests) {
    describe(`Testing input "${test.input}"`, () => {
      let path
      before(() => {
        path = new Path(test.input)
      })

      it('Should produce a valid Path object', () => {
        expect(path).to.be.an.instanceOf(Path)
      })

      it(`Should produce a pattern equal to "${test.pattern}"`, () => {
        expect(path.pattern).to.eql(test.pattern)
      })

      it(`Should expose the variables ${JSON.stringify(test.variables)}`, () => {
        expect(path.variables).to.eql(test.variables)
      })

      for (let match in test.matches) {
        if (test.matches.hasOwnProperty(match)) {
          let result = test.matches[match]

          it(`Should match "${match}" as "${JSON.stringify(result)}"`, () => {
            expect(path.match(match)).to.eql(result)
          })
        }
      }
    })
  }
})

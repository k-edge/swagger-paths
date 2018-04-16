'use strict';

const assert = require('assert');

function deepEqual(result, expected, message) {
  try {
    if (typeof expected === 'string') {
      assert.ok(result === expected || (new RegExp(expected).test(result)));
    } else {
      assert.deepEqual(result, expected, message);
    }
  } catch (e) {
    console.log('Expected:\n' + JSON.stringify(expected,null,2));
    console.log('Result:\n' + JSON.stringify(result,null,2));
    throw e;
  }
}

/* ========================================================================== *
 * CREATE AND RUN TESTS                                                       *
 * ========================================================================== */

const Paths = require('..');

describe('Basic tests', function() {

  let paths = new Paths({'/': 'root resource'});

  it('should not construct with no paths', function() {
    assert.throws(() => new Paths(), /^Error: Constructed without paths$/);
  });

  it('should not construct with wrong paths', function() {
    assert.throws(() => new Paths('foo'), /^Error: Parameter should be an object$/);
  });

  it('should not construct with an empty path', function() {
    assert.throws(() => new Paths({ '': 'empty' }), /^Error: Invalid empty path$/);
  });

  it('should not match with a null path', function() {
    assert.strictEqual(paths.lookup(null), null);
  });

  it('should not match with an undefined path', function() {
    assert.strictEqual(paths.lookup(), null);
  });

  it('should fail match with a non-string path', function() {
    assert.throws(() => paths.lookup(123), /^Error: Path must be a string$/);
  });

  it('should match our root resource', function() {
    deepEqual(paths.lookup('/'), { params: {}, value: 'root resource' });
  });

  it('should match the empty string to our root resource', function() {
    deepEqual(paths.lookup(''), { params: {}, value: 'root resource' });
  });

});

describe('Extended tests', function() {

  let paths = new Paths({
    '/x'     : 'fixed',
    '/y/{p}' : 'required',
    '/z{/p}' : 'optional'
  });

  const expectations = {
    "/x"   : { params: {}, value: 'fixed' },
    "/x/"  : null,
    "/x/w" : null,
    "/y"   : null,
    "/y/"  : { params: {},            value: 'required' },
    "/y/w" : { params: { p: 'w' },    value: 'required' },
    "/z"   : { params: {},            value: 'optional' },
    "/z/"  : { params: {},            value: 'optional' },
    "/z/w" : { params: { '/p': 'w' }, value: 'optional' },
  };

  Object.keys(expectations).forEach(function(key) {
    var val = expectations[key];
    it(`should match "${key}"`, function() {
      deepEqual(paths.lookup(key), val);
    });
  });
});

describe('Set of lookups', function() {

  /* Paths to test against */
  const paths = [
    '/page',
    '/page/',
    '/page/{title}',
    '/page/{title}/',
    '/page/{title}/html',
    '/page/{title}/html/',
    '/page/{title}/html/{revision}',
    '/page/{title}/data-parsoid',
    '/page/{title}/data-parsoid/',
    '/page/{title}/data-parsoid/{revision}',
    '/transform/html/to/{format}',
    '/transform/wikitext/to/{format}',
    '/transform/',
    '/double/',
    '/double//',
    '/double//slash',
    '/some/really/long/path',

    /* Modifiers: optional path segments */

    '/simple/{templated}{/path}',
    '/several{/optional}{/path}{+segments}',
    '/optional/{+path}',
    '/overlapping/{wildcard}',
    '/overlapping/concrete',
  ];

  /* Domains to test again (prefix) */
  var domains = [
    'en.wikipedia.org',
    'de.wikipedia.org',
    'fr.wikipedia.org',
    'es.wikipedia.org'
  ];

  /* Expectations to match */
  var expectations = {
    '/en.wikipedia.org/v1/page': {
      value: '/page',
      params: {
        domain: 'en.wikipedia.org'
      }
    },
    '/de.wikipedia.org/v1/page/': {
      value: '/page/',
      params: {
        domain: 'de.wikipedia.org'
      }
    },
    '/fr.wikipedia.org/v1/page/Foo': {
      value: '/page/{title}',
      params: {
        domain: 'fr.wikipedia.org',
        title: 'Foo'
      }
    },

    /* static listing of available formats */

    '/es.wikipedia.org/v1/page/Foo/': {
      value: '/page/{title}/',
      params: {
        domain: 'es.wikipedia.org',
        title: 'Foo'
      }
    },
    '/en.wikipedia.org/v1/page/Foo/html': {
      value: '/page/{title}/html',
      params: {
        domain: 'en.wikipedia.org',
        title: 'Foo'
      }
    },
    '/de.wikipedia.org/v1/transform/html/to/wikitext': {
      value: '/transform/html/to/{format}',
      params: {
        domain: 'de.wikipedia.org',
        format: 'wikitext'
      }
    },

    /* static listing */

    '/fr.wikipedia.org/v1/transform/': {
      value: '/transform/',
      params: {
        domain: 'fr.wikipedia.org'
      }
    },

    /* static listing, another wiki */

    '/es.wikipedia.org/v1/transform/': {
      value: '/transform/',
      params: {
        domain: 'es.wikipedia.org'
      }
    },

    /* double slashes */

    '/en.wikipedia.org/v1/double/': {
      value: '/double/',
      params: {
        domain: 'en.wikipedia.org'
      }
    },
    '/de.wikipedia.org/v1/double//': {
      value: '/double//',
      params: {
        domain: 'de.wikipedia.org'
      }
    },
    '/fr.wikipedia.org/v1/double//slash': {
      value: '/double//slash',
      params: {
        domain: 'fr.wikipedia.org'
      }
    },
    '/es.wikipedia.org/v1/some/really/long/path': {
      value: '/some/really/long/path',
      params: {
        domain: 'es.wikipedia.org'
      }
    },

    /* Optional path segments */

    '/en.wikipedia.org/v1/several': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org'
      }
    },
    '/en.wikipedia.org/v1/several/optional': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional'
      }
    },
    '/en.wikipedia.org/v1/several/optional/path': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path'
      }
    },
    '/en.wikipedia.org/v1/several/optional/path/segments': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path',
        '+segments': 'segments',
      }
    },
    '/en.wikipedia.org/v1/several/optional/path/segments/a': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path',
        '+segments': 'segments/a',
      }
    },
    '/en.wikipedia.org/v1/several/optional/path/segments/a/b': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path',
        '+segments': 'segments/a/b',
      }
    },
    '/en.wikipedia.org/v1/several/optional/path/a%2fb': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path',
        '+segments': 'a%2Fb',
      }
    },
    '/en.wikipedia.org/v1/several/optional/path/segments/a%2fb': {
      value: '/several{/optional}{/path}{+segments}',
      params: {
        domain: 'en.wikipedia.org',
        '/optional': 'optional',
        '/path': 'path',
        '+segments': 'segments/a%2Fb',
      }
    },
    '/en.wikipedia.org/v1/simple/templated': {
      value: '/simple/{templated}{/path}',
      params: {
        domain: 'en.wikipedia.org',
        templated: 'templated'
      }
    },
    '/en.wikipedia.org/v1/simple/templated/path': {
      value: '/simple/{templated}{/path}',
      params: {
        domain: 'en.wikipedia.org',
        templated: 'templated',
        '/path': 'path'
      }
    },

    '/en.wikipedia.org/v1/simple/templated/path/toolong': null,

    '/en.wikipedia.org/v1/optional': null,

    '/en.wikipedia.org/v1/optional/': {
      params: {
        domain: 'en.wikipedia.org',
      },
      value: '/optional/{+path}'
    },
    '/en.wikipedia.org/v1/optional/path': {
      value: '/optional/{+path}',
      params: {
        domain: 'en.wikipedia.org',
        '+path': 'path'
      }
    },
    '/en.wikipedia.org/v1/optional/path/': {
      value: '/optional/{+path}',
      params: {
        domain: 'en.wikipedia.org',
        '+path': 'path',
      }
    },
    '/en.wikipedia.org/v1/optional/path/bits': {
      value: '/optional/{+path}',
      params: {
        domain: 'en.wikipedia.org',
        '+path': 'path/bits'
      }
    },

    /* Overlapping paths */

    '/en.wikipedia.org/v1/overlapping/concrete': {
      value: '/overlapping/concrete',
      params: {
        domain: 'en.wikipedia.org',
      }
    },
    '/en.wikipedia.org/v1/overlapping/other': {
      value: '/overlapping/{wildcard}',
      params: {
        domain: 'en.wikipedia.org',
        wildcard: 'other',
      }
    },

    /* A few paths that should not match */

    '/en.wikipedia.org/v1/pages': null,
    '/en.wikipedia.org/v1/pages/': null,
    '/de.wikipedia.org/v1/pages/': null,
    '/en.wikipedia.org/v1//': null,
    '/it.wikipedia.org/v1/page/': null
  };

  function addPrefixedPaths(newPaths, prefix, paths) {
    var newSpec = {};
    for (var path of paths) {
      newPaths[prefix + path] = path;
    }
  }

  function makeFullSpec () {
    var fullPaths = {};
    domains.forEach(function(domain) {
      addPrefixedPaths(fullPaths, '/{domain:' + domain + '}/v1', paths);
    });

    return fullPaths;
  }

  let instance = new Paths(makeFullSpec());;

  Object.keys(expectations).forEach(function(key) {
    var val = expectations[key];
    it(`should match "${key}"`, function() {
      deepEqual(instance.lookup(key), val);
    });
  });
});

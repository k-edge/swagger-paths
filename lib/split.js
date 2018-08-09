'use strict'

const reencode = require('./reencode')

module.exports = function split(path, reencodeComponents = true) {
  /* Remove duplicate, leading and trailing slashes */
  let canonical = path.replace(/\/\/+/g, '/')
                      .replace(/^\//, '')
                      .replace(/\/$/, '')

  /* The empty string (could be '///', or '/', or '' basically is root */
  if (! canonical) return []

  /* Split up the path components */
  let parts = canonical.split('/')

  /* If no reencoding needed, just return */
  if (! reencodeComponents) return parts

  /* Re-encode each path component */
  let reencoded = []
  for (let part of parts) reencoded.push(reencode(part))
  return reencoded
}

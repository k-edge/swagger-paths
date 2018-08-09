'use strict'

module.exports = function reencode(string) {
  return encodeURIComponent(decodeURIComponent(string))
}

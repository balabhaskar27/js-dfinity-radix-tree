const Uint1Array = require('uint1array')

function toTypedArray (array) {
  return new Uint1Array(new Uint8Array(array).buffer)
}

// helper functions for nodes
const EXTENSION = exports.EXTENSION = 0
const LBRANCH = exports.LBRANCH = 1
const RBRANCH = exports.RBRANCH = 2
const VALUE = exports.VALUE = 3

exports.setBranch = function (node, branch) {
  node['/'][LBRANCH] = branch[0]
  node['/'][RBRANCH] = branch[1]
}

exports.getBranch = function (node) {
  return node['/'].slice(LBRANCH, LBRANCH + 2)
}

exports.getValue = function (node) {
  return node['/'][VALUE]
}

exports.deleteValue = function (node) {
  delete node['/'][VALUE]
}

exports.getExtension = function (node) {
  if (node['/'][EXTENSION]) {
    const len = node['/'][EXTENSION][0]
    const extension = toTypedArray(node['/'][EXTENSION][1])
    return extension.subarray(0, len)
  } else {
    return toTypedArray([])
  }
}

exports.setExtension = function (node, ex) {
  if (ex && ex.length) {
    node['/'][EXTENSION] = [ex.length, Buffer.from(ex.buffer)]
  } else {
    delete node['/'][EXTENSION]
  }
}

exports.setValue = function (node, val) {
  node['/'][VALUE] = val
}

exports.isEmpty = function (node) {
  const branch = exports.getBranch(node)
  return !node['/'][EXTENSION] && !branch[0] && !branch[1] && node['/'][VALUE] === undefined
}

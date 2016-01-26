var NAME = process.env.NAME || process.argv[2] || 'a'
var REMOTES = (process.env.REMOTES || process.argv[3] || '').split(',')

var n = require('..')({remotes:REMOTES, silent:false})
n.join({name:NAME})

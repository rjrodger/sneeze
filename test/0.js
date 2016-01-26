var NAME = process.env.NAME || process.argv[2] || '0'
var PORT = process.env.PORT || process.argv[3] || 39999
var REMOTES = (process.env.REMOTES || process.argv[4] || '').split(',')

var n = require('..')({base:true, silent:false, port:PORT, remotes:REMOTES})

n.join({name:NAME})

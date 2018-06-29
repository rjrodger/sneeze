// quick start with single base:
// $ node base.js

// multi-base network:
// $ node base.js b0 127.0.0.1 39000 127.0.0.1:39000,127.0.0.1:39001
// $ node base.js b1 127.0.0.1 39001 127.0.0.1:39000,127.0.0.1:39001

var NAME = process.env.NAME || process.argv[2] || 'b0'
var HOST = process.env.HOST || process.argv[3] || '127.0.0.1'
var PORT = process.env.PORT || process.argv[4] || 39000
var BASES = (process.env.BASES || process.argv[5] || '127.0.0.1:39000').split(',')

require('..')({
  isbase: true, 
  silent: true, 
  host: HOST,
  port: PORT, 
  bases: BASES
}).join({name: NAME})


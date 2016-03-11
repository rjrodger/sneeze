// quick start with single base:
// $ node base.js

// multi-base network:
// $ node base.js b0 39000 127.0.0.1:39000,127.0.0.1:39001
// $ node base.js b1 39001 127.0.0.1:39000,127.0.0.1:39001

var NAME = process.env.NAME || process.argv[2] || 'b0'
var PORT = process.env.PORT || process.argv[3] || 39999
var BASES = (process.env.BASES || process.argv[4] || '').split(',')

require('..')({
  isbase: true, 
  silent: true, 
  port: PORT, 
  bases: BASES
}).join({name: NAME})


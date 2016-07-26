// quick start with single base:
// multiple: $ node member.js

// multi-base network:
// $ node member.js m0 127.0.0.1 127.0.0.1:39000,127.0.0.1:39001
// $ node member.js m1 127.0.0.1 127.0.0.1:39000,127.0.0.1:39001
// $ node member.js m2 127.0.0.1 127.0.0.1:39000,127.0.0.1:39001
// ...

var NAME = process.env.NAME || process.argv[2] || 'm0'
var HOST = process.env.HOST || process.argv[3] || '127.0.0.1'
var BASES = (process.env.BASES || process.argv[4] || '127.0.0.1:39000').split(',')

require('..')({
  bases: BASES,
  host: HOST,  
  silent: false
})
  .join({name: NAME})

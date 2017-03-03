// print dynamic table of all members:
// $ node monitor.js 127.0.0.1 127.0.0.1:39000,127.0.0.1:39001

var HOST = process.env.HOST || process.argv[2] || '127.0.0.1'
var BASES = (process.env.BASES || process.argv[3] || '127.0.0.1:39000').split(',')

require('..')({
  bases: BASES,
  host: HOST,  
  silent: true,
  monitor: {
    active: true,
    meta: ['name']
  }
})
  .join()

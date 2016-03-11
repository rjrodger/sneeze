
var name = process.argv[2]

var _ = require('lodash')
var Sneeze = require('..')

var silent = true
var bases = ['127.0.0.1:39000','127.0.0.1:39001']

var worker = Sneeze({
  silent: silent, identifier:name, bases:bases
})
worker.on('error',console.log)
worker.join({name:name})

var j = 0
setInterval( function() {
  ++j

  m = [], sb = '' 
  var ms = worker.members()
  _.each( ms, function (n) {
    m.push(n.name)
  })
  m.sort()
  var sb = j+' --- '+name+':'+m.length+' '+m.join(',')

  console.log(sb)  
}, 1000)

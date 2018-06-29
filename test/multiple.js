
spawn = require('child_process').spawn

var count = parseInt(process.argv[2])
var mark = process.argv[3] || ''

for( var i = 0; i < count; i++ ) {
  spawn('node',['worker.js',(''+(1000+i)).substring(1)+mark],{stdio:'inherit'})
}

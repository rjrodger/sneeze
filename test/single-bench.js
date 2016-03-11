
var _ = require('lodash')

var Sneeze = require('..')

var silent = true
var bases = ['127.0.0.1:39000','127.0.0.1:39001']

var b0 = Sneeze({
  isbase: true, silent: silent, identifier:'b0',
  host:'127.0.0.1',port:39000,
  bases:bases
})
//b0.on('error',done)
b0.join({name:'b0'})


function make_node (name,i) {
  var n = Sneeze({silent: silent, identifier:name, bases:bases})
  
  //nA.on('error',done)
  //setTimeout( function () { 
  n.join({name:name})
  //},(i*10))
  
  return n
}


var nodes = [], nodemap = {}
for( var i = 0; i < 110; i++ ) {
  var nn = 'n'+(''+(1000+i)).substring(1)
  nodemap[nn] = make_node(nn,i)
  nodes.push(nodemap[nn])
}


var j = 100

function list_members () {
  --j

  var m, sb
  
  m = [], sb = ''
  _.each( nodes, function (n) {
    m.push( n.id+':'+_.keys(n.members()).length )
  })
  sb = j+' --- '+m.join(',')
  console.log(sb)
  

  var mn = Math.floor(i/2)
  m = [], sb = '' 
  var n2m = nodes[mn].members()
  _.each( n2m, function (n) {
    //m.push( n.id+':'+_.keys(n.members()).length )
    //m.push(Util.inspect(n))
    m.push(n.name)
  })
  m.sort()
  var sb = j+' --- '+mn+':'+m.length+' '+m.join(',')
  console.log(sb)


  if( 0 < j ) {
    setTimeout(list_members,500)
  }
  else {
    console.log('DONE')
  }
}

list_members()



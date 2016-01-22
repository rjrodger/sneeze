var n = require('..')()

n.on('add',function(meta){
  console.log('C-ADD',meta)
})

n.on('remove',function(meta){
  console.log('C-REMOVE',meta)
})

n.join({name:'b'},console.log)

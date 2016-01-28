'use strict'

var _ = require('lodash')

var Sneeze = require('..')

const Code = require('code')
const Lab = require('lab')


const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect


describe('sneeze', function () {

  it('happy', { parallel: false }, function (done) {
    var log = [], append = function(tag){ return function(arg) {
      log.push(tag+'~'+arg.name)
    }}

    var base = Sneeze({isbase: true})
    base.on('add',append('a0'))
    base.on('remove',append('r0'))
    base.on('error',done)
    base.join({name:'0'})

    var nodeA = Sneeze({port:44444})
    nodeA.on('add',append('aA'))
    nodeA.on('remove',append('rA'))
    nodeA.on('error',done)
    nodeA.join({name:'A'})

    var nodeB = Sneeze()
    nodeB.on('add',append('aB'))
    nodeB.on('remove',append('rB'))
    nodeB.on('error',done)
    nodeB.join({name:'B'})
    
    wait_ready( [base, nodeA, nodeB], function () {
      expect(log).to.deep.equal(
        [ 'a0~A', 'a0~B', 'aA~0', 'aA~B', 'aB~A', 'aB~0' ])

      base.leave()
      nodeA.leave()
      nodeB.leave()
      done()
    })      
  })


  it('collision', { parallel: false }, function (done) {
    var base = Sneeze({isbase: true})
    base.on('error',function(err){
      done()
    })
    base.join({name:'0'})

    var nodeA = Sneeze({port:44444})
    nodeA.on('error',function(err){
      done(err)
    })
    nodeA.join()

    var nodeB = Sneeze({port:44444,retry_min:10,retry_max:20,silent:true})

    nodeB.on('error',function (){
      base.leave()
      nodeA.leave()
      done()
    })

    nodeB.join()
  })


  it('identifier', { parallel: false }, function (done) {
    var base = Sneeze({isbase: true})
    base.on('error',done)
    base.join({name:'0',identifier$:'0'})

    var nodeA = Sneeze()
    nodeA.on('error',done)
    nodeA.join({name:'A',identifier$:'q'})

    var nodeB = Sneeze()
    nodeB.on('error',done)
    nodeB.join({name:'B',identifier$:'q'})

    wait_ready( [base, nodeA, nodeB], function () {
      base.leave()
      nodeA.leave()
      nodeB.leave()
      done()
    })
  })


  it('leave', { parallel: false, timeout: 3333 }, function (done) {
    var log = [], append = function(tag){ return function(arg) {
      log.push(tag+'~'+arg.name)
    }}

    var base = Sneeze({isbase: true})
    base.on('add',append('a0'))
    base.on('remove',append('r0'))
    base.on('error',done)
    base.join({name:'0'})

    var nodeA = Sneeze({port:44444})
    nodeA.on('add',append('aA'))
    nodeA.on('remove',append('rA'))
    nodeA.on('error',done)
    nodeA.join({name:'A'})

    var nodeB = Sneeze()
    nodeB.on('add',append('aB'))
    nodeB.on('remove',append('rB'))
    nodeB.on('error',done)
    nodeB.join({name:'B'})


    wait_ready( [base, nodeA, nodeB], function () {
      nodeA.leave()

      setTimeout(function(){
        expect(log.length).to.equal(8)

        base.leave()
        nodeB.leave()
        setTimeout(done,333)
        
      },222)
    })
  })


  it('tag', { parallel: false }, function (done) {
    var base = Sneeze({isbase: true, silent: true})
    base.on('error',done)
    base.join({name:'foo-0',identifier$:'foo-0'})

    var nodeA_foo = Sneeze({silent: true, tag: 'foo'})
    nodeA_foo.on('error',done)
    nodeA_foo.join({name:'foo-A',identifier$:'foo-A'})

    var nodeB_foo = Sneeze({silent: true, tag: 'foo'})
    nodeB_foo.on('error',done)
    nodeB_foo.join({name:'foo-B',identifier$:'foo-B'})


    var nodeA_bar = Sneeze({silent: true, tag: 'bar'})
    nodeA_bar.on('error',done)
    nodeA_bar.join({name:'bar-A',identifier$:'bar-A'})

    var nodeB_bar = Sneeze({silent: true, tag: 'bar'})
    nodeB_bar.on('error',done)
    nodeB_bar.join({name:'bar-B',identifier$:'bar-B'})


    wait_ready( [base, nodeA_foo, nodeA_bar, nodeB_foo, nodeB_bar], function () {
      expect( _.keys(base.members()).sort() ).to.deep.equal([
        'bar-A', 'bar-B', 'foo-A', 'foo-B'
      ])
      expect( _.keys(nodeA_foo.members()).sort() ).to.deep.equal([
        'foo-B'
      ])
      expect( _.keys(nodeB_foo.members()).sort() ).to.deep.equal([
        'foo-A'
      ])
      expect( _.keys(nodeA_bar.members()).sort() ).to.deep.equal([
        'bar-B'
      ])
      expect( _.keys(nodeB_bar.members()).sort() ).to.deep.equal([
        'bar-A'
      ])

      base.leave()
      nodeA_foo.leave()
      nodeB_foo.leave()
      nodeA_bar.leave()
      nodeB_bar.leave()
      done()
    },333)
  })
})


function wait_ready( nodes, done ) {
  var node, count = nodes.length
  while( node = nodes.shift() ) {
    node.on('ready',function() {
      count--
      if( 0 === count ) done();
    })
  }
}

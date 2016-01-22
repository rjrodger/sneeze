'use strict'

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

    var base = Sneeze({base:true})
    base.on('add',append('a0'))
    base.on('remove',append('r0'))
    base.on('error',done)
    base.join({name:'0'})

    setTimeout( function() {
      var nodeA = Sneeze({port:44444})
      nodeA.on('add',append('aA'))
      nodeA.on('remove',append('rA'))
      nodeA.on('error',done)
      nodeA.join({name:'A'})

      setTimeout( function() {
        var nodeB = Sneeze()
        nodeB.on('add',append('aB'))
        nodeB.on('remove',append('rB'))
        nodeB.on('error',done)
        nodeB.join({name:'B'})

        setTimeout(function(){
          expect(log).to.deep.equal(
            [ 'a0~A', 'a0~B', 'aA~0', 'aA~B', 'aB~A', 'aB~0' ])

          base.leave()
          nodeA.leave()
          nodeB.leave()
          setTimeout(done,333)

        },333)
      },55)
    },55)
  })


  it('collision', { parallel: false }, function (done) {
    var base = Sneeze({base:true})
    base.on('error',done)
    base.join({name:'0'})

    var nodeA = Sneeze({port:44444})
    nodeA.on('error',done)
    nodeA.join()

    var nodeB = Sneeze({port:44444,retry_min:10,retry_max:20,silent:true})
    nodeB.join()
    nodeB.on('error',function(){
      base.leave()
      nodeA.leave()
      setTimeout(done,333)
    })
  })


  it('identifier', { parallel: false }, function (done) {
    var base = Sneeze({base:true})
    base.on('error',done)
    base.join({name:'0',identifier:'0'})

    var nodeA = Sneeze()
    nodeA.on('error',done)
    nodeA.join({name:'A',identifier:'q'})

    var nodeB = Sneeze()
    nodeB.on('error',done)
    nodeB.join({name:'B',identifier:'q'})

    setTimeout(function(){
      base.leave()
      nodeA.leave()
      nodeB.leave()
      done()
    },333)
  })


  it('leave', { parallel: false, timeout: 3333 }, function (done) {
    var log = [], append = function(tag){ return function(arg) {
      log.push(tag+'~'+arg.name)
    }}

    var base = Sneeze({base:true})
    base.on('add',append('a0'))
    base.on('remove',append('r0'))
    base.on('error',done)
    base.join({name:'0'})

    setTimeout( function() {
      var nodeA = Sneeze({port:44444})
      nodeA.on('add',append('aA'))
      nodeA.on('remove',append('rA'))
      nodeA.on('error',done)
      nodeA.join({name:'A'})

      setTimeout( function() {
        var nodeB = Sneeze()
        nodeB.on('add',append('aB'))
        nodeB.on('remove',append('rB'))
        nodeB.on('error',done)
        nodeB.join({name:'B'})

        setTimeout( function() {
          nodeA.leave()
          nodeA.leave()

          setTimeout(function(){
            expect(log.length).to.equal(8)

            base.leave()
            nodeB.leave()
            setTimeout(done,333)

          },1999)
        },111)
      },111)
    },111)
  })
})

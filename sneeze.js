/*
  MIT License,
  Copyright (c) 2016, Richard Rodger and other contributors.
*/

'use strict'

var Events = require('events')
var Util = require('util')

var _ = require('lodash')
var Swim = require('swim')


module.exports = function (options) {
  return new Sneeze( options )
}


function Sneeze (options) {
  Events.EventEmitter.call(this)
  var self = this

  // merge default options with any provided by the caller
  options = _.defaultsDeep(options,{
    host: '127.0.0.1',
    remotes: ['127.0.0.1:39999']
  })

  // become a base node
  if( options.base ) {
    options.host = '127.0.0.1'
    options.port = 39999
  }
  else {
    if( !options.port ) {
      options.port = function() {
        return 40000 + Math.floor((10000*Math.random()))
      }
    }
  }


  this.join = function( meta, done ) {

    var attempts = 0, max_attempts = 11

    function join() {
      var host = options.host + ( options.port ? 
                                  ':'+(_.isFunction(options.port) ? 
                                       options.port() : options.port ) : '' )
      var incarnation = Date.now()

      var identifier = host+'~'+incarnation+'~'+Math.random()

      var swim_opts = _.defaultsDeep(options.swim,{
        codec: 'msgpack',
        disseminationFactor: 15,
        interval: 100,
        joinTimeout: 200,
        pingTimeout: 20,
        pingReqTimeout: 60,
        pingReqGroupSize: 3,
        udp: {maxDgramSize: 512},
      })

      swim_opts.local = {
        host: host,
        meta: meta,
        incarnation: incarnation,
        identifier: identifier
      }

      var swim = new Swim(swim_opts)

      swim.on(Swim.EventType.Error, function(err) {
        if ('EADDRINUSE' === err.code && attempts < max_attempts) {
          attempts++
          setTimeout( 
            function() {
              join()
            }, 
            100 + Math.floor(Math.random() * 222)
          )
          return
        }
        else if( err ) {
          // TODO: duplicate call
          return done(err)
        }
      })


      // TODO: this is not being called!
      swim.on(Swim.EventType.Ready, function(){
        done( null, config )
      })

      var remotes = _.compact(options.remotes)

      swim.bootstrap( remotes, function onBootstrap(err) {
        if (err) {
          console.log(err)
          return
        }

        _.each( swim.members(), updateinfo )

        swim.on(Swim.EventType.Change, function onChange(info) {
          // TODO: not used
          //updateinfo(info)
        })

        swim.on(Swim.EventType.Update, function onUpdate(info) {
          updateinfo(info)
        })
        
      })


      function updateinfo( m ) {
        // Ignore updates about myself
        if( m.meta.identifier === identifier ) {
          return
        }
        
        if( 0 === m.state ) {
          add_node( m.meta )
        }
        else {
          remove_node( m.meta )
        }
      }
    }

    join()
  }

  function add_node( meta ) {
    self.emit('add',meta)
  }

  function remove_node( meta ) {
    self.emit('remove',meta)
  }

}
Util.inherits(Sneeze, Events.EventEmitter)

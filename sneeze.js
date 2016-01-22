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

  options = _.defaultsDeep(options,{
    base: false,
    host: '127.0.0.1',
    remotes: ['127.0.0.1:39999'],
    retry_min: 111,
    retry_max: 222,
    silent: false
  })

  if( options.base ) {
    options.port = 39999
  }
  else {
    options.port = options.port || function() {
      return 40000 + Math.floor((10000*Math.random()))
    }
  }

  var swim


  this.join = function( meta ) {
    meta = meta || {}

    var attempts = 0, max_attempts = 11

    function join() {
      var port = ':' + (_.isFunction(options.port) ? options.port() : options.port )
      var host = options.host + port
      var incarnation = Date.now()

      meta.identifier = null == meta.identifier ? 
        host+'~'+incarnation+'~'+Math.random() : meta.identifier

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
      }

      var remotes = _.compact(_.clone(options.remotes))
      if( options.base ) {
        _.remove(remotes,function(r) { return r === '127.0.0.1:39999' })
      }

      swim = new Swim(swim_opts)

      swim.on(Swim.EventType.Error, function(err) {
        if ('EADDRINUSE' === err.code && attempts < max_attempts) {
          attempts++
          setTimeout( 
            function() {
              join()
            }, 
            options.retry_min + 
              Math.floor(Math.random() * (options.retry_max-options.retry_min))
          )
          return
        }
        else if( err ) {
          self.emit('error',err)
        }
      })

      swim.bootstrap( remotes, function onBootstrap(err) {
        if (err) {
          self.emit('error',err)
          return
        }

        _.each( swim.members(), updateinfo )

        swim.on(Swim.EventType.Update, function onUpdate(info) {
          updateinfo(info)
        })
        
      })

      function updateinfo( m ) {
        if( m.meta.identifier === meta.identifier ) {
          return
        }

        if( 0 === m.state ) {
          add_node( m.meta )
        }

        // Note: trigger happy
        else if( 2 === m.state ) {
          remove_node( m.meta )
        }
      }
    }

    join()
  }

  
  self.leave = function() {
    swim && swim.leave()
  }


  function add_node( meta ) {
    self.emit('add',meta)
  }

  function remove_node( meta ) {
    self.emit('remove',meta)
  }

  if( !options.silent ) {
    self.on('error',function(err){
      console.log('SNEEZE-ERROR',err)
    })
  }
}
Util.inherits(Sneeze, Events.EventEmitter)

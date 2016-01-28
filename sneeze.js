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

// NOTE: depends on event handling modifications in
// https://github.com/rjrodger/swim-js

function Sneeze (options) {
  Events.EventEmitter.call(this)
  var self = this
  var tick = 0

  options = _.defaultsDeep(options,{
    isbase: false,
    host: '127.0.0.1',
    bases: ['127.0.0.1:39999'],
    retry_min: 111,
    retry_max: 222,
    silent: true,
    log: null,
    tag: null
  })

  if( !options.silent && null == options.log ) {
    options.log = function () {
      console.log.apply(null,_.flatten(['SNEEZE',tick,arguments]))
    }
  }

  var log = options.log || _.noop

  if( options.isbase ) {
    options.port = null == options.port ? 39999 : options.port
  }
  else {
    options.port = options.port || function() {
      return 40000 + Math.floor((10000*Math.random()))
    }
  }

  var swim
  var members = {}

  this.join = function( meta ) {
    meta = meta || {}

    var attempts = 0, max_attempts = 11

    function join() {
      var port = (_.isFunction(options.port) ? options.port() : options.port )
      var host = options.host + ':' + port
      var incarnation = Date.now()

      meta.identifier$ = null == meta.identifier$ ? 
        host+'~'+incarnation+'~'+Math.random() : meta.identifier$

      meta.tag$ = options.tag

      log('joining',attempts,host,meta.identifier$,meta.tag$)

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

      var bases = _.compact(_.clone(options.bases))
      if( options.isbase ) {
        _.remove(bases,function(r) { return r === host })
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

      swim.bootstrap(bases, function onBootstrap(err) {
        _.each( swim.members(), updateinfo )

        swim.on(Swim.EventType.Update, function onUpdate(info) {
          updateinfo(info)
        })

        if (err) {
          self.emit('error',err)
        }

        self.emit('ready')
      })

      function updateinfo( m ) {
        if( null != meta.tag$ && m.meta.tag$ !== meta.tag$ ) {
          return
        }

        if( m.meta.identifier$ === meta.identifier$ ) {
          return
        }
        
        if( 0 === m.state ) {
          add_node( host, m.meta )
        }

        // Note: trigger happy
        else if( 2 === m.state ) {
          remove_node( host, m.meta )
        }
      }
    }

    join()
  }


  self.members = function() {
    return _.clone( members )
  }

  
  self.leave = function() {
    swim && swim.leave()
  }


  function add_node( host, meta ) {
    log('add', host, meta.identifier$, meta.tag$, meta)
    members[meta.identifier$] = meta
    self.emit('add', meta)
  }


  function remove_node( host, meta ) {
    log('remove', host, meta.identifier$, meta.tag$, meta)
    delete members[meta.identifier$]
    self.emit('remove', meta)
  }


  self.on('error',function(err){
    log('ERROR',err)
  })
}
Util.inherits(Sneeze, Events.EventEmitter)

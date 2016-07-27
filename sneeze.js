/*
  MIT License,
  Copyright (c) 2016, Richard Rodger and other contributors.
*/

'use strict'

var Events = require('events')
var Util = require('util')

var _ = require('lodash')
var Swim = require('swim')
var Optioner = require('optioner')

var Joi = Optioner.Joi

var DEFAULT_HOST = module.exports.DEFAULT_HOST = '127.0.0.1'
var DEFAULT_PORT = module.exports.DEFAULT_PORT = 39999

var optioner = Optioner({
  isbase: false,
  host: DEFAULT_HOST,
  bases: Joi.array().default([DEFAULT_HOST+':'+DEFAULT_PORT]),
  retry_attempts: 22,
  retry_min: 111,
  retry_max: 555,
  silent: true,
  log: null,
  tag: null,
  port: null,
  identifier: null,

  // [include,exclude]
  port_range: [40000,50000]
})


module.exports = function (options) {
  return new Sneeze( options )
}

function Sneeze (options) {
  Events.EventEmitter.call(this)
  var self = this

  optioner(options, function(err, options) {
    if (err) throw err

    var isbase = !!options.isbase

    self.log =
      !!options.silent ? _.noop : 
      _.isFunction(options.log) ? options.log : 
      function () {
        console.log.apply(null,_.flatten(
          ['SNEEZE', (''+Date.now()).substring(8), arguments]))
      }

    self.makeport = _.isFunction(options.port) ? options.port :
      function() {
        var port = parseInt(options.port)
        var pr = options.port_range

        port = !isNaN(port) ? port :
          isbase ? DEFAULT_PORT : 
          pr[0] + 
          Math.floor(((pr[1]-pr[0])*Math.random()))

        return port
      }

    var swim
    var members = {}

    self.join = function( meta ) {
      meta = meta || {}

      var attempts = 0, max_attempts = options.retry_attempts, joined = false

      function join() {
        //var port = (_.isFunction(options.port) ? options.port() : options.port )
        var port = self.makeport()
        var host = options.host + ':' + port
        var incarnation = Date.now()

        self.id = meta.identifier$ = null == options.identifier ?
          host+'~'+incarnation+'~'+Math.random() : options.identifier

        meta.tag$ = options.tag

        self.log('joining',attempts,host,meta.identifier$,meta.tag$)

        var swim_opts = _.defaultsDeep(options.swim,{
          codec: 'msgpack',
          disseminationFactor: 22,
          interval: 111,
          joinTimeout: 777,
          pingTimeout: 444,
          pingReqTimeout: 333,
          pingReqGroupSize: 7,
          udp: {maxDgramSize: 2048},
        })

        swim_opts.local = {
          host: host,
          meta: meta,
          incarnation: incarnation,
        }

        var bases = _.compact(_.clone(options.bases))
        if( isbase ) {
          _.remove(bases,function(r) { return r === host })
        }

        swim = new Swim(swim_opts)

        swim.net.on('error', function(err) {
          if (err && !joined && attempts < max_attempts) {
            attempts++

            var wait = options.retry_min +
                  Math.floor(Math.random() * (options.retry_max-options.retry_min))

            setTimeout(join, wait)
            return
          }
          else if( err ) {
            self.emit('error',err)
            return
          }
        })

        swim.bootstrap(bases, function onBootstrap(err) {
          if (!isbase && err && !joined && attempts < max_attempts) {
            attempts++

            var wait = options.retry_min +
                  Math.floor(Math.random() * (options.retry_max-options.retry_min))

            setTimeout(join, wait)
            return
          }
          else if( err ) {
            // first base node will see a JoinFailedError as there is
            // nobody else out there
            if( !isbase || 'JoinFailedError' !== err.name ) {
              self.emit('error',err)
              return
            }
          }

          joined = true

          _.each( swim.members(), updateinfo )

          swim.on(Swim.EventType.Update, function onUpdate(info) {
            updateinfo(info)
          })

          swim.on(Swim.EventType.Change, function onChange(info) {
            updateinfo(info)
          })

          self.emit('ready')
        })

        function updateinfo( m ) {
          if (!m.meta) {
            return
          }

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
      self.log('add', host, meta.identifier$, meta.tag$, meta)
      members[meta.identifier$] = meta
      self.emit('add', meta)
    }


    function remove_node( host, meta ) {
      self.log('remove', host, meta.identifier$, meta.tag$, meta)
      delete members[meta.identifier$]
      self.emit('remove', meta)
    }


    self.on('error',function(err){
      self.log('ERROR',err)
    })

  })
}
Util.inherits(Sneeze, Events.EventEmitter)

var MultiServer = require('multiserver')
var WS = require('multiserver/plugins/ws')
var SHS = require('multiserver/plugins/shs')
var http = require('http')
var muxrpc = require('muxrpc')
var pull = require('pull-stream')
var blobServer = require('./blob-server')

function toSodiumKeys(keys) {
  return {
    publicKey:
      new Buffer(keys.public.replace('.ed25519',''), 'base64'),
    secretKey:
      new Buffer(keys.private.replace('.ed25519',''), 'base64'),
  }
}

// you need to add manifest items that are allowed below to use them over websockets
var READ_AND_ADD = [
  'get',
  'getLatest',
  'createLogStream',
  'createUserStream',
  'createHistoryStream',
  'getAddress',
  'blobs.add',
  'blobs.size',
  'blobs.has',
  'blobs.get',
  'blobs.changes',
  'blobs.createWants',
  'add',
  'links',
  'query.read',
  'links2.read'
]


exports.name = 'ws'
exports.version = '1.0.0'
exports.manifest = {
  getAddress: 'sync'
}

function toId(id) {
  if (typeof id !== 'string') {
    return '@' + id.toString('base64') + '.ed25519' // isn't this available somewhere else?
  } else throw new Error('toId() called on string. todo: clean this your mess.')
}

exports.init = function (sbot, config) {

  var port
  if(config.ws)
    port = config.ws.port
  if(!port)
    port = 1024+(~~(Math.random()*(65536-1024)))

  var layers = []
  var server = http.createServer(blobServer(sbot, layers)).listen(port)

  function _auth (id, cb) {
    cb(null, {allow: READ_AND_ADD, deny: null})
  }

  var ms = MultiServer([
    [
      WS({server: server, port: port, host: config.host || 'localhost'}),
      SHS({
        keys: toSodiumKeys(config.keys),
        appKey: (config.caps && new Buffer(config.caps.shs, "base64")) || cap,
        auth: function (id, cb) {
          sbot.auth(toId(id), function (err, allowed) {
            if(err || allowed) cb(err, allowed)
            else _auth(id, cb)
          })
        },
        timeout: config.timeout
      })
    ]
  ])

  var close = ms.server(function (stream) {
    var manifest = sbot.getManifest()
    var rpc = muxrpc({}, manifest)(sbot, stream.auth)
    rpc.id = toId(stream.remote)
    pull(stream, rpc.createStream(), stream)
  })

  sbot.close.hook(function (fn, args) {
    close()
    fn.apply(this, args)
  })

  return {
    getAddress: function () {
      return ms.stringify()
    },
    use: function (handler) {
      layers.push(handler)
    }

  }
}



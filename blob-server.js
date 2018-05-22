var Stack = require('stack')
var BlobsHttp = require('multiblob-http')
var Emoji = require('emoji-server')

module.exports = function (sbot, layers) {
  return Stack(
    function (req, res, next) {
      Stack.compose.apply(null, layers)(req, res, next)
    },
    Emoji('/img/emoji'),
    function (req, res, next) {
      if(!(req.method === "GET" || req.method == 'HEAD')) return next()
      var hash = req.url.substring(('/blobs/get/').length)
      sbot.blobs.has(hash, function (err, has) {
        if(has) next()
        else sbot.blobs.want(hash, function (err, has) { next() })
      })
    },
    BlobsHttp(sbot.blobs, '/blobs')
  )
}


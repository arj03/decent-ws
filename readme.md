# decent-ws

This is a fork of `ssb-ws`. There are some key differences that should be noticed:

+ connections are _not_ required to be friends to use websocket auth -- this may change in the future, but right now the decent culture is well, decent
+ the MANIFEST has been modified for use with decent plugins
+ JSONApi is removed
+ CORS is only set once in multiblob-http

Otherwise it's basically the same, but I had to fork because of these modifications.

In the future I want to spend some time getting these changes into the main `ssb-ws` module, but right now I don't have time. If you want to figure out how to support the above changes inthe main `ssb-ws` module, pull-requests requested! -Ev

MIT

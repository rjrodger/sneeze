# sneeze

Easily join SWIM networks. See
http://www.cs.cornell.edu/~asdas/research/dsn02-SWIM.pdf.

This module is used by [seneca-mesh](github.com/rjrodger/seneca-mesh)
to provide zero-configuration service discovery.

## Quick Example

The *base* node serves as the well-known starting point. As other
nodes (A and B) join and leave. All nodes eventually learn about them.

```js
// base.js - start first
var base = require('sneeze')({base:true})
base.join()

// nodeA.js - start next
var nodeA = require('sneeze')()
nodeA.on('add',console.log)
nodeA.on('remove',console.log)
nodeA.join({name: 'A'}) // put any data you like in here

// nodeB.js - start last, then stop nodeA
var nodeB = require('sneeze')()
nodeB.on('add',console.log)
nodeB.on('remove',console.log)
nodeB.join({name: 'B'})
```




## Questions?

[@rjrodger](https://twitter.com/rjrodger)
[![Gitter][gitter-badge]][gitter-url]







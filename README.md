# gerbil-cnc
almost independent grbl driver for node

[docs](https://errantspark.github.io/gerbil-cnc/) | [repo](https://github.com/errantspark/gerbil-cnc/)| [npm](https://www.npmjs.com/package/gerbil-cnc)

I wouldn't use this right now because the API is going to be super duper unstable for the next few weeks at least.

### Basic Usage

Install via npm `npm i gerbil-cnc`, probably won't work with older nodes cause
I tend to use a lot of ES6 type stuff.

```js
import gerbilCnc from 'gerbil-cnc'

let gerbil = gerbilCnc('/dev/ttyACM0')

gerbil.machineReady.then(() => gerbil.writeLine('$I')).then(console.log)
```

```
> [VER:1.1h.20190724:]
  [OPT:VC,15,128]
  ok
```

### Info

`gerbil-cnc` aims to be a fully featured, batteries-included driver for [Grbl](https://github.com/gnea/grbl). 
Once instantiated most of the magic happens in the [`cmds`](https://errantspark.github.io/gerbil-cnc/gerbil.cmds.html) namespace, which provides a high level promise-based api for directly calling many of Grbl's functions; and [`stream`](https://errantspark.github.io/gerbil-cnc/gerbil.stream.html) streaming interface using the Grbl [character counting](https://github.com/gnea/grbl/wiki/Grbl-v1.1-Interface#streaming-protocol-character-counting-recommended-with-reservation) protocol.

Once instantiated `gerbil-cnc` will provide all relevant functions and endpoints regardless of the status of the physical hardware. 
They will simply throw errors if you attempt to use them. 
`gerbil-cnc` will also attempt to reconnect every second by default if the serial link drops. Configurable using the [`autoReconnect`](https://errantspark.github.io/gerbil-cnc/module-gerbil-cnc.html) property in options. 

The functions directly in the instantiated `gerbil` namespace are mostly for internal use but are exported anyway for when you just need to get something done and want to pay the price later. 

Notably we have [`writeRaw`](https://errantspark.github.io/gerbil-cnc/gerbil.html#.writeRaw) and [`onEveryLine`](https://errantspark.github.io/gerbil-cnc/gerbil.html#.writeRaw) which are essentially thin shims over `serialport.write()` and `serialport.on('data', ...)`. You can use these to do whatever the fuck you want, but beware that the higher level api assumes you're not simultaneously using `writeRaw` and if you do it might cause wonky things to happen.


I only test against Grbl 1.1h but most things should be compatible with older versions, and the lower level API will probably work with things that aren't Grbl at all since it's just a thin wrapper over `serialport`

# gerbil-cnc
almost independent grbl driver for node

[docs](https://errantspark.github.io/gerbil-cnc/) | [repo](https://github.com/errantspark/gerbil-cnc/)| [npm](https://www.npmjs.com/package/gerbil-cnc)

### Basic Usage

Install via npm `npm i gerbil-cnc`, probably won't work with older nodes cause
I tend to use a lot of ES6 type stuff.

```js
import gerbilCnc from 'gerbil-cnc'

let gerbil = gerbilCnc('/dev/ttyACM0')

gerbil.onMachineReady = () => gerbil.writeLine('$I').then(console.log)
```

```
> [VER:1.1h.20190724:]
  [OPT:VC,15,128]
  ok
```


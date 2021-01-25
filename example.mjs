import Gerbil from './Gerbil.js'

let gerbil = Gerbil('/dev/ttyACM0')

//setInterval(_=>console.log(gerbil.status()),5000)

gerbil.onMachineReady = v => console.log('connected to GRBL v:'+v)

//setTimeout(_=>gerbil.port.write('?\n'), 3000)
//
gerbil.onEveryLine = l => console.log('> ',l)
setTimeout(() => gerbil.stream.write('g1 z10 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n'),2019)
//setTimeout(() => gerbil.getSettings().then(console.log).catch(console.log),2010)
setTimeout(() => console.log(gerbil.stream.status()),2020)
setTimeout(() => console.log(gerbil.stream.status()),2220)
setTimeout(() => console.log(gerbil.stream.status()),3220)

process.stdin.resume()
process.stdin.on('data',async d => {
  try  {
    let message = d.toString()
    switch (message) {
      case '?\n':
        let status = await gerbil.getStatus()
        console.log(status)
        break
      default:
        let line = await gerbil.writeLine(message)
        console.log('response data:\n'+line)
        break
    }
  } catch (e) {
    console.log(e)
  }
})

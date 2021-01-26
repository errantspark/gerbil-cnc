import gerbilCnc from './main.js'

let gerbil = gerbilCnc('/dev/ttyACM0')

setInterval(_=>console.log(gerbil.machineReady),5000)


//setTimeout(_=>gerbil.port.write('?\n'), 3000)
//
/*
gerbil.onEveryLine = l => console.log('> ',l)
setTimeout(() => gerbil.stream.write('g1 z10 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n'),2019)
//setTimeout(() => gerbil.getSettings().then(console.log).catch(console.log),2010)
setTimeout(() => console.log(gerbil.stream.status()),2020)
setTimeout(() => console.log(gerbil.stream.status()),2220)
setTimeout(() => console.log(gerbil.stream.status()),3220)
*/

gerbil.onMachineReady = s => console.log('connected to GRBL v:'+s.version)

;(async () => {
  let ready = await gerbil.machineReady
  console.log(lole)

})()

process.stdin.resume()
process.stdin.on('data',async d => {
  try  {
    let message = d.toString()
    switch (message) {
      case '?\n':
        let status = await gerbil.machineStatus()
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

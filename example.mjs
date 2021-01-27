import gerbilCnc from './main.js'

let gerbil = gerbilCnc('/dev/ttyACM0')


//gerbil.onEveryLine = l => console.log('> ',l)

//setTimeout(_=>gerbil.port.write('?\n'), 3000)
//
/*
setTimeout(() => gerbil.stream.write('g1 z10 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n'),2019)
//setTimeout(() => gerbil.getSettings().then(console.log).catch(console.log),2010)
setTimeout(() => console.log(gerbil.stream.status()),2020)
setTimeout(() => console.log(gerbil.stream.status()),2220)
setTimeout(() => console.log(gerbil.stream.status()),3220)
*/

gerbil.onMachineReady = s => console.log('connected to GRBL v:'+s.version)

gerbil.machineReady.then(() => gerbil.writeLine('$I')).then(console.log)

;(async () => {
  let inte
  let ready = await gerbil.machineReady
  gerbil.stream.write(`
    g0 z10\ng0 z0\n g1 z10 f100\ng1 z5 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n
    g0 z10\ng0 z0\n g1 z10 f100\ng1 z5 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n
    g0 z10\ng0 z0\n g1 z10 f100\ng1 z5 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n
    g0 z10\ng0 z0\n g1 z10 f100\ng1 z5 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n
    g0 z10\ng0 z0\n g1 z10 f100\ng1 z5 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n
    `)
  console.log('elole',ready)
  let test = {
    '$0': '10',
    '$1': '25',
    '$2': '0',
    '$3': '4',
    '$4': '0',
    '$5': '0',
    '$6': '0',
    '$10': '3',
    '$11': '0.010',
    '$12': '0.002',
    '$132': '23.000'
  }
  inte = setInterval(_=>{
    gerbil.cmds.machineStatus().then(console.log)
    console.log(gerbil.stream.status())
  },1000)

  setTimeout(() => {
    console.log('COKRK!')
    gerbil.stream.cork()
  },16000)
  setTimeout(() => {
    console.log('UNCOKRK!')
    gerbil.stream.cork()
  },36000)

  //let set = await gerbil.cmds.settings().catch(console.log)
  /*
  let gettings = gerbil.cmds.settings(test)
  gerbil.cmds.machineStatus().then(console.log)
  await gettings
  console.log('gettings')
  console.log(set)
  */
})()

process.stdin.resume()
process.stdin.on('data',async d => {
  try  {
    let message = d.toString()
    switch (message) {
      case '?\n':
        let status = await gerbil.cmds.machineStatus()
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

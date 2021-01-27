import gerbilCnc from './main.js'

let gerbil = gerbilCnc('/dev/ttyACM0')



//setTimeout(_=>gerbil.port.write('?\n'), 3000)
//
/*
setTimeout(() => gerbil.stream.write('g1 z10 f1000\ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\ng1 z10 \ng1 z0\n'),2019)
//setTimeout(() => gerbil.getSettings().then(console.log).catch(console.log),2010)
setTimeout(() => console.log(gerbil.stream.status()),2020)
setTimeout(() => console.log(gerbil.stream.status()),2220)
setTimeout(() => console.log(gerbil.stream.status()),3220)
*/

gerbil.machineReady.then(() => gerbil.writeLine('$I')).then(v => console.log('info', v))

;(async () => {
  let ready = await gerbil.machineReady
  
  let testVersion = _=>ready.version=== '1.1h'?'version correct':{error:'incorrect ver'}

  //read and set settings
  let testSettings = async () => {
    try {
      let settings = {
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
      await gerbil.cmds.settings(settings)
      let readback = await gerbil.cmds.settings()
      let success = Object.keys(settings)
        .map(key => settings[key] === readback[key])
        .reduce((a,b) => a&&b)


      if (success) {
        return 'settings set and read successfully'
      } else {
        return {error: 'settings mismatch', data: {readback, settings}}
      }
    } catch (error){
      return {error}
    }

  }
  
  let testCorkUncork = async () => {
    setTimeout(() => {
      console.log('COKRK!')
      gerbil.stream.cork()
    },16000)
    setTimeout(() => {
      console.log('UNCOKRK!')
      gerbil.stream.uncork()
    },36000)
  }


  //let set = await gerbil.cmds.settings().catch(console.log)
  /*
  let gettings = gerbil.cmds.settings(test)
  gerbil.cmds.machineStatus().then(console.log)
  await gettings
  console.log('gettings')
  console.log(set)
  await new Promise(res => setTimeout(res,1))
  console.log('writing line')
  await new Promise(res => setTimeout(res,1))
  gerbil.writeLine('g1 z10 f1000')
  await new Promise(res => setTimeout(res,1))
  gerbil.cmds.machineStatus().then(i => console.log('chin',i))
  await new Promise(res => setTimeout(res,1))
  console.log('feedholding')
  await new Promise(res => setTimeout(res,1))
  gerbil.cmds.feedHold().then(r => console.log('hld',r))
  await new Promise(res => setTimeout(res,1))
  gerbil.cmds.machineStatus().then(i => console.log('innerstatus',i))
//setTimeout(() => gerbil.cmds.machineStatus().then(console.log), 100)
  setTimeout(() => gerbil.cmds.resume().then(r =>console.log('rsm',r)), 1000)
  setTimeout(() => gerbil.cmds.softReset().then(r =>console.log('rst',r)), 1100)
  setTimeout(() => gerbil.cmds.machineStatus().then(console.log), 1300)
  */
let tests = {testSettings,testVersion}

await Promise.all(
  Object.entries(tests).map(async ([key,value])=>{
    let outcome = await tests[key]()
    let log = outcome.error?
      `FAILURE\n${outcome.error}\n${JSON.stringify(outcome.data,null,2)}`:
      `SUCCESS\n${outcome}`
    return `${key}\n${log}`
  })
).then(array => array.map(v=>console.log(v+'\n')))

  gerbil.onEveryLine = l => console.log('> ',l)
})()

process.stdin.resume()
process.stdin.on('data',async d => {
  try  {
    let message = d.toString()
    switch (message) {
      case '??\n':
        let status = await gerbil.cmds.machineStatus()
        console.log(gerbil.stream.status())
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

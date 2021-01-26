import SerialPort from 'serialport'
import {Writable} from 'stream'
import errors from './errors.js'

const emptyPromise = () => {
  let res
  let promise = new Promise(_res => (res = _res))
  promise.resolve = (...args) => (res(args), promise.done = true)
  return promise
}

/** @namespace gerbil */

/**
 * this is the gerbil module
 * @module gerbil-cnc
 * @function
 * @arg {string} ttyPath path to serial port
 * @arg {object} options currently unused
 * @arg {boolean} options.autoReconnect
 * ```
 * {autoReconnect: false}
 * ```
 * @exports module:gerbil-cnc
 * @returns {gerbil} 
 * @public
 */
let main = (ttyPath, options) => {

  let retry, port, parser

  let status = {
    connected: false
  }

  let handleDisconnect = () => {
    status = {connected: false}
    if (gerbil.machineReady.done) gerbil.machineReady = emptyPromise()
  }

  /**
   * Write raw data to GRBL, can be a buffer or a string and is not validated
   * in any way. This is for internal use and probably shouldn't be used 
   * externally unless you're just using this and {@link gerbil.onEveryLine}
   * 
   * @arg {string|buffer} data
   * @memberOf gerbil
   * @return {void} 
   */
  let writeRaw = data => {
    if (!(status.connected && status.version)) throw new Error('machine disconnected')
    port.write(data)
  }
``
  /**
   * A promise returning the current machine status, uses GRBL's `?` command
   * under the hood. Not all parameters are guaranteed to be present.
   *
   * @memberOf gerbil
   * @return {promise(object)} current machine status as object
   * ```js
   * {
   *    Buffer: {planner:15, rx: 128}
   * }
   * ```
   *
   */
  let machineStatus = () => new Promise (res => {
    writeRaw('?')
    let parseStatus = line => 
      res(
        Object.fromEntries(
          line.trim()
          .slice(1,-1) //remove surrounding <>
          .split('|')
          .map((s,i) => {
            if (i === 0) return ['Status', s]
            let [key, value = true] = s.split(':')
            let values = value?.split?.(',').map(n => parseFloat(n)) || true
            if (values?.length === 1) values = value
            if (key === 'Bf') {
              key = 'Buffer'
              let [planner, rx] = values
              values = {
                planner,
                rx
              }
            }
            if (key === 'FS') {
              key = 'Speeds'
              let [feed, spindle] = values
              values = {
                feed,
                spindle
              }
            }
            if (key === 'F') {
              key = 'Speeds'
              let [feed] = values
              values = {feed}
            }
            if (key === 'MPos' || key === 'WPos') {
              let [x,y,z] = values
              values = {x,y,z}
            }
            return [key, values]
          }))
      )
    router.next('status', parseStatus)
  })

  /**
   * Returns GRBL machine settings as an object.
   *
   * @memberOf gerbil
   * @return {promise(object)} 
   * ```js
   * {
   *   '$0': '10',
   *   '$1': '25',
   *   '$2': '0',
   *   '$3': '4',
   *   '$4': '0',
   *   ...
   * }
   * ```
   *
   */
  let getSettings = () => new Promise (res => {
    writeRaw('$$\n')
    let settings = {}
    let getSettings = (setting, unbind) => {
      let [key, value] = setting.split('=')
      settings[key] = value.trim()
      if (setting.slice(0,4) === '$132') {
        unbind()
        res(settings)
      }
    }
    router.every('setting',getSettings)
  })

  /**
   * write a single line to GRBL, this will throw if you try to use it to send
   * multiple lines, or a line longer than 128 bytes, returns a Promise that
   * resolves to be either a string containing any output GRBL sent between invocation
   * and the first `ok` (inclusive)
   *
   * ```
   * writeLine('$I').then(console.log)
   *
   * > [VER:1.1h.20190724:]
   *   [OPT:VC,15,128]
   *   ok
   * ```
   * or an error object looking something like this:
   * ```js
   * {
   *   error: "error:2"
   *   message: "Numeric value format is not valid or missing an expected value."
   * }
   * ```
   *
   * @arg {string} message a line to send to GRBL
   * @memberOf gerbil
   * @return {Promise(string)|Promise(errorObj)} GRBL data until `ok`
   */
  let writeLine = message => new Promise (res => {
    if (message.split('\n').filter(a=>a).length > 1) 
      throw new Error('writeLine interface is only meant for single-line messages')
    if (message.length > 127) 
      throw new Error(`message larger than GRBL buffer (128btyes), ignored\nmsg: ${message}`)
    let data = ''
    let unbindGather = router.every('any', val => data += val+'\n')
    let finalize = ok => {
      unbindGather()
      if (ok === 'ok') {
        res(data)
      } else {
        res({error: ok, message: errors[ok]})
      }
    }
    router.next('ok', finalize)
    router.next('error', finalize)
    writeRaw(message)
  })

  let stream = (() => {
    const PLANNER = 14 //something is dumb, this should be 15
    const RX = 126 //126 because i always want to have space for a ?
    //this may not be necessary? not sure if ? goes into the buffer
    let streaming = false
    let currentRx = [] 
    let currentPlan = 0
    let buffer = []
    let onData = (data,unbind) => {
        currentRx.shift()
        currentPlan--
        processBuffer()
        if (currentPlan === 0) {
          unbind()
          streaming = false
        }
    }

    let toSend = ''

    let processBuffer = () => {
      while (
        buffer.length > 0 && 
        (currentPlan+1 < PLANNER) && 
        (currentRx.reduce((a,b)=>a+b,0)+buffer[0].length < RX)
      ) {
        let command = buffer.shift()
        currentPlan += 1 
        currentRx.push(command.length)
        toSend += command+'\n'
      }
      if (toSend) {
        writeRaw(toSend)
        toSend = ''
      }
    }

    let write = async string => {
      if (!streaming) {
        streaming = true
        router.every('ok', onData)
      }
      let commands = string.split('\n').map(s => s.trim()).filter(a=>a)
      commands.forEach(command => buffer.push(command))
      processBuffer()
    }

    let cancel = () => {
      buffer = []
    }

    let status = () => {
      return {
        buffer: buffer.map(v=>v),
        buffered: buffer.length,
        rxBuffered: currentRx.reduce((a,b)=>a+b,0),
        planned: currentPlan,
        streaming
      }
    }
    return {write, status, cancel}
  })()


  let router = (() => {
    let listeners = {
      any: new Set(),
      version: new Set(),
      ok: new Set(),
      status: new Set(),
      setting: new Set(),
      error: new Set(),
    }

    let lineType = line => {
      if (line.length === 0) return 'empty'
      if (line === 'ok') return 'ok'
      if (line[0] === '<') return 'status'
      if (line.match('Grbl')) return 'version'
      if (line.match(/^\$\d+=/)) return 'setting'
      if (errors[line]) return 'error'
      return 'unknown'
    }

    let buffer = Buffer.alloc(0)
    let input = new Writable({
      write: (chunk, encoding, callback) => {
        let data = Buffer.concat([buffer, chunk])
        let position
        while ((position = data.indexOf('\n')) !== -1) {
          let line = data.slice(0,position-1).toString()
          let type = lineType(line)
          gerbil.onEveryLine?.(line)
          listeners.any?.forEach(fn => fn(line))
          listeners[type]?.forEach(fn => fn(line))
          data = data.slice(position+1)
        }
        buffer = data
        callback()
      },
    })

    let every = (type, func)  => {
      if (!listeners[type]) throw new Error(`event type: "${type}" is unsupported`)
      let bindUnbind = v => func(v, () => listeners[type].delete(bindUnbind))
      listeners[type].add(bindUnbind)
      return () => listeners[type].delete(bindUnbind)
    }

    let next = (type, func)  => {
      if (!listeners[type]) throw new Error(`event type: "${type}" is unsupported`)
      let unbindOnRun = value => (func(value), listeners[type].delete(unbindOnRun))
      listeners[type].add(unbindOnRun)
      return () => listeners[type].delete(unbindOnRun)
    }

    return {
      every,
      next,
      input
    }
  })()

  router.every('error', error => console.error(error+'\n'+errors[error]))

  router.every('version', line => {
    status.version = line.match(/ [\d,\.]+\w+ /gim)?.[0].trim()
    gerbil.onMachineReady?.(status)
    gerbil.machineReady?.resolve(status)
  })


  let connect = ttyPath => new Promise(res =>  {
    port = new SerialPort(ttyPath, { baudRate: 115200 }, e => {
      if (e) {
        handleDisconnect()
        retry = setTimeout(() => {
          connect(ttyPath)
        }, 1000)
      } else {
        status.connected = true
        status.tty = ttyPath
        port.on('close', _ => (handleDisconnect(), connect(ttyPath)))
        port.pipe(router.input)
      }
    })
  })

  /*
  let disconnect = () => new Promise(res => {
    clearTimeout(retry)
    port.cose(res)
  })
  */

  connect(ttyPath)

  let gerbil = {
    /**
     * A promise that resolves when the machine is ready, works similarly to
     * {@link gerbil.onMachineReady}.
     * @type {Promise}
     * 
     * @example 
     * let ready = await gerbil.machineReady
     * console.log(ready)
     * > {connected: true, version: '1.1h', ttyPath: '/dev/ttyACM0'}
     *
     * @memberOf gerbil
     */
    machineReady: emptyPromise(),
    /**
     * Set callback to execute when GRBL trasmits it's version string. This 
     * happens on initial connection or reset. The callback is passed the status
     * object.
     * 
     * @example 
     * gerbil.onMachineReady = console.log
     * > {connected: true, version: '1.1h', ttyPath: '/dev/ttyACM0'}
     *
     * @memberOf gerbil
     */
    onMachineReady:undefined,
    getSettings,
    /**
     * Set callback to execute on every line received from the serialport.
     * This is called with the non-delimited string each time GRBL spits out a
     * new line.
     *
     * @example 
     * gerbil.onEveryLine = console.log
     * > ok
     * > ok
     *
     * @memberOf gerbil
     */
    onEveryLine:undefined,
    writeLine,
    writeRaw,
    machineStatus,
    stream,
    /**
     * @memberOf gerbil
     * @returns {object} immediately returns the inner status object
     * ```js
     * {
     *   connected: true, //always present, true if serialport link established
     *   ttyPort: '/dev/ttyACM0', //present if link established
     *   version: '1.1h', //GRBL version, present once initial handshake received
     * }
     * ```
     */
    driverStatus : () => ({status})
  }

  return gerbil
}

export default main

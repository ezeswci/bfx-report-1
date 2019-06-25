'use strict'

const uuid = require('uuid')
const { omit } = require('lodash')
const { PeerRPCServer } = require('grenache-nodejs-ws')

const { FindMethodError } = require('../errors')
const WSEventEmitter = require('./ws.event.emitter')

class WSTransport {
  constructor ({
    grc_bfx: grcBfx,
    group,
    conf = {}
  } = {}) {
    const { wsPort } = { ...conf[group] }

    this.wsPort = wsPort
    this.link = grcBfx.link
    this.rService = grcBfx.api
    this.opts = { ...grcBfx.opts }

    this._active = false
    this._sockets = new Map()
    this._auth = new Map()
  }

  _initPeer () {
    this.peer = new PeerRPCServer(this.link, {})

    this.peer.init()
  }

  _initTransport () {
    this.transport = this.peer.transport('server')

    this.transport.listen(this.wsPort)
  }

  _announceOne (
    key,
    resolve = () => {},
    reject = () => {}
  ) {
    this.link.announce(key, this.transport.port, {}, (err) => {
      if (err) {
        reject(err)

        console.error(err)
      }

      resolve()
    })
  }

  _announce () {
    const {
      services = [],
      tickInterval = 45000
    } = { ...this.opts }

    return services.reduce(async (accum, srv) => {
      await accum

      return new Promise((resolve, reject) => {
        const key = `${srv}:ws`

        this._announceItv = setInterval(() => {
          this._announceOne(key)
        }, tickInterval)

        this._announceOne(key, resolve, reject)
      })
    }, Promise.resolve())
  }

  _initRPC () {
    this.transport.on('request', (rid, key, payload, { reply }) => {
      const _payload = { ...payload }
      const { method = '' } = _payload
      const args = omit(_payload, ['method'])

      if (method === 'login') {
        return
      }
      if (
        typeof this.rService[method] !== 'function' ||
        /^_/.test(method)
      ) {
        reply(new FindMethodError())

        return
      }

      const fn = this.rService[method].bind(this.rService)

      fn(null, args, reply)
    })
  }

  _listen () {
    this.transport.socket.on('connection', socket => {
      this._active = true

      const sid = socket._grc_id = uuid.v4()

      this._sockets.set(sid, socket)

      socket.on('close', () => {
        this._auth.delete(sid)
        this._sockets.delete(sid)
      })
      socket.on('message', async (strData) => {
        const data = this.transport.parse(strData)

        if (!Array.isArray(data)) {
          this.transport.emit('request-error')

          return
        }

        const rid = data[0]
        const payload = data[2]

        try {
          if (
            !payload ||
            typeof payload !== 'object' ||
            payload.method !== 'login' ||
            !payload.auth ||
            typeof payload.auth !== 'object'
          ) {
            return
          }

          const user = await this.rService.login(
            null,
            { auth: payload.auth },
            null,
            true
          )

          this._auth.set(sid, user)
          this.transport.sendReply(socket, rid, null, user.email)
        } catch (err) {
          this.transport.sendReply(socket, rid, err)
        }
      })
    })

    this.transport.socket.on('close', () => {
      this._active = false
    })
  }

  _getFreshUsersDataFromDb () {
    const apiKey = [...this._auth].map(([sid, user]) => user.apiKey)

    return this.rService.dao.getElemsInCollBy(
      'users',
      {
        $or: { apiKey }
      }
    )
  }

  _findUser (auth = {}, freshUsersDate = []) {
    const freshData = freshUsersDate.find(({ apiKey, apiSecret }) => (
      auth.apiKey === apiKey &&
      auth.apiSecret === apiSecret
    ))

    return {
      ...auth,
      ...freshData
    }
  }

  _isActiveUser (user) {
    return (
      user &&
      typeof user === 'object' &&
      user.active
    )
  }

  _sendToOne (socket, sid, action, err, result = null) {
    const res = this.transport.format(
      [sid, err ? err.message : null, { action, result }]
    )

    socket.send(res)
  }

  async send (
    handler,
    action,
    args = {},
    opts = {}
  ) {
    if (
      !this._active ||
      this._auth.size === 0
    ) {
      return false
    }

    const {
      isReceivedFreshUserDataFromDb = false,
      isEmittedToActiveUsers = false
    } = { ...opts }

    const freshUsersDate = isReceivedFreshUserDataFromDb
      ? await this._getFreshUsersDataFromDb()
      : false

    for (const [sid, socket] of this._sockets) {
      if (!this._auth.has(sid)) {
        continue
      }

      const auth = this._auth.get(sid)
      const user = isReceivedFreshUserDataFromDb
        ? this._findUser(auth, freshUsersDate)
        : auth

      try {
        if (
          (
            typeof handler !== 'function' &&
            handler === null
          ) ||
          (
            isEmittedToActiveUsers &&
            !this._isActiveUser(user)
          )
        ) {
          continue
        }

        const res = typeof handler === 'function'
          ? await handler(user, { ...args, action })
          : handler

        this._sendToOne(socket, sid, action, null, res)
      } catch (err) {
        this._sendToOne(socket, sid, action, err)
      }
    }

    return true
  }

  sendToActiveUsers (
    handler,
    action,
    args = {}
  ) {
    return this.send(
      handler,
      action,
      args,
      {
        isReceivedFreshUserDataFromDb: true,
        isEmittedToActiveUsers: true
      }
    )
  }

  getAuth () {
    return this._auth
  }

  async start () {
    this._initPeer()
    this._initTransport()
    this._listen()
    await this._announce()

    WSEventEmitter.inject({
      wsTransport: this,
      rService: this.rService,
      dao: this.rService.dao
    })

    this._initRPC()
  }

  stop (cb) {
    clearInterval(this._announceItv)

    this.peer.stop()
    this.transport.stop()

    cb()
  }
}

module.exports = WSTransport
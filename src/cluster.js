import cluster from 'cluster'
import os from 'os'
import * as bail from 'baileys'

let wrks = []
let rrIdx = 0

export function isMaster() {
  return cluster.isPrimary
}

export function isWorker() {
  return !cluster.isPrimary
}

export function initPrimary(count) {
  const n = count || os.cpus().length
  for (let i = 0; i < n; i++) wrks.push(cluster.fork())
  cluster.on('exit', (w) => {
    wrks = wrks.filter(x => x.id !== w.id)
    wrks.push(cluster.fork())
  })
}

export function sendToWorker(data) {
  if (!wrks.length) return
  const w = wrks[rrIdx % wrks.length]
  rrIdx++
  w.send(data)
}

export function sendToPrimary(data) {
  process.send?.(data)
}

export function onPrimaryMsg(cb) {
  process.on('message', (msg) => cb(msg))
}

// Worker proxy

const pendingIpc = {}
let ipcListenerActive = false

function ensureIpcListener() {
  if (ipcListenerActive) return
  ipcListenerActive = true
  process.on('message', (msg) => {
    if (msg.type === '_ipc-resp') {
      const p = pendingIpc[msg._ipcId]
      if (p) {
        clearTimeout(p.timer)
        if (msg.error) p.reject(new Error(msg.error))
        else p.resolve(msg.data)
        delete pendingIpc[msg._ipcId]
      }
    }
  })
}

function ipcCall(name, ...args) {
  return new Promise((resolve, reject) => {
    const _ipcId = Math.random().toString(36).slice(2) + Date.now()
    const timer = setTimeout(() => reject(new Error(name + ' timeout')), 30000)
    pendingIpc[_ipcId] = { resolve, reject, timer }
    sendToPrimary({ type: '_ipc-call', name, args, _ipcId })
  })
}

function ipcVoid(name, ...args) {
  sendToPrimary({ type: '_ipc-call', name, args })
}

const LOCAL_SOCK_KEYS = new Set([
  '_pending', 'user', 'chats', 'decodeJid', 'getJid', 'captureUnifiedResponse'
])

export function createProxySock(initData) {
  ensureIpcListener()
  const target = {
    _pending: pendingIpc,
    user: initData.user,
    chats: initData.chats || {},
    decodeJid(jid) {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        const d = bail.jidDecode(jid)
        return d?.user && d?.server ? d.user + '@' + d.server : jid
      }
      return jid
    },
    getJid(jid) {
      if (!jid) return jid
      if (jid.endsWith('@lid')) {
        for (const chat of Object.values(target.chats)) {
          if (!chat?.participants) continue
          const u = chat.participants.find(p => p.lid === jid || p.id === jid)
          if (u) return u.phoneNumber || u.id
        }
      }
      return jid
    },
    captureUnifiedResponse(msg) { return bail.captureUnifiedResponse?.(msg) }
  }
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t || LOCAL_SOCK_KEYS.has(prop)) return t[prop]
      return (...args) => ipcCall(prop, ...args)
    },
    set(t, prop, val) { t[prop] = val; return true }
  })
}

export function updateProxySock(proxy, data) {
  if (proxy) {
    proxy.user = data.user
    proxy.chats = data.chats || {}
  }
}

// Primary IPC

let primarySockRef = null
let primaryIpcSetup = false

const VOID_METHODS = new Set([
  'sendMessage', 'relayMessage',
  'groupSettingUpdate', 'groupUpdateDescription', 'groupUpdateSubject',
  'groupLeave', 'groupJoinApprovalMode', 'groupMemberAddMode',
  'updateMemberLabel', 'sendPeerDataOperationMessage',
  'newsletterFollow', 'newsletterUnfollow', 'newsletterMute', 'newsletterUnmute',
  'newsletterUpdateName', 'newsletterUpdateDescription',
  'newsletterUpdatePicture', 'newsletterRemovePicture',
  'newsletterReactMessage', 'newsletterChangeOwner', 'newsletterDemote',
  'newsletterDelete',
  'communityLeave', 'communityUpdateSubject',
  'communityLinkGroup', 'communityUnlinkGroup',
  'communityUpdateDescription'
])

export function setupPrimaryIpc(sock) {
  primarySockRef = sock

  if (!primaryIpcSetup) {
    primaryIpcSetup = true
    cluster.on('message', (worker, msg) => {
      const s = primarySockRef
      if (!s) return

      if (msg.type === '_ipc-call') {
        const { name, args, _ipcId } = msg
        const fn = s[name]
        if (typeof fn !== 'function') {
          if (_ipcId) worker.send({ type: '_ipc-resp', _ipcId, error: name + ' is not a function' })
          return
        }

        const result = fn.apply(s, args || [])
        if (_ipcId) {
          Promise.resolve(result).then(data => {
            worker.send({ type: '_ipc-resp', _ipcId, data })
          }).catch(err => {
            worker.send({ type: '_ipc-resp', _ipcId, error: err.message })
          })
        }
      }
    })

    setTimeout(() => {
      const s = primarySockRef
      if (s) {
        const data = { user: s.user, chats: s.chats }
        for (const w of wrks) w.send({ type: '_init', data })
      }
    }, 1000)
  } else {
    const data = { user: sock.user, chats: sock.chats }
    for (const w of wrks) w.send({ type: '_init', data })
  }
}

export function syncChatsToWorkers(user, chats) {
  const data = { user, chats }
  for (const w of wrks) w.send({ type: '_init', data })
}

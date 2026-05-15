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
    if (msg.type === 'groupMetadata-resp') {
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

export function createProxySock(initData) {
  ensureIpcListener()
  const sock = {
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
        for (const chat of Object.values(sock.chats)) {
          if (!chat?.participants) continue
          const u = chat.participants.find(p => p.lid === jid || p.id === jid)
          if (u) return u.phoneNumber || u.id
        }
      }
      return jid
    },
    sendMessage(jid, content, options) {
      sendToPrimary({ type: 'sendMessage', jid, content, options })
    },
    relayMessage(jid, message, opts) {
      sendToPrimary({ type: 'relayMessage', jid, message, options: opts || {} })
    },
    groupMetadata(jid) {
      return new Promise((resolve, reject) => {
        const _ipcId = Math.random().toString(36).slice(2) + Date.now()
        const timer = setTimeout(() => reject(new Error('groupMetadata timeout')), 15000)
        sock._pending[_ipcId] = { resolve, reject, timer }
        sendToPrimary({ type: 'groupMetadata', jid, _ipcId })
      })
    }
  }
  return sock
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

export function setupPrimaryIpc(sock) {
  primarySockRef = sock

  if (!primaryIpcSetup) {
    primaryIpcSetup = true
    cluster.on('message', (worker, msg) => {
      const s = primarySockRef
      if (!s) return
      if (msg.type === 'sendMessage') {
        s.sendMessage(msg.jid, msg.content, msg.options || {}).catch(() => {})
      } else if (msg.type === 'relayMessage') {
        s.relayMessage(msg.jid, msg.message, msg.options || {}).catch(() => {})
      } else if (msg.type === 'groupMetadata') {
        s.groupMetadata(msg.jid).then(r => {
          worker.send({ type: 'groupMetadata-resp', _ipcId: msg._ipcId, data: r })
        }).catch(e => {
          worker.send({ type: 'groupMetadata-resp', _ipcId: msg._ipcId, error: e.message })
        })
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

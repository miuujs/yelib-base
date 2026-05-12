import * as bail from 'baileys'

const groupMetaCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function getCached(jid) {
  const entry = groupMetaCache.get(jid)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return undefined
}

function setCached(jid, data) {
  groupMetaCache.set(jid, { data, ts: Date.now() })
}

export async function clientsConfig(opts) {
  const clients = bail.makeWASocket({
    ...opts,
    cachedGroupMetadata: getCached
  })

  clients.chats = {}

  clients.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = bail.jidDecode(jid) || {}
      return decode.user && decode.server ? decode.user + '@' + decode.server : jid
    }
    return jid
  }

  clients.getJid = (jid) => {
    if (!jid) return jid
    if (!jid.endsWith('@lid')) return jid
    for (const chat of Object.values(clients.chats)) {
      if (!chat?.participants) continue
      const user = chat.participants.find(p => p.lid === jid || p.id === jid)
      if (user) return user.phoneNumber || user.id
    }
    return jid
  }

  clients.ev.on('group-participants.update', async ({ id }) => {
    if (!id || id === 'status@broadcast') return
    try {
      const data = await clients.groupMetadata(id)
      setCached(id, data)
      clients.chats[id] = data
      await new Promise(r => setTimeout(r, 500))
    } catch {}
  })

  clients.ev.on('groups.update', async (updates) => {
    for (const u of updates) {
      if (!u.id || u.id === 'status@broadcast' || !u.id.endsWith('@g.us')) continue
      try {
        const data = await clients.groupMetadata(u.id)
        setCached(u.id, data)
        clients.chats[u.id] = data
        await new Promise(r => setTimeout(r, 500))
      } catch {}
    }
  })

  Object.defineProperty(clients, 'name', { value: 'WASocket', configurable: true })
  return clients
}

export async function smsg(clients, m) {
  if (!m) return m
  const M = bail.proto.WebMessageInfo

  if (m.key) {
    m.id = m.key.id
    m.from = m.key.remoteJid.startsWith('status')
      ? bail.jidNormalizedUser(m.key?.participant || m.participant)
      : bail.jidNormalizedUser(m.key.remoteJid)
    m.isBaileys = m.id?.startsWith('3EB0')
    m.chat = clients?.getJid(m.key?.remoteJidAlt?.endsWith('@s.whatsapp.net')
      ? m.key.remoteJidAlt
      : m.key?.remoteJid)
    m.owner = clients.getJid(bail.jidNormalizedUser(global.owner.numbers[0] + '@s.whatsapp.net'))
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat?.endsWith('@g.us')
    m.sender = clients.getJid(bail.jidNormalizedUser(
      m.key.participantAlt || m.key.participantPn || m.key.participant || m.chat
    ))
    m.pushName = m.pushName || m.verifiedName || ''
  }

  if (m.message) {
    const cht = clients.chats[m.key.remoteJid] || {}
    const parti = (cht?.participants || []).reduce((acc, p) => { acc[p.id] = p.phoneNumber; return acc }, {})

    m.mtype = bail.getContentType(m.message)
    m.msg = m.mtype === 'viewOnceMessage'
      ? m.message[m.mtype].message[bail.getContentType(m.message[m.mtype].message)]
      : m.message[m.mtype]

    m.body = m.message.conversation || m.msg?.text || m.msg?.caption || ''

    m.mentionedJid = m.isGroup
      ? (m.msg?.contextInfo?.mentionedJid || []).map(id => parti[id] || id).filter(Boolean)
      : []

    const quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null

    if (m.quoted) {
      let type = bail.getContentType(quoted)
      m.quoted = m.quoted[type]
      if (['productMessage'].includes(type)) {
        type = bail.getContentType(m.quoted)
        m.quoted = m.quoted[type]
      }
      if (typeof m.quoted === 'string') m.quoted = { text: m.quoted }

      if (m && m.quoted) {
        m.quoted.key = {
          remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
          participant: bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
          fromMe: bail.areJidsSameUser(
            bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
            bail.jidNormalizedUser(clients?.user?.id)
          ),
          id: m.msg?.contextInfo?.stanzaId
        }
        m.quoted.mtype = type
        if (m.quoted.key) {
          m.quoted.from = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid)
            ? m.quoted.key.participant
            : m.quoted.key.remoteJid
          m.quoted.id = m.msg?.contextInfo?.stanzaId
          m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat
          if (m.quoted.id) m.quoted.isBaileys = m.quoted.id.startsWith('3EB0')
          m.quoted.sender = clients.decodeJid(m.msg?.contextInfo?.participant)
          m.quoted.fromMe = m.quoted.sender === clients.user?.id
          m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation
            || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
          m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || []
          m.quoted.fakeObj = M.fromObject({
            key: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id },
            message: quoted,
            ...(m.isGroup ? { participant: m.quoted.sender } : {})
          })
          m.quoted.download = () => downloadMediaMessage(m.quoted)
        }
      }
    }
  }

  m.reply = async (text, options = {}) => {
    const { adReply } = await import('./reply.js')
    return adReply(clients, m, text, options)
  }

  m.copy = () => smsg(clients, M.fromObject(M.toObject(m)))
  m.react = (emoji, key = m.key) => clients.sendMessage(m.chat, { react: { text: emoji, key } })

  return m
}

export async function downloadMediaMessage(message) {
  const mime = (message.msg || message).mimetype || ''
  const messageType = message.mtype
    ? message.mtype.replace(/Message/gi, '')
    : mime.split('/')[0]
  const stream = await bail.downloadContentFromMessage(message, messageType)
  const buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

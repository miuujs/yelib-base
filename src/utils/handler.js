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

const MEDIA_TYPES = {
  imageMessage: 'image',
  videoMessage: 'video',
  audioMessage: 'audio',
  documentMessage: 'document',
  stickerMessage: 'sticker',
  ptvMessage: 'ptv',
  productMessage: 'product'
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

function extractText(msg, mtype) {
  if (!msg) return ''
  if (mtype === 'conversation') return msg.conversation || ''
  if (msg.text) return msg.text
  if (msg.caption) return msg.caption
  if (msg.contentText) return msg.contentText
  if (msg.hydratedContentText) return msg.hydratedContentText
  if (msg.selectedDisplayText) return msg.selectedDisplayText
  if (msg.title) return msg.title
  if (msg.description) return msg.description
  if (msg.name) return msg.name
  return ''
}

function getMediaType(mtype) {
  return MEDIA_TYPES[mtype] || (mtype ? mtype.replace('Message', '').toLowerCase() : '')
}

function isDownloadable(mtype) {
  return !!MEDIA_TYPES[mtype] || mtype === 'videoMessage'
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

    if (m.isGroup) {
      const cht = clients.chats[m.key.remoteJid] || {}
      const participant = (cht?.participants || []).find(p => {
        const pid = p.id || p.lid || ''
        return pid.includes(m.sender?.split('@')[0]) || pid === m.sender
      })
      m.isAdmin = !!(participant?.admin)
      m.isSuperAdmin = participant?.admin === 'superadmin'
    } else {
      m.isAdmin = false
      m.isSuperAdmin = false
    }
  }

  if (m.message) {
    const normalized = bail.normalizeMessageContent(m.message)
    const cht = clients.chats[m.key.remoteJid] || {}
    const parti = (cht?.participants || []).reduce((acc, p) => { acc[p.id] = p.phoneNumber; return acc }, {})

    m.mtype = bail.getContentType(normalized)
    m.msg = normalized?.[m.mtype] || null
    m.mediaType = m.mtype ? getMediaType(m.mtype) : ''
    m.isMedia = !!m.mediaType && isDownloadable(m.mtype)
    m.body = extractText(m.message, bail.getContentType(m.message)) || extractText(normalized, m.mtype) || ''
    m.mentionedJid = m.isGroup
      ? (m.msg?.contextInfo?.mentionedJid || []).map(id => parti[id] || id).filter(Boolean)
      : []

    const quotedMsg = m.msg?.contextInfo?.quotedMessage || null
    if (quotedMsg) {
      const qNorm = bail.normalizeMessageContent(quotedMsg)
      const qType = bail.getContentType(qNorm)
      const qData = qNorm?.[qType] || null

      m.quoted = {
        key: {
          remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
          participant: bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
          fromMe: bail.areJidsSameUser(
            bail.jidNormalizedUser(m.msg?.contextInfo?.participant),
            bail.jidNormalizedUser(clients?.user?.id)
          ),
          id: m.msg?.contextInfo?.stanzaId
        },
        mtype: qType,
        msg: qData,
        mediaType: getMediaType(qType),
        isMedia: !!MEDIA_TYPES[qType],
        text: extractText(qNorm, qType),
        sender: clients.decodeJid(m.msg?.contextInfo?.participant),
        fromMe: clients.decodeJid(m.msg?.contextInfo?.participant) === clients.user?.id,
        from: /g\.us|status/.test(m.msg?.contextInfo?.remoteJid)
          ? bail.jidNormalizedUser(m.msg?.contextInfo?.participant)
          : (m.msg?.contextInfo?.remoteJid || m.from),
        chat: m.msg?.contextInfo?.remoteJid || m.chat,
        id: m.msg?.contextInfo?.stanzaId,
        mentionedJid: m.msg?.contextInfo?.mentionedJid || [],
        isBaileys: m.msg?.contextInfo?.stanzaId?.startsWith('3EB0'),
        download: () => downloadMediaMessage(qNorm)
      }
      m.quoted.fakeObj = M.fromObject({
        key: { remoteJid: m.quoted.chat, fromMe: m.quoted.fromMe, id: m.quoted.id },
        message: quotedMsg,
        ...(m.isGroup ? { participant: m.quoted.sender } : {})
      })
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
  const norm = bail.normalizeMessageContent(message?.message || message)
  const mtype = bail.getContentType(norm)
  const data = mtype ? norm?.[mtype] : norm
  if (!data?.directPath) return null

  let mediaType = MEDIA_TYPES[mtype]
  if (!mediaType) {
    if (data?.gifPlayback) mediaType = 'gif'
    else if (data?.ptt) mediaType = 'ptt'
    else if (mtype === 'audioMessage') mediaType = 'audio'
    else if (mtype === 'videoMessage') mediaType = 'video'
    else mediaType = mtype?.replace('Message', '').toLowerCase() || 'image'
  }
  if (data?.thumbnailDirectPath && !data?.url) mediaType = 'thumbnail-link'

  const stream = await bail.downloadContentFromMessage(data, mediaType)
  const buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

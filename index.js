import './src/config.js'
import pino from 'pino'
import * as bail from 'baileys'
import logger from './src/utils/logger.js'
import { clientsConfig, smsg } from './src/utils/handler.js'
import caseHandler from './src/case.js'

async function start() {
  const { state, saveCreds } = await bail.useMultiFileAuthState(pair.sesi)

  global.clients = await clientsConfig({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !pair.isPair,
    browser: ['Linux', 'Chrome', ''],
    auth: {
      creds: state.creds,
      keys: bail.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: (jid) => jid.endsWith('@newsletter') || jid.includes('broadcast')
  })

  if (pair.isPair && !clients.authState.creds.registered) {
    const phone = pair.no.replace(/[^0-9]/g, '')
    await bail.delay(3000)
    let code = await clients.requestPairingCode(phone, 'AAAAAAAA')
    code = code?.match(/.{1,4}/g)?.join('-') || code
    logger.info('Pairing code:', code)
  }

  clients.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0]
      if (!mek.message) return
      global.m = await smsg(clients, mek)
      if (set.self && ![m.owner, clients.decodeJid(clients.user.id)].includes(m.sender)) return
      await caseHandler(clients, m)
      logger.print(m)
    } catch (err) {
      console.error(err)
    }
  })

  clients.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      logger.warn('Connection closed:', reason)
      if (reason !== bail.DisconnectReason.loggedOut) {
        logger.info('Restarting in 5 seconds...')
        setTimeout(start, 5000)
      } else {
        logger.error('Logged out. Please delete session and restart.')
      }
    } else if (connection === 'open') {
      logger.info('Connected to WhatsApp')
      const groups = (await clients.groupFetchAllParticipating().catch(() => ({}))) || {}
      for (const id in groups) clients.chats[id] = groups[id]
    } else if (connection === 'connecting') {
      logger.info('Connecting...')
    }
  })

  clients.ev.on('creds.update', saveCreds)

  setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024
    if (mem > 250) {
      logger.warn(`Memory usage ${mem.toFixed(0)}MB, restarting...`)
      process.exit(1)
    }
  }, 60000)
}

start()

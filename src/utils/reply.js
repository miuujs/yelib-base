import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const menuPath = join(__dirname, '../../media/menu.jpg')

export let menuBuffer = null
try {
  if (existsSync(menuPath)) {
    menuBuffer = readFileSync(menuPath)
  }
} catch {}

export function clockString(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export async function adReply(sock, m, text, chat) {
  try {
    const bodyText = 'Runtime: ' + clockString(Date.now() - global.start)
    const target = chat || m.chat

    const msg = { text }
    msg.contextInfo = {
      mentionedJid: [m.sender, m?.quoted?.sender || ''].filter(Boolean),
      isForwarded: true,
      forwardingScore: 999
    }

    if (menuBuffer) {
      msg.contextInfo.externalAdReply = {
        title: 'yelib-base',
        body: bodyText,
        thumbnail: menuBuffer,
        mediaType: 1,
        sourceUrl: 'https://github.com/miuujs/yelib-base',
        sourceType: '1'
      }
    }

    return await sock.sendMessage(target, msg, { quoted: m })
  } catch (e) {
    return sock.sendMessage(target, { text }, { quoted: m })
  }
}

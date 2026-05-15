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

export async function adReply(sock, m, text, chat, extraMentions) {
  const target = typeof chat === 'string' ? chat : m.chat

  const plain = () => sock.sendMessage(target, { text })

  try {
    const msg = { text }
    const ci = {}

    const mentions = [m?.sender, m?.quoted?.sender, ...(extraMentions || [])].filter(Boolean)
    if (mentions.length) ci.mentionedJid = mentions

    if (menuBuffer) {
      ci.externalAdReply = {
        title: 'yelib-base',
        body: 'Runtime: ' + clockString(Date.now() - global.start),
        thumbnail: menuBuffer,
        mediaType: 1,
        sourceUrl: 'https://github.com/miuujs/yelib-base'
      }
    }

    if (Object.keys(ci).length) msg.contextInfo = ci

    const q = m?.key && m?.message ? { key: m.key, message: m.message } : undefined
    await sock.sendMessage(target, msg, { ...(q ? { quoted: q } : {}) })
  } catch (e) {
    return plain()
  }
}

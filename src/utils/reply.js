import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const menuPath = join(__dirname, '../../media/menu.jpg')

let menuBuffer = null
try {
  if (existsSync(menuPath)) {
    menuBuffer = readFileSync(menuPath)
  }
} catch {}

export async function adReply(sock, m, text, options = {}) {
  const message = { text }

  message.contextInfo = {
    mentionedJid: [m.sender, m?.quoted?.sender || ''].filter(Boolean),
    isForwarded: true,
    forwardingScore: 999
  }

  if (menuBuffer) {
    message.contextInfo.externalAdReply = {
      title: 'yelib-base',
      body: '',
      thumbnail: menuBuffer,
      mediaType: 1,
      sourceUrl: 'https://github.com/miuujs/yelib-base'
    }
  }

  return sock.sendMessage(m.chat, message, { quoted: m })
}

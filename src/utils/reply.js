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
  const { contextInfo, ...msgOpts } = options
  const message = {
    text,
    contextInfo: {
      mentionedJid: [m.sender, m?.quoted?.sender || ''].filter(Boolean),
      forwardingScore: 999,
      isForwarded: true,
      externalAdReply: {
        title: 'yelib-base',
        body: '',
        mediaType: 1,
        thumbnail: menuBuffer || undefined,
        sourceUrl: '',
        sourceType: 1,
        showAdAttribution: false,
        renderLargerThumbnail: true
      },
      ...contextInfo
    },
    ...msgOpts
  }

  return sock.sendMessage(m.chat, message, { quoted: m })
}

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

export async function adReply(clients, m, text, options = {}) {
  const { contextInfo, ...msgOpts } = options
  const message = {
    image: menuBuffer || undefined,
    caption: text,
    contextInfo: {
      mentionedJid: [m.sender, m?.quoted?.sender || ''].filter(Boolean),
      forwardingScore: 999,
      isForwarded: true,
      ...contextInfo
    },
    ...msgOpts
  }

  if (!message.image) delete message.image

  return clients.sendMessage(m.chat, message, { quoted: m })
}

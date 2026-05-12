import { buildBotForwardedMessage, buildRichContextInfo, generateWAMessageFromContent } from 'baileys'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const menuPath = join(__dirname, '../media/menu.jpg')

let menuBuffer = null
try {
  if (existsSync(menuPath)) menuBuffer = readFileSync(menuPath)
} catch {}

export default async ({ sock, m }) => {
  const submessages = [
    { messageType: 2, messageText: '*Owner Commands*' },
    {
      messageType: 4,
      tableMetadata: {
        title: 'Mode',
        rows: [
          { items: ['.self', 'Set mode to self'] },
          { items: ['.public', 'Set mode to public'] }
        ]
      }
    },
    { messageType: 2, messageText: 'github:miuujs/baileys' }
  ]

  const ctxInfo = buildRichContextInfo(m)
  ctxInfo.mentionedJid = [m.sender, m?.quoted?.sender || ''].filter(Boolean)
  ctxInfo.isForwarded = true
  ctxInfo.forwardingScore = 999

  if (menuBuffer) {
    ctxInfo.externalAdReply = {
      title: 'yelib-base',
      body: '',
      thumbnail: menuBuffer,
      mediaType: 1,
      sourceUrl: 'https://github.com/miuujs/yelib-base',
      sourceType: '1'
    }
  }

  const msg = generateWAMessageFromContent(m.chat, buildBotForwardedMessage(submessages, ctxInfo), { quoted: m, userJid: sock.user.id })
  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

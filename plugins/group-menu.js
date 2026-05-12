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
    { messageType: 2, messageText: '*Group Commands*' },
    {
      messageType: 4,
      tableMetadata: {
        title: 'Admin Tools',
        rows: [
          { items: ['.kick', 'Remove members'] },
          { items: ['.add', 'Add or invite members'] },
          { items: ['.promote', 'Promote to admin'] },
          { items: ['.demote', 'Demote from admin'] },
          { items: ['.lock', 'Lock group info'] },
          { items: ['.unlock', 'Unlock group info'] }
        ]
      }
    },
    {
      messageType: 4,
      tableMetadata: {
        title: 'Group Settings',
        rows: [
          { items: ['.group', 'Open / close group'] },
          { items: ['.approval', 'Join approval mode'] },
          { items: ['.addmode', 'Member add mode'] },
          { items: ['.setname', 'Change group name'] },
          { items: ['.setdesc', 'Change description'] },
          { items: ['.setpp', 'Change group icon'] }
        ]
      }
    },
    {
      messageType: 4,
      tableMetadata: {
        title: 'Info & Invites',
        rows: [
          { items: ['.link', 'Get invite link'] },
          { items: ['.revoke', 'Revoke invite link'] },
          { items: ['.info', 'Group information'] },
          { items: ['.tagall', 'Tag all members'] },
          { items: ['.hidetag', 'Hidden tag all'] },
          { items: ['.requestlist', 'Pending requests'] },
          { items: ['.approve', 'Approve requests'] },
          { items: ['.reject', 'Reject requests'] }
        ]
      }
    },
    {
      messageType: 4,
      tableMetadata: {
        title: 'Other',
        rows: [
          { items: ['.leave', 'Leave group'] }
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

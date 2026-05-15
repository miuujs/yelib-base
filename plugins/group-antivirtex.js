import { get, set } from '../src/utils/database.js'

const RESET_INTERVAL = 3 * 60 * 60 * 1000
const MAX_LENGTH = 4000

function isVirtex(text) {
  if (!text || text.length < 30) return false
  let invisible = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (
      code === 0x200B || code === 0x200C || code === 0x200D ||
      code === 0x200E || code === 0x200F ||
      code === 0x202A || code === 0x202B || code === 0x202C || code === 0x202D || code === 0x202E ||
      code === 0x2060 || code === 0x2061 || code === 0x2062 || code === 0x2063 || code === 0x2064 ||
      code === 0x2066 || code === 0x2067 || code === 0x2068 || code === 0x2069 ||
      code === 0xFEFF || code === 0x061C || code === 0x00AD
    ) invisible++
  }
  if (invisible > 5) return true
  let maxRun = 0, curRun = 1
  for (let i = 1; i < text.length; i++) {
    if (text[i] === text[i - 1]) { curRun++; maxRun = Math.max(maxRun, curRun) } else curRun = 1
  }
  if (maxRun > 80) return true
  return false
}

export async function checkVirtex(sock, m) {
  if (!m.isGroup) return
  const settings = get(m.chat)
  if (!settings.antivirtex) return
  if (!m.body) return
  const text = m.body
  if (text.length < 30 && text.length <= MAX_LENGTH) return
  if (text.length > MAX_LENGTH || isVirtex(text)) {
    if (m.isAdmin || m.isSuperAdmin) return
    const now = Date.now()
    if (!settings.antivirtexLastReset || now - settings.antivirtexLastReset > RESET_INTERVAL) {
      settings.antivirtexWarnings = {}
      settings.antivirtexLastReset = now
      set(m.chat, 'antivirtexLastReset', now)
      set(m.chat, 'antivirtexWarnings', {})
    }
    if (!settings.antivirtexWarnings) settings.antivirtexWarnings = {}
    if (!settings.antivirtexWarnings[m.sender]) settings.antivirtexWarnings[m.sender] = 0
    settings.antivirtexWarnings[m.sender]++
    const warnings = settings.antivirtexWarnings[m.sender]
    try {
      await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    if (warnings >= 3) {
      try {
        await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        await sock.sendMessage(m.chat, {
          text: `@${m.sender.split('@')[0]} kicked for 3 antivirtex violations`,
          contextInfo: { mentionedJid: [m.sender] }
        })
      } catch {}
      delete settings.antivirtexWarnings[m.sender]
    } else {
      const reason = text.length > MAX_LENGTH ? 'message > ' + MAX_LENGTH + ' chars' : 'virtex detected'
      await sock.sendMessage(m.chat, {
        text: `⚠️ *Antivirtex Warning ${warnings}/3*\n@${m.sender.split('@')[0]} ${reason}`,
        contextInfo: { mentionedJid: [m.sender] }
      })
    }
    set(m.chat, 'antivirtexWarnings', settings.antivirtexWarnings)
  }
}

global.antivirtexChecker = checkVirtex

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')
  const mode = args[0]?.toLowerCase()
  if (!mode) {
    const settings = get(m.chat)
    return m.reply('Antivirtex status: ' + (settings.antivirtex ? 'on' : 'off'))
  }
  if (mode === 'on') {
    set(m.chat, 'antivirtex', true)
    return m.reply('Antivirtex enabled — messages >4000 chars or virtex will be deleted')
  }
  if (mode === 'off') {
    set(m.chat, 'antivirtex', false)
    return m.reply('Antivirtex disabled')
  }
  if (mode === 'reset' || mode === 'clear') {
    let target = null
    if (m.quoted) target = m.quoted.sender
    else if (args[1]) target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!target) return m.reply('Reply or mention user to reset warnings')
    const settings = get(m.chat)
    if (settings.antivirtexWarnings?.[target]) {
      delete settings.antivirtexWarnings[target]
      set(m.chat, 'antivirtexWarnings', settings.antivirtexWarnings)
      return m.reply('Antivirtex warnings reset for @' + target.split('@')[0])
    }
    return m.reply('No antivirtex warnings for that user')
  }
  m.reply('Usage: .antivirtex on/off/reset')
}

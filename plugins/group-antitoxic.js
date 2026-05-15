import { get, set } from '../src/utils/database.js'

const RESET_INTERVAL = 3 * 60 * 60 * 1000

const TOXIC_WORDS = [
  'anjg', 'lonte', 'anjing', 'kontol', 'memek', 'bangsat', 'babi',
  'goblok', 'tolol', 'bego', 'ngentot', 'jancok', 'asu', 'sialan',
  'brengsek', 'setan', 'kampret', 'bodoh', 'pepek', 'peler', 'tai',
  'sarap', 'edan', 'gila', 'bencong', 'banci', 'kimak', 'pukimak',
  'bajingan'
]

export async function checkToxic(sock, m) {
  if (!m.isGroup) return
  const settings = get(m.chat)
  if (!settings.antitoxic) return
  if (!m.body) return

  const found = TOXIC_WORDS.find(w => m.body.toLowerCase().includes(w))
  if (!found) return

  if (m.isAdmin || m.isSuperAdmin) return

  const now = Date.now()
  if (!settings.antitoxicLastReset || now - settings.antitoxicLastReset > RESET_INTERVAL) {
    settings.antitoxicWarnings = {}
    settings.antitoxicLastReset = now
    set(m.chat, 'antitoxicLastReset', now)
    set(m.chat, 'antitoxicWarnings', {})
  }

  if (!settings.antitoxicWarnings) settings.antitoxicWarnings = {}
  if (!settings.antitoxicWarnings[m.sender]) settings.antitoxicWarnings[m.sender] = 0
  settings.antitoxicWarnings[m.sender]++

  const warnings = settings.antitoxicWarnings[m.sender]

  try {
    await sock.sendMessage(m.chat, { delete: m.key })
  } catch {}

  if (warnings >= 3) {
    try {
      await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
      await sock.sendMessage(m.chat, {
        text: `@${m.sender.split('@')[0]} kicked for 3 toxic warnings`,
        contextInfo: { mentionedJid: [m.sender] }
      })
    } catch {}
    delete settings.antitoxicWarnings[m.sender]
  } else {
    await sock.sendMessage(m.chat, {
      text: `⚠️ *Antitoxic Warning ${warnings}/3*\n@${m.sender.split('@')[0]} detected using toxic word: "${found}"\nPlease maintain formal language.`,
      contextInfo: { mentionedJid: [m.sender] }
    })
  }

  set(m.chat, 'antitoxicWarnings', settings.antitoxicWarnings)
}

global.antitoxicChecker = checkToxic

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()

  if (!mode) {
    const settings = get(m.chat)
    const status = settings.antitoxic ? 'on' : 'off'
    return m.reply('Antitoxic status: ' + status)
  }

  if (mode === 'on') {
    set(m.chat, 'antitoxic', true)
    return m.reply('Antitoxic enabled for this group')
  }

  if (mode === 'off') {
    set(m.chat, 'antitoxic', false)
    return m.reply('Antitoxic disabled for this group')
  }

  if (mode === 'reset' || mode === 'clear') {
    let target = null
    if (m.quoted) target = m.quoted.sender
    else if (args[1]) target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    if (!target) return m.reply('Reply or mention user to reset warnings')
    const settings = get(m.chat)
    if (settings.antitoxicWarnings?.[target]) {
      delete settings.antitoxicWarnings[target]
      set(m.chat, 'antitoxicWarnings', settings.antitoxicWarnings)
      return m.reply('Warnings reset for @' + target.split('@')[0])
    }
    return m.reply('No warnings found for that user')
  }

  m.reply('Usage: .antitoxic on/off/reset')
}

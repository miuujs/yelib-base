import { get, set } from '../src/utils/database.js'

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()

  if (!mode) {
    const settings = get(m.chat)
    return m.reply('Public mode: ' + (settings.public ? 'on' : 'off'))
  }

  if (mode === 'on') {
    set(m.chat, 'public', true)
    return m.reply('Public mode enabled — all members can use commands')
  }

  if (mode === 'off') {
    set(m.chat, 'public', false)
    return m.reply('Public mode disabled — only owner/bot can use commands')
  }

  m.reply('Usage: .gcpublic on/off')
}

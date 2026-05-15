import { get, set } from '../src/utils/database.js'

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const sub = args[0]?.toLowerCase()
  const existing = get(m.chat).custom || {}

  if (!sub) {
    const keys = Object.keys(existing)
    if (!keys.length) return m.reply('No custom replies.\nUsage: .custom add <keyword>|<reply>')
    const list = keys.map(k => '• *' + k + '* → ' + existing[k]).join('\n')
    return m.reply('Custom replies:\n' + list)
  }

  if (sub === 'add') {
    const rest = args.slice(1).join(' ')
    const sep = rest.indexOf('|')
    if (sep === -1) return m.reply('Usage: .custom add <keyword>|<reply>')
    const key = rest.slice(0, sep).trim().toLowerCase()
    const val = rest.slice(sep + 1).trim()
    if (!key || !val) return m.reply('Keyword and reply cannot be empty')
    existing[key] = val
    set(m.chat, 'custom', existing)
    return m.reply('Custom reply added: *' + key + '*')
  }

  if (sub === 'del') {
    const key = args.slice(1).join(' ').toLowerCase().trim()
    if (!key) return m.reply('Usage: .custom del <keyword>')
    if (!existing[key]) return m.reply('Keyword not found: ' + key)
    delete existing[key]
    set(m.chat, 'custom', existing)
    return m.reply('Custom reply deleted: *' + key + '*')
  }

  m.reply('Usage: .custom add <keyword>|<reply> | .custom del <keyword>')
}

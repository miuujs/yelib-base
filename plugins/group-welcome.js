import { get, set } from '../src/utils/database.js'

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()

  if (!mode) {
    const settings = get(m.chat)
    const status = settings.welcome ? 'on' : 'off'
    const text = settings.welcomeText || ''
    return m.reply('Welcome status: ' + status + (text ? '\nText: ' + text : ''))
  }

  if (mode === 'on') {
    set(m.chat, 'welcome', true)
    return m.reply('Welcome enabled for this group')
  }

  if (mode === 'off') {
    set(m.chat, 'welcome', false)
    return m.reply('Welcome disabled for this group')
  }

  if (mode === 'set' && args[1]?.toLowerCase() === 'text') {
    const text = args.slice(2).join(' ')
    if (!text) return m.reply('Usage: .welcome set text <message>')
    set(m.chat, 'welcomeText', text)
    return m.reply('Welcome text updated')
  }

  m.reply('Usage: .welcome on/off or .welcome set text <message>')
}

import { get, set } from '../src/utils/database.js'

export default async ({ sock, m, args, isOwner, isGroup }) => {
  if (!isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()

  if (!mode) {
    const settings = get(m.chat)
    const status = settings.goodbye ? 'on' : 'off'
    const text = settings.goodbyeText || ''
    return m.reply('Goodbye status: ' + status + (text ? '\nText: ' + text : ''))
  }

  if (mode === 'on') {
    set(m.chat, 'goodbye', true)
    return m.reply('Goodbye enabled for this group')
  }

  if (mode === 'off') {
    set(m.chat, 'goodbye', false)
    return m.reply('Goodbye disabled for this group')
  }

  if (mode === 'set' && args[1]?.toLowerCase() === 'text') {
    const text = args.slice(2).join(' ')
    if (!text) return m.reply('Usage: .goodbye set text <message>')
    set(m.chat, 'goodbyeText', text)
    return m.reply('Goodbye text updated')
  }

  m.reply('Usage: .goodbye on/off or .goodbye set text <message>')
}

export default async ({ sock, m, args }) => {
  const mode = args[0]?.toLowerCase()
  const text = args.slice(1).join(' ') || (m.quoted?.text || '')
  if (!['encode', 'decode', 'enc', 'dec'].includes(mode) || !text) return m.reply('Usage: .base64 <encode|decode> <text>\nOr reply to a message')

  try {
    const result = mode === 'encode' || mode === 'enc'
      ? Buffer.from(text, 'utf-8').toString('base64')
      : Buffer.from(text, 'base64').toString('utf-8')
    await sock.sendMessage(m.chat, { text: '```' + result + '```' }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['base64']

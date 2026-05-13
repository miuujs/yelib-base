export default async ({ sock, m }) => {
  if (!m.isGroup) return m.reply('Group only')

  const meta = await sock.groupMetadata(m.chat)
  const admins = meta.participants.filter(p => p.admin).map(p => '  • @' + p.id.split('@')[0])
  const members = meta.participants.length
  const desc = meta.desc ? 'Yes' : 'No'

  const text = '*Group Info*\n' +
    'Name: ' + meta.subject + '\n' +
    'ID: ' + meta.id + '\n' +
    'Members: ' + members + '\n' +
    'Admins: ' + (admins.length || 'none') + '\n' +
    'Created: ' + (meta.creation ? new Date(meta.creation * 1000).toLocaleDateString() : '?') + '\n' +
    'Description: ' + desc

  await sock.sendMessage(m.chat, {
    text,
    mentions: meta.participants.map(p => p.id)
  }, { quoted: m })
}

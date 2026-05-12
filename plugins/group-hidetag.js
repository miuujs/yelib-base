export default async ({ sock, m, args }) => {
  if (!m.isGroup) return m.reply('Group only')

  const meta = await sock.groupMetadata(m.chat)
  const members = meta.participants.map(p => p.id)
  const text = args.join(' ') || '\u200b'

  await sock.sendMessage(m.chat, {
    text,
    mentions: members
  })
}

export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const meta = await sock.groupMetadata(m.chat)
  const members = meta.participants.map(p => p.id)
  const text = args.join(' ') || '\u200b'

  await sock.sendMessage(m.chat, {
    text,
    mentions: members
  })
}

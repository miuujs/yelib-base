export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const name = args.join(' ')
  if (!name) return m.reply('Provide a name')

  await sock.groupUpdateSubject(m.chat, name)
  m.reply('Group name changed to: ' + name)
}

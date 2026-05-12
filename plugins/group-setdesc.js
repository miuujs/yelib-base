export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const desc = args.join(' ')
  if (!desc) return m.reply('Provide a description')

  await sock.groupUpdateDescription(m.chat, desc)
  m.reply('Description updated')
}

export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner) return m.reply('Owner only')

  await sock.groupLeave(m.chat)
}

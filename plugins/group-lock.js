export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  await sock.groupSettingUpdate(m.chat, 'locked')
  m.reply('Group info locked (only admins can edit)')
}

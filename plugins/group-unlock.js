export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  await sock.groupSettingUpdate(m.chat, 'unlocked')
  m.reply('Group info unlocked (all members can edit)')
}

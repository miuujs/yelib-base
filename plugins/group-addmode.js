export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()
  if (!mode || !['all', 'admin'].includes(mode)) return m.reply('Usage: .addmode all/admin')

  await sock.groupMemberAddMode(m.chat, mode === 'all' ? 'all_member_add' : '')
  m.reply('Add member mode: ' + mode)
}

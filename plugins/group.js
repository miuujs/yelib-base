export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()
  if (!mode || !['open', 'close'].includes(mode)) return m.reply('Usage: .group open/close')

  await sock.groupSettingUpdate(m.chat, mode === 'open' ? 'not_announcement' : 'announcement')
  m.reply(mode === 'open' ? 'Group opened (all can send)' : 'Group closed (admins only)')
}

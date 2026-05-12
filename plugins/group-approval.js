export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const mode = args[0]?.toLowerCase()
  if (!mode || !['on', 'off'].includes(mode)) return m.reply('Usage: .approval on/off')

  await sock.groupJoinApprovalMode(m.chat, mode === 'on' ? 'on' : 'off')
  m.reply('Join approval mode: ' + mode)
}

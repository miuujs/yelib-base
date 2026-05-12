export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const code = await sock.groupInviteCode(m.chat)
  m.reply('https://chat.whatsapp.com/' + code)
}

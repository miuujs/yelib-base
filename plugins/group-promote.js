export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  let users = []
  if (m.quoted) users.push(m.quoted.sender)
  if (m.mentionedJid?.length) users.push(...m.mentionedJid)
  for (const a of args) {
    const n = a.replace(/[^0-9]/g, '')
    if (n) users.push(n + '@s.whatsapp.net')
  }
  if (!users.length) return m.reply('Reply, mention, or provide numbers')

  users = [...new Set(users)]
  await sock.groupParticipantsUpdate(m.chat, users, 'promote')
  m.reply('Promoted ' + users.length + ' member(s)')
}

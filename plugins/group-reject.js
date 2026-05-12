export default async ({ sock, m, args, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  let users = []
  if (m.quoted) users.push(m.quoted.sender)
  if (m.msg?.contextInfo?.mentionedJid?.length) users.push(...m.msg.contextInfo.mentionedJid)
  for (const a of args) {
    const n = a.replace(/[^0-9]/g, '')
    if (n) users.push(n + '@s.whatsapp.net')
  }

  if (!users.length) {
    const requests = await sock.groupRequestParticipantsList(m.chat)
    if (!requests.length) return m.reply('No pending requests')
    users = requests.map(r => r.jid)
  }

  users = [...new Set(users)]
  await sock.groupRequestParticipantsUpdate(m.chat, users, 'reject')
  m.reply('Rejected ' + users.length + ' request(s)')
}

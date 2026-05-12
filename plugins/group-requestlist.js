export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  const requests = await sock.groupRequestParticipantsList(m.chat)
  if (!requests.length) return m.reply('No pending join requests')

  const text = '*Pending Join Requests:*\n' +
    requests.map((r, i) => (i + 1) + '. @' + r.jid.split('@')[0]).join('\n')

  await sock.sendMessage(m.chat, {
    text,
    mentions: requests.map(r => r.jid)
  }, { quoted: m })
}

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
  if (!users.length) return m.reply('Reply, mention, or provide numbers')

  users = [...new Set(users)]
  const added = []
  const invited = []

  for (const u of users) {
    try {
      await sock.groupParticipantsUpdate(m.chat, [u], 'add')
      added.push(u)
    } catch {
      invited.push(u)
    }
  }

  if (invited.length) {
    const code = await sock.groupInviteCode(m.chat)
    const link = 'https://chat.whatsapp.com/' + code
    for (const u of invited) {
      await sock.sendMessage(u, { text: 'Join group: ' + link }).catch(() => {})
    }
  }

  let msg = ''
  if (added.length) msg += 'Added ' + added.length + ' member(s)'
  if (invited.length) msg += (msg ? '\n' : '') + 'Invited ' + invited.length + ' member(s) via link'
  if (msg) m.reply(msg)
}

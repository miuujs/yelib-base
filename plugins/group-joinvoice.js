export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const linkMatch = (args.join(' ') || m.quoted?.text || '').match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)

  if (linkMatch) {
    const code = linkMatch[1]
    await m.reply('Joining group...')
    try {
      const jid = await sock.groupAcceptInvite(code)
      jid ? m.reply('Joined: ' + jid.split('@')[0]) : m.reply('Failed to join group')
    } catch (e) {
      m.reply('Error: ' + e.message)
    }
    return
  }

  if (!m.isGroup) return m.reply('Send a group invite link or use in a group with an active voice call')

  const call = global.activeGroupCalls?.get(m.chat)
  if (!call) return m.reply('No active group call found')

  await m.reply('Joining group call...')
  try {
    await sock.query({
      tag: 'call',
      attrs: { from: sock.user.id, to: call.from },
      content: [{
        tag: 'accept',
        attrs: { 'call-id': call.id, 'call-creator': call.from, count: '0' },
        content: []
      }]
    })
    await m.reply('Joined group call')
  } catch (e) {
    await m.reply('Error joining call: ' + e.message)
  }
}

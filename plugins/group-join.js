export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const input = args.join(' ') || m.quoted?.text || ''
  const match = input.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)
  if (!match) return m.reply('Send a group invite link')

  const code = match[1]
  await m.reply('Joining group...')

  try {
    const jid = await sock.groupAcceptInvite(code)
    if (jid) {
      await m.reply('Joined: ' + jid.split('@')[0])
    } else {
      await m.reply('Failed to join group')
    }
  } catch (e) {
    await m.reply('Error: ' + e.message)
  }
}

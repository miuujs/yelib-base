export default async ({ sock, m, isOwner }) => {
  if (!m.quoted?.isMedia || m.quoted?.mediaType !== 'image') return m.reply('Reply to an image')

  const media = await m.quoted.download()
  if (!media) return m.reply('Failed to download image')

  if (m.isGroup) {
    if (!isOwner && !m.isAdmin) return m.reply('Group admin only')
    await sock.query({
      tag: 'iq',
      attrs: { to: m.chat, type: 'set', xmlns: 'w:profile:picture' },
      content: [{ tag: 'picture', attrs: { type: 'image' }, content: media }]
    })
    m.reply('Group icon updated')
  } else {
    if (!isOwner) return m.reply('Owner only')
    const botJid = sock.decodeJid(sock.user.id)
    await sock.query({
      tag: 'iq',
      attrs: { to: botJid, type: 'set', xmlns: 'w:profile:picture' },
      content: [{ tag: 'picture', attrs: { type: 'image' }, content: media }]
    })
    m.reply('Profile picture updated')
  }
}

export const aliases = ['setprofile']

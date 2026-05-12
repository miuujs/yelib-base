export default async ({ sock, m, isOwner }) => {
  if (!m.isGroup) return m.reply('Group only')
  if (!isOwner && !m.isAdmin) return m.reply('Group admin only')

  if (!m.quoted?.isMedia || m.quoted?.mediaType !== 'image') return m.reply('Reply to an image')

  const media = await m.quoted.download()
  if (!media) return m.reply('Failed to download image')

  await sock.query({
    tag: 'iq',
    attrs: { to: m.chat, type: 'set', xmlns: 'w:profile:picture' },
    content: [
      { tag: 'picture', attrs: { type: 'image' }, content: media }
    ]
  })
  m.reply('Group icon updated')
}

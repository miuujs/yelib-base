export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')
  const q = m.quoted
  if (!q) return m.reply('Reply to a view-once message')

  const media = q.msg
  if (!media) return m.reply('No media found')

  const isViewOnce = media.viewOnce || q.mtype === 'viewOnceMessageV2'
  if (!isViewOnce) return m.reply('Not a view-once message')

  const mime = media.mimetype || ''
  let type
  if (mime.startsWith('image/') || q.mtype === 'imageMessage') type = 'image'
  else if (mime.startsWith('video/') || q.mtype === 'videoMessage') type = 'video'
  else if (mime.startsWith('audio/') || q.mtype === 'audioMessage') type = 'audio'
  else return m.reply('Unsupported media type')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    const cap = media.caption || q.text || ''
    const ctx = {}
    if (media.contextInfo?.mentionedJid?.length) {
      ctx.mentionedJid = media.contextInfo.mentionedJid
    }

    await sock.sendMessage(m.chat, {
      [type]: buf,
      mimetype: mime,
      caption: cap,
      contextInfo: ctx
    }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

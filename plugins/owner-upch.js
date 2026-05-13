export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/audio/.test(mime)) return m.reply('Reply to an audio message')

  const ch = global.channel || process.env.CHANNEL_ID || '120363425402680588@newsletter'

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    await sock.sendMessage(ch, {
      audio: buf,
      mimetype: 'audio/mpeg',
      ptt: false
    })

    await m.reply('Audio uploaded to channel')
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['upch']

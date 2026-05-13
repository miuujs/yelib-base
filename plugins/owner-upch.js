export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/audio/.test(mime)) return m.reply('Reply to an audio')

  const ch = args.join(' ') || global.channel || process.env.CHANNEL_ID || '120363425402680588@newsletter'

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    await sock.sendMessage(ch, { audio: buf, mimetype: 'audio/mpeg', ptt: false })
  } catch (e) {
    console.error('upch error:', e)
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['upch']

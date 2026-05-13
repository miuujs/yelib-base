import sharp from 'sharp'

export default async ({ sock, m }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/webp|sticker/i.test(mime)) return m.reply('Reply to a sticker')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')
    const png = await sharp(buf).png().toBuffer()
    await sock.sendMessage(m.chat, { image: png }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['toimage']

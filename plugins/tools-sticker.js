import { downloadContentFromMessage } from 'baileys'
import { writeExif } from '../src/utils/exif.js'

export default async ({ sock, m }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/image|video|webp/.test(mime)) return m.reply('Send or reply to an image/video with .s')
  if (/video/.test(mime) && ((q.msg?.seconds || q.seconds) > 10)) return m.reply('Video max 10 seconds')

  try {
    let buffer
    if (q.download) {
      buffer = await q.download()
    } else {
      const type = /video/.test(mime) ? 'video' : 'image'
      const stream = await downloadContentFromMessage(m.msg || q.msg, type)
      let buf = Buffer.from([])
      for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
      buffer = buf
    }

    const ext = mime.split('/')[1] || 'png'
    const sticker = await writeExif({ mimetype: mime, data: buffer, ext }, {
      packName: global.sticker.pack,
      packPublish: global.sticker.author,
      emojis: ['😋', '😎', '🤣', '😂', '😁'],
    })

    await sock.sendMessage(m.chat, { sticker }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

import axios from 'axios'
import FormData from 'form-data'

async function upload(buf, service) {
  const fd = new FormData()
  fd.append('file', buf, 'file')
  let url, headers
  switch (service) {
    case 'catbox':
      fd.append('reqtype', 'fileupload')
      url = 'https://catbox.moe/user/api.php'
      break
    case '0x0':
      url = 'https://0x0.st'
      break
    case 'tmpfiles':
      url = 'https://tmpfiles.org/api/v1/upload'
      break
    default:
      throw new Error('Unknown service')
  }
  const { data } = await axios.post(url, fd, {
    headers: fd.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
  if (service === 'catbox') return data.trim()
  if (service === 'tmpfiles') return data?.data?.url?.replace('tmpfiles.org/dl', 'tmpfiles.org') || String(data)
  return data.trim()
}

export default async ({ sock, m, args }) => {
  const service = args[0]?.toLowerCase() || 'catbox'
  if (!['catbox', '0x0', 'tmpfiles'].includes(service))
    return m.reply('Services: catbox, 0x0, tmpfiles\nUsage: .tourl [service] (reply media)')

  let media
  if (m.quoted?.isMedia) {
    media = await m.quoted.download()
  } else if (args[1]?.startsWith('http')) {
    const { data } = await axios.get(args[1], { responseType: 'arraybuffer', timeout: 30000 })
    media = Buffer.from(data)
  } else {
    return m.reply('Reply to image/video/audio/sticker')
  }

  if (!media) return m.reply('Failed to get media')

  try {
    const url = await upload(media, service)
    await sock.sendMessage(m.chat, {
      text: `*Uploaded to ${service}*\n${url}`
    })
  } catch (e) {
    m.reply('Upload failed: ' + e.message)
  }
}

export const aliases = ['upload']

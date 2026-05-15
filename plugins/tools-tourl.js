import axios from 'axios'
import FormData from 'form-data'

const SERVICES = {
  catbox: { url: 'https://catbox.moe/user/api.php', field: 'fileToUpload', extra: { reqtype: 'fileupload' } },
  '0x0': { url: 'https://0x0.st', field: 'file', extra: {} },
  tmpfiles: { url: 'https://tmpfiles.org/api/v1/upload', field: 'file', extra: {} }
}

async function upload(buf, service) {
  const cfg = SERVICES[service]
  const fd = new FormData()
  fd.append(cfg.field, buf, 'file')
  for (const [k, v] of Object.entries(cfg.extra)) fd.append(k, v)
  const { data } = await axios.post(cfg.url, fd, {
    headers: fd.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
  if (service === 'catbox') return String(data).trim()
  if (service === 'tmpfiles') return data?.data?.url?.replace('tmpfiles.org/dl', 'tmpfiles.org') || String(data)
  return String(data).trim()
}

export default async ({ sock, m, args }) => {
  const service = args[0]?.toLowerCase() || 'catbox'
  if (!SERVICES[service]) return m.reply('Services: catbox, 0x0, tmpfiles\nUsage: .tourl [service] (reply/send media)')

  let media
  if (m.isMedia) {
    media = await m.download()
  } else if (m.quoted?.isMedia) {
    media = await m.quoted.download()
  } else if (args[1]?.startsWith('http')) {
    const { data } = await axios.get(args[1], { responseType: 'arraybuffer', timeout: 30000 })
    media = Buffer.from(data)
  } else {
    return m.reply('Reply/send media with caption .tourl')
  }

  if (!media) return m.reply('Failed to get media')

  try {
    const url = await upload(media, service)
    await sock.sendMessage(m.chat, { text: `*Uploaded to ${service}*\n${url}` })
  } catch (e) {
    m.reply('Upload failed: ' + (e.response?.data || e.message))
  }
}

export const aliases = ['upload']

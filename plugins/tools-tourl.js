import axios from 'axios'
import FormData from 'form-data'

const SERVICES = {
  tmpfiles: { url: 'https://tmpfiles.org/api/v1/upload', field: 'file' },
  uguu: { url: 'https://uguu.se/upload', field: 'files[]' },
  litterbox: { url: 'https://litterbox.catbox.moe/resources/internals/api.php', field: 'fileToUpload', extra: { reqtype: 'fileupload', time: '24h' } },
  catbox: { url: 'https://catbox.moe/user/api.php', field: 'fileToUpload', extra: { reqtype: 'fileupload' } },
}

function formatUrl(service, data) {
  if (service === 'tmpfiles') return data?.data?.url?.replace('tmpfiles.org/dl', 'tmpfiles.org') || String(data)
  if (service === 'uguu') return data?.files?.[0]?.url || String(data)
  if (service === 'litterbox' || service === 'catbox') return String(data).trim()
  return String(data).trim()
}

async function upload(buf, service) {
  const cfg = SERVICES[service]
  const fd = new FormData()
  fd.append(cfg.field, buf, 'file')
  if (cfg.extra) for (const [k, v] of Object.entries(cfg.extra)) fd.append(k, v)
  const { data } = await axios.post(cfg.url, fd, {
    headers: fd.getHeaders(),
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  })
  return formatUrl(service, data)
}

export default async ({ sock, m, args }) => {
  const service = args[0]?.toLowerCase() || 'tmpfiles'
  if (!SERVICES[service]) return m.reply('Services: tmpfiles, uguu, litterbox, catbox\nUsage: .tourl [service] (reply/send media)')

  let media
  if (m.isMedia) media = await m.download()
  else if (m.quoted?.isMedia) media = await m.quoted.download()
  else if (args[1]?.startsWith('http')) {
    const { data } = await axios.get(args[1], { responseType: 'arraybuffer', timeout: 30000 })
    media = Buffer.from(data)
  } else return m.reply('Reply/send media with caption .tourl')

  if (!media) return m.reply('Failed to get media')

  try {
    const url = await upload(media, service)
    await sock.sendMessage(m.chat, { text: `*Uploaded to ${service}*\n${url}` })
  } catch (e) {
    m.reply('Upload failed: ' + (e.response?.data || e.message))
  }
}

export const aliases = ['upload']

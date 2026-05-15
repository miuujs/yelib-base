import axios from 'axios'
import FormData from 'form-data'

const SERVICES = {
  tmpfiles: { url: 'https://tmpfiles.org/api/v1/upload', field: 'file', ok: true },
  uguu: { url: 'https://uguu.se/upload', field: 'files[]', ok: true },
  litterbox: { url: 'https://litterbox.catbox.moe/resources/internals/api.php', field: 'fileToUpload', ok: true, extra: { reqtype: 'fileupload', time: '24h' } },
  catbox: { url: 'https://catbox.moe/user/api.php', field: 'fileToUpload', ok: false, extra: { reqtype: 'fileupload' } },
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

async function getMedia(m, args) {
  if (m.isMedia) return await m.download()
  if (m.quoted?.isMedia) return await m.quoted.download()
  if (args[1]?.startsWith('http')) {
    const { data } = await axios.get(args[1], { responseType: 'arraybuffer', timeout: 30000 })
    return Buffer.from(data)
  }
  return null
}

export default async ({ sock, m, args }) => {
  const service = args[0]?.toLowerCase()
  const CACHE_TTL = 120000

  if (!global._tourlCache) global._tourlCache = new Map()

  if (!service) {
    const media = await getMedia(m, args)
    if (media) global._tourlCache.set(m.sender, { media, timestamp: Date.now() })

    const rows = Object.entries(SERVICES).map(([k, v]) => ({
      title: `${v.ok ? '[OK]' : '[X]'} ${k}${k === 'litterbox' ? ' (24h)' : ''}${v.ok ? '' : ' — blocked'}`,
      id: `.tourl ${k}`
    }))
    return await sock.sendMessage(m.chat, {
      interactiveMessage: {
        title: '*Upload Services*\n\nPilih service untuk upload:',
        footer: 'atau .tourl <nama> sambil reply media',
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Choose Service',
            sections: [{ title: 'Services', rows }]
          })
        }]
      }
    }, { quoted: m })
  }

  if (!SERVICES[service]) return m.reply('Service not found. Use .tourl to see list')

  let media = await getMedia(m, args)
  if (!media && global._tourlCache.has(m.sender)) {
    const cached = global._tourlCache.get(m.sender)
    if (Date.now() - cached.timestamp < CACHE_TTL) media = cached.media
    global._tourlCache.delete(m.sender)
  }
  if (!media) return m.reply('Reply/send media with caption .tourl')

  try {
    const url = await upload(media, service)
    await sock.sendMessage(m.chat, { text: `*Uploaded to ${service}*\n${url}` })
  } catch (e) {
    m.reply('Upload failed: ' + (e.response?.data || e.message))
  }
}

export const aliases = ['upload']

import axios from 'axios'
import crypto from 'crypto'
import { save } from '../src/utils/tmp.js'

const ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12'
const api = axios.create({
  headers: {
    'content-type': 'application/json',
    origin: 'https://yt.savetube.me',
    'user-agent': 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0'
  }
})

function decrypt(enc) {
  const sr = Buffer.from(enc, 'base64')
  const key = Buffer.from(ky, 'hex')
  const iv = sr.slice(0, 16)
  const dt = sr.slice(16)
  const dc = crypto.createDecipheriv('aes-128-cbc', key, iv)
  return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString())
}

function extractId(url) {
  const m = url.match(/(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/)
  return m?.[1] || null
}

async function getCdn() {
  const res = await api.get('https://media.savetube.vip/api/random-cdn')
  return res.data?.cdn || null
}

export default async ({ sock, m, args }) => {
  const url = args[0]
  let type = args[1] || 'video'
  if (!url) return m.reply('Usage: .yt <url> [video|audio]')

  if (/music\.youtube\.com/i.test(url)) type = 'audio'

  try {
    const id = extractId(url)
    if (!id) throw new Error('Invalid YouTube URL')

    const cdn = await getCdn()
    if (!cdn) throw new Error('No CDN available')

    const { data: info } = await api.post(`https://${cdn}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${id}`
    })
    if (!info.data) throw new Error(info.message || 'Failed to get video info')

    const dec = decrypt(info.data)

    await m.reply(`*Downloading:* ${dec.title}`)

    const { data: dl } = await api.post(`https://${cdn}/download`, {
      id,
      downloadType: type === 'audio' ? 'audio' : 'video',
      quality: type === 'audio' ? '128' : '720',
      key: dec.key
    })

    let dlUrl = dl.data?.downloadUrl

    if (!dlUrl && type !== 'audio') {
      const { data: dl2 } = await api.post(`https://${cdn}/download`, {
        id,
        downloadType: 'audio',
        quality: '128',
        key: dec.key
      })
      dlUrl = dl2.data?.downloadUrl
      if (dlUrl) type = 'audio'
    }

    if (!dlUrl) throw new Error('No download URL received')

    const { data: mediaData } = await axios.get(dlUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        Referer: 'https://yt.savetube.me/'
      }
    })

    const ext = type === 'audio' ? 'mp3' : 'mp4'
    save('yt_' + Date.now() + '.' + ext, Buffer.from(mediaData))

    if (type === 'audio') {
      const thumbRes = await axios.get(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { responseType: 'arraybuffer' }).catch(() => null)
      await sock.sendMessage(m.chat, {
        audio: Buffer.from(mediaData),
        mimetype: 'audio/mpeg',
        ptt: false,
        contextInfo: {
          externalAdReply: {
            title: dec.title || 'YouTube Audio',
            body: '',
            thumbnail: thumbRes ? Buffer.from(thumbRes.data) : undefined,
            sourceUrl: `https://youtu.be/${id}`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m })
    } else {
      await sock.sendMessage(m.chat, {
        video: Buffer.from(mediaData),
        caption: dec.title || 'YouTube Video'
      }, { quoted: m })
    }

  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

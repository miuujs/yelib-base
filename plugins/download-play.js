import axios from 'axios'
import crypto from 'crypto'
import yts from 'yt-search'
import { execSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
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

async function getAudioUrl(id) {
  const cdn = await getCdn()
  if (!cdn) throw new Error('No CDN available')

  const { data: info } = await api.post(`https://${cdn}/v2/info`, {
    url: `https://www.youtube.com/watch?v=${id}`
  })
  if (!info.data) throw new Error(info.message || 'Failed to get video info')

  const dec = decrypt(info.data)

  const { data: dl } = await api.post(`https://${cdn}/download`, {
    id,
    downloadType: 'audio',
    quality: '128',
    key: dec.key
  })

  const dlUrl = dl.data?.downloadUrl
  if (!dlUrl) throw new Error('No download URL received')

  return {
    url: dlUrl,
    title: dec.title,
    thumb: dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  }
}

export default async ({ sock, m, args }) => {
  const query = args.join(' ') || (m.quoted?.text || '')
  if (!query) return m.reply('Usage: .play <song name or URL>')

  try {
    let id, title

    if (/youtube\.com|youtu\.be/i.test(query)) {
      id = extractId(query)
      if (!id) throw new Error('Invalid YouTube URL')
      const info = await getAudioUrl(id)
      title = info.title
    } else {
      const search = await yts(query)
      const found = search.videos.find(v => v.seconds < 900)
      if (!found) throw new Error('No results found (videos under 15 min)')
      id = found.videoId
      title = found.title
    }

    await m.reply(`*Found:* ${title}\n*Downloading...*`)

    const info = await getAudioUrl(id)

    const audioRes = await axios.get(info.url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        Referer: 'https://yt.savetube.me/'
      }
    })
    const thumbRes = await axios.get(info.thumb, { responseType: 'arraybuffer' })

    const tempInput = join(tmpdir(), `in_${crypto.randomBytes(4).toString('hex')}.mp3`)
    writeFileSync(tempInput, Buffer.from(audioRes.data))

    const tempOutput = join(tmpdir(), `out_${crypto.randomBytes(4).toString('hex')}.opus`)
    execSync(`ffmpeg -y -i "${tempInput}" -c:a libopus -b:a 128k -vbr on -compression_level 10 "${tempOutput}"`, { timeout: 60000 })

    const opusBuffer = readFileSync(tempOutput)
    save('play_' + Date.now() + '.opus', opusBuffer)

    await sock.sendMessage(m.chat, {
      audio: opusBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: info.title || title || id,
          body: '',
          thumbnail: Buffer.from(thumbRes.data),
          sourceUrl: `https://youtu.be/${id}`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })

    unlinkSync(tempInput)
    unlinkSync(tempOutput)

  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

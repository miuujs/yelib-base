import axios from 'axios'
import crypto from 'crypto'
import { load } from 'cheerio'
import yts from 'yt-search'
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

async function getCdn() {
  const res = await api.get('https://media.savetube.vip/api/random-cdn')
  return res.data?.cdn || null
}

async function downloadYouTubeAudio(videoId, onTitle) {
  const cdn = await getCdn()
  if (!cdn) throw new Error('No CDN available')

  const { data: info } = await api.post(`https://${cdn}/v2/info`, {
    url: `https://www.youtube.com/watch?v=${videoId}`
  })
  if (!info.data) throw new Error(info.message || 'Failed to get video info')

  const dec = decrypt(info.data)
  if (onTitle) onTitle(dec.title)

  const { data: dl } = await api.post(`https://${cdn}/download`, {
    id: videoId,
    downloadType: 'audio',
    quality: '128',
    key: dec.key
  })

  const dlUrl = dl.data?.downloadUrl
  if (!dlUrl) throw new Error('No download URL received')

  const { data: mediaData } = await axios.get(dlUrl, {
    responseType: 'arraybuffer',
    timeout: 120000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      Referer: 'https://yt.savetube.me/'
    }
  })

  return mediaData
}

function extractTrackId(text) {
  if (!text) return null
  if (/^[a-zA-Z0-9]{22}$/.test(text)) return text
  const m = String(text).match(/track\/([a-zA-Z0-9]{22})/)
  return m ? m[1] : null
}

function extractPlaylistId(text) {
  if (!text) return null
  const m = String(text).match(/playlist\/([a-zA-Z0-9]{22})/)
  return m ? m[1] : null
}

async function getTrackMeta(trackId) {
  const { data } = await axios.get(`https://open.spotify.com/track/${trackId}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 10000
  })
  const $ = load(data)
  const title = $('meta[property="og:title"]').attr('content') || 'Unknown Track'
  const artist = $('meta[name="music:musician_description"]').attr('content') || ''
  const thumb = $('meta[property="og:image"]').attr('content') || ''
  return { title, artist, thumb }
}

export default async ({ sock, m, args }) => {
  const input = args.join(' ') || (m.quoted?.text || '')
  const trackId = extractTrackId(input)
  const playlistId = extractPlaylistId(input)

  if (!trackId && !playlistId) return m.reply('Usage: .spotify <track-url|playlist-url|track-id>')

  try {
    let title, artist, thumb, searchQuery

    if (playlistId) {
      const { data } = await axios.get(`https://open.spotify.com/playlist/${playlistId}`, {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      })
      const uniqueTracks = [...new Set((data.match(/track\/([a-zA-Z0-9]{22})/g) || []).map(s => s.replace('track/', '')))]
      if (!uniqueTracks.length) return m.reply('No tracks found in playlist')
      await m.reply(`*Playlist:* ${uniqueTracks.length} tracks found\nDownloading first track...`)
      const firstMeta = await getTrackMeta(uniqueTracks[0])
      title = firstMeta.title
      artist = firstMeta.artist
      thumb = firstMeta.thumb
      searchQuery = `${title} ${artist}`.trim()
    } else {
      const meta = await getTrackMeta(trackId)
      title = meta.title
      artist = meta.artist
      thumb = meta.thumb
      searchQuery = `${title} ${artist}`.trim()
    }

    await m.reply(`*Searching:* ${title}${artist ? ' - ' + artist : ''}`)

    const search = await yts(searchQuery + ' song')
    const video = search.videos?.[0]
    if (!video) throw new Error('No YouTube match found')

    await m.reply(`*Found on YouTube:* ${video.title}\nDownloading audio...`)

    const mediaData = await downloadYouTubeAudio(video.videoId)

    save('spotify_' + Date.now() + '.mp3', Buffer.from(mediaData))

    await sock.sendMessage(m.chat, {
      audio: Buffer.from(mediaData),
      mimetype: 'audio/mpeg',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: artist || 'Spotify',
          mediaType: 2,
          thumbnailUrl: thumb
        }
      }
    }, { quoted: m })

  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

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
  if (typeof enc !== 'string') throw new Error('Invalid response from video info')
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

async function downloadYouTubeAudio(videoId) {
  const cdn = await getCdn()
  if (!cdn) throw new Error('No CDN available')

  const { data: info } = await api.post(`https://${cdn}/v2/info`, {
    url: `https://www.youtube.com/watch?v=${videoId}`
  })
  if (!info.data) throw new Error(info.message || 'Failed to get video info')

  const dec = decrypt(info.data)

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

  return { buffer: Buffer.from(mediaData), title: dec.title }
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

function extractPlaylistTracks(data) {
  const uris = [...new Set((data.match(/spotify:track:([a-zA-Z0-9]{22})/g) || []).map(s => s.split(':')[2]))]
  const titles = []
  const seen = new Set()
  const regex = /"title":"([^"]+)"/g
  let m
  while ((m = regex.exec(data)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); titles.push(m[1]); }
  }
  const trackTitles = titles.slice(1).filter(t => t !== titles[0])
  return uris.slice(0, 30).map((id, i) => ({ id, title: trackTitles[i] || 'Unknown Track' }))
}

async function playTrack(sock, m, trackId, title, artist, thumb) {
  const searchQuery = `${title} ${artist}`.trim()
  await m.reply(`*Searching:* ${title}${artist ? ' - ' + artist : ''}`)

  const search = await yts(searchQuery + ' song')
  const video = search.videos?.[0]
  if (!video) throw new Error('No YouTube match found for: ' + title)

  await m.reply(`*Found:* ${video.title}\nDownloading...`)

  const { buffer } = await downloadYouTubeAudio(video.videoId)

  try { save('spotify_' + Date.now() + '.mp3', buffer) } catch {}

  await sock.sendMessage(m.chat, {
    audio: buffer,
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
}

const playlistCache = new Map()

export default async ({ sock, m, args }) => {
  const input = args.join(' ') || (m.quoted?.text || '')
  const trackId = extractTrackId(input)
  const playlistId = extractPlaylistId(input)
  const cacheKey = 'spotify_' + m.chat

  if (!trackId && !playlistId) {
    if (/^\d+$/.test(input.trim())) {
      const cached = playlistCache.get(cacheKey)
      if (!cached || Date.now() - cached.time > 300000) return m.reply('Playlist expired. Send URL again.')
      const num = parseInt(input.trim())
      const track = cached.tracks[num - 1]
      if (!track) return m.reply('Invalid number. Choose 1-' + cached.tracks.length)
      try {
        const meta = await getTrackMeta(track.id)
        await playTrack(sock, m, track.id, meta.title, meta.artist, meta.thumb)
      } catch (e) {
        console.error('spotify num error:', e)
        m.reply('Error: ' + e.message)
      }
      return
    }
    return m.reply('Usage: .spotify <track-url|playlist-url|track-id>')
  }

  try {
    if (playlistId) {
      const { data } = await axios.get(`https://open.spotify.com/embed/playlist/${playlistId}`, {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      })
      const tracks = extractPlaylistTracks(data)
      if (!tracks.length) return m.reply('No tracks found in playlist')

      playlistCache.set(cacheKey, { tracks, time: Date.now() })

      const lines = tracks.slice(0, 30).map((t, i) => `${i + 1}. ${t.title}`)
      const text = '*Spotify Playlist*\n' + lines.join('\n') + '\n\n_Send_ `.spotify <number>` _to play a track_'
      await sock.sendMessage(m.chat, { text }, { quoted: m })
      return
    }

    const meta = await getTrackMeta(trackId)
    await playTrack(sock, m, trackId, meta.title, meta.artist, meta.thumb)

  } catch (e) {
    console.error('spotify error:', e)
    m.reply('Error: ' + e.message)
  }
}

import axios from 'axios'
import { load } from 'cheerio'
import https from 'https'
import { save } from '../src/utils/tmp.js'

function extractTrackId(text) {
  if (!text) return null
  if (/^[a-zA-Z0-9]{22}$/.test(text)) return text
  const m = String(text).match(/track\/([a-zA-Z0-9]{22})/)
  return m ? m[1] : null
}

export default async ({ sock, m, args }) => {
  const input = args.join(' ') || (m.quoted?.text || '')
  const trackId = extractTrackId(input)
  if (!trackId) return m.reply('Usage: .download-spotify <track-url|track-id>')

  await m.reply('Downloading Spotify track...')

  try {
    const trackUrl = `https://open.spotify.com/track/${trackId}`
    
    // Try spotdown.org
    const headers = {
      origin: 'https://spotdown.org',
      referer: 'https://spotdown.org/',
      'user-agent': 'Mozilla/5.0'
    }

    const { data: details } = await axios.get(
      `https://spotdown.org/api/song-details?url=${encodeURIComponent(trackUrl)}`,
      { headers, timeout: 20000 }
    )

    const song = details?.songs?.[0]
    if (!song?.url) throw new Error('Track not found')

    const { data: audioData } = await axios.post(
      'https://spotdown.org/api/download',
      { url: song.url },
      { headers, responseType: 'arraybuffer', timeout: 60000 }
    )

    const { data: trackInfo } = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: { 
          Authorization: `Bearer ` 
        },
        timeout: 10000
      }
    ).catch(() => ({ data: null }))

    const title = trackInfo?.name || 'Spotify Track'
    const artist = trackInfo?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
    
    save('spotify_' + trackId + '.mp3', Buffer.from(audioData))

    await sock.sendMessage(m.chat, {
      audio: Buffer.from(audioData),
      mimetype: 'audio/mpeg',
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: artist,
          mediaType: 2,
          mediaUrl: trackUrl,
          sourceUrl: trackUrl
        }
      }
    }, { quoted: m })

  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

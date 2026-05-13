import axios from 'axios'
import { load } from 'cheerio'
import { execSync } from 'child_process'
import { save } from '../src/utils/tmp.js'



async function expandUrl(url) {
  if (!/https?:\/\/(vt|vm)\.tiktok\.com\//i.test(url)) return url
  const r = await axios.get(url, {
    maxRedirects: 10, timeout: 20000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36' },
    validateStatus: s => s >= 200 && s < 400
  })
  return r?.request?.res?.responseUrl || url
}

async function tikwmFetch(form, attempt = 1) {
  try {
    const r = await axios.post('https://www.tikwm.com/api/', form.toString(), {
      timeout: 45000,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://www.tikwm.com',
        'Referer': 'https://www.tikwm.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: () => true
    })
    if (r.status >= 500) throw new Error('Server error')
    return r.data
  } catch (e) {
    if (attempt < 3 && (e.message.includes('timeout') || e.message.includes('ECONNRESET'))) {
      await new Promise(res => setTimeout(res, 700 * attempt))
      return tikwmFetch(form, attempt + 1)
    }
    throw e
  }
}

async function v3(url) {
  const expanded = await expandUrl(url)
  const form = new URLSearchParams({ url: expanded, count: 12, cursor: 0, web: 1, hd: 1 })
  const payload = await tikwmFetch(form)
  if (!payload?.data) return null

  const res = payload.data
  const videos = []
  if (res.duration > 0) {
    if (res.wmplay) videos.push({ type: 'watermark', url: 'https://www.tikwm.com' + res.wmplay })
    if (res.play) videos.push({ type: 'nowatermark', url: 'https://www.tikwm.com' + res.play })
    if (res.hdplay) videos.push({ type: 'nowatermark_hd', url: 'https://www.tikwm.com' + res.hdplay })
  }
  return {
    title: res.title,
    author: res.author?.nickname || '',
    images: res.duration === 0 ? (res.images || []) : [],
    videos,
    music: res.music ? 'https://www.tikwm.com' + res.music : null,
    cover: res.cover ? 'https://www.tikwm.com' + res.cover : null
  }
}

async function v2(url) {
  try {
    const body = new URLSearchParams({ q: url, cursor: '0', page: '0', lang: 'id' }).toString()
    const r = await axios.post('https://savetik.io/api/ajaxSearch', body, {
      timeout: 45000,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10)',
        'origin': 'https://savetik.io',
        'referer': 'https://savetik.io/id/download-tiktok-photos'
      }
    })
    const html = r.data?.data
    if (!html) return null
    const $ = load(html)
    const mp4 = $('a:contains("Unduh MP4 [1]")').attr('href') || $('a:contains("Unduh MP4 HD")').attr('href') || null
    const images = []
    $('.photo-list ul.download-box li').each((_, el) => {
      const img = $(el).find("a[title='Unduh Gambar']").attr('href')
      if (img) images.push(img)
    })
    return {
      title: $('h3').first().text().trim() || '',
      images,
      videos: mp4 ? [{ type: 'nowatermark', url: mp4 }] : []
    }
  } catch { return null }
}

async function v1(url) {
  try {
    const page = await axios.get('https://savett.cc/en1/download', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) Chrome/139.0.0.0 Mobile Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: () => true
    })
    if (page.status >= 400) return null

    const csrf = page.data?.match(/name="csrf_token" value="([^"]+)"/)?.[1]
    const cookies = (page.headers['set-cookie'] || []).map(v => v.split(';')[0]).join('; ')
    if (!csrf) return null

    const post = await axios.post('https://savett.cc/en1/download',
      `csrf_token=${encodeURIComponent(csrf)}&url=${encodeURIComponent(url)}`,
      {
        timeout: 45000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) Chrome/139.0.0.0 Mobile Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookies
        },
        validateStatus: () => true
      })
    if (post.status >= 400) return null

    const $ = load(post.data)
    const videos = []
    $('#formatselect option').each((_, el) => {
      const label = ($(el).text() || '').toLowerCase()
      const raw = $(el).attr('value')
      if (!raw) return
      try {
        const json = JSON.parse(raw.replace(/&quot;/g, '"'))
        const urls = (json?.URL || []).filter(Boolean)
        if (label.includes('mp4') && !label.includes('watermark')) urls.forEach(u => videos.push({ type: 'nowatermark', url: u }))
        if (label.includes('watermark')) urls.forEach(u => videos.push({ type: 'watermark', url: u }))
      } catch {}
    })
    return { title: '', videos }
  } catch { return null }
}

export default async ({ sock, m, args, cmd }) => {
  const url = args[0]
  if (!url) return m.reply('Usage: .' + cmd + ' <url>')

  if (!/tiktok\.com/i.test(url)) return m.reply('Invalid TikTok URL')

  await m.reply('Downloading TikTok...')

  try {
    const finalUrl = /https?:\/\/(vt|vm)\.tiktok\.com\//i.test(url) ? await expandUrl(url).catch(() => url) : url
    const data = (await v1(finalUrl)) || (await v2(finalUrl)) || (await v3(finalUrl))
    if (!data) throw new Error('All download methods failed')

    const target = data.videos.find(v => v.type === 'nowatermark_hd' || v.type === 'nowatermark') || data.videos[0]
    const imgSource = data.images?.[0] || data.cover

    if (target) {
      const { data: buf } = await axios.get(target.url, { responseType: 'arraybuffer', timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.tikwm.com/' }
      })
      save('tiktok_' + Date.now() + '.mp4', Buffer.from(buf))
      await sock.sendMessage(m.chat, {
        video: Buffer.from(buf),
        caption: data.title ? `*${data.title}*` : ''
      }, { quoted: m })
    } else if (imgSource) {
      const { data: buf } = await axios.get(imgSource, { responseType: 'arraybuffer' })
      await sock.sendMessage(m.chat, { image: Buffer.from(buf) }, { quoted: m })
    } else {
      throw new Error('No media found')
    }
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['tt']

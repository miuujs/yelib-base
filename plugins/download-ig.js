import axios from 'axios'
import { load } from 'cheerio'
import vm from 'vm'
import { save } from '../src/utils/tmp.js'

async function indown(url) {
  try {
    const page = await axios.get('https://indown.io/en1', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115' }
    })
    const $ = load(page.data)
    const token = $('input[name="_token"]').val()
    const cookies = (page.headers['set-cookie'] || []).map(v => v.split(';')[0]).join('; ')
    if (!token) return null

    const params = new URLSearchParams()
    params.append('referer', 'https://indown.io/en1')
    params.append('locale', 'en')
    params.append('_token', token)
    params.append('link', url)
    params.append('p', 'i')

    const result = await axios.post('https://indown.io/download', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115'
      }
    })
    const $r = load(result.data)
    const links = []
    $r('video source[src], a[href].btn-outline-primary').each((_, e) => {
      let link = $r(e).attr('src') || $r(e).attr('href')
      if (link) {
        if (link.includes('indown.io/fetch')) {
          try { link = decodeURIComponent(new URL(link).searchParams.get('url')) } catch {}
        }
        if (/cdninstagram\.com|fbcdn\.net/.test(link)) links.push(link.replace(/&dl=1$/, ''))
      }
    })
    return [...new Set(links)]
  } catch { return null }
}

async function snapsave(url) {
  try {
    const form = new URLSearchParams()
    form.append('url', url)
    const { data } = await axios.post('https://snapsave.app/id/action.php?lang=id', form, {
      headers: {
        'origin': 'https://snapsave.app',
        'referer': 'https://snapsave.app/id/download-video-instagram',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    })
    const ctx = { window: {}, document: { getElementById: () => ({ value: '' }) }, console, eval: res => res }
    vm.createContext(ctx)
    const decoded = vm.runInContext(data, ctx)
    const regex = /https:\/\/d\.rapidcdn\.app\/v2\?[^"]+/g
    const matches = decoded.match(regex)
    if (matches) return [...new Set(matches.map(u => u.replace(/&amp;/g, '&')))]
    return null
  } catch { return null }
}

export default async ({ sock, m, args }) => {
  const url = args[0]
  if (!url) return m.reply('Usage: .ig <url>')

  await m.reply('Downloading Instagram...')

  try {
    let links = await indown(url)
    if (!links?.length) links = await snapsave(url)
    if (!links?.length) throw new Error('No media found')

    for (const link of links) {
      const { data: buf } = await axios.get(link, { responseType: 'arraybuffer', timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://indown.io/' }
      })
      const ext = link.match(/\.(jpg|jpeg|png|mp4|webp)/i)?.[1] || 'mp4'
      save('ig_' + Date.now() + '.' + ext, Buffer.from(buf))
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase())) {
        await sock.sendMessage(m.chat, { image: Buffer.from(buf) }, { quoted: m })
      } else {
        await sock.sendMessage(m.chat, { video: Buffer.from(buf) }, { quoted: m })
      }
    }
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

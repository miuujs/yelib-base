import axios from 'axios'
import { chromium } from 'playwright'
import { save } from '../src/utils/tmp.js'

let _browser = null

async function getBrowser() {
  if (!_browser) {
    _browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  }
  return _browser
}

async function extractMedia(url) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  const links = []

  try {
    page.on('response', async (res) => {
      const apiUrl = res.url()
      if (!apiUrl.includes('graphql') && !apiUrl.includes('api/v1/media')) return
      if (!res.headers()['content-type']?.includes('json')) return
      try {
        const json = await res.json()
        const media = json?.data?.shortcode_media || json?.items?.[0] || json?.graphql?.shortcode_media
        if (!media) return
        const add = (n) => {
          if (n?.video_url) links.push(n.video_url)
          if (n?.display_url) links.push(n.display_url)
          if (n?.video_versions?.[0]?.url) links.push(n.video_versions[0].url)
          if (n?.image_versions2?.candidates?.[0]?.url) links.push(n.image_versions2.candidates[0].url)
        }
        if (media.edge_sidecar_to_children?.edges) {
          media.edge_sidecar_to_children.edges.forEach(e => add(e.node))
        } else if (media.carousel_media) {
          media.carousel_media.forEach(m => add(m))
        } else {
          add(media)
        }
      } catch {}
    })

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    if (!links.length) {
      const domUrls = await page.evaluate(() => {
        const result = []
        document.querySelectorAll('img[src*="scontent"], img[src*="cdninstagram"]').forEach(img => {
          const src = img.src || img.getAttribute('src')
          if (src && !src.includes('rsrc.php') && !src.includes('static.cdninstagram')) result.push(src)
        })
        document.querySelectorAll('video[src*="scontent"], video source[src*="scontent"]').forEach(v => {
          const src = v.src || v.getAttribute('src')
          if (src) result.push(src)
        })
        return [...new Set(result)]
      })
      links.push(...domUrls.filter(u => !u.includes('t51.82787-19')))
    }
  } finally {
    await page.close()
  }

  return [...new Set(links)]
}

export default async ({ sock, m, args }) => {
  const url = args[0]
  if (!url) return m.reply('Usage: .ig <url>')

  await m.reply('Downloading Instagram...')

  try {
    const links = await extractMedia(url)
    if (!links.length) throw new Error('No media found')

    for (const link of links) {
      const { data: buf } = await axios.get(link, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.instagram.com/' }
      })
      const ext = link.match(/\.(jpg|jpeg|png|mp4|webp)/i)?.[1] || 'jpg'
      save('ig_' + Date.now() + '.' + ext, Buffer.from(buf))
      if (ext === 'mp4') {
        await sock.sendMessage(m.chat, { video: Buffer.from(buf) }, { quoted: m })
      } else {
        await sock.sendMessage(m.chat, { image: Buffer.from(buf) }, { quoted: m })
      }
    }
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

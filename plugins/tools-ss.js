import { execFile } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { readFileSync, unlinkSync } from 'fs'
import sharp from 'sharp'

const devices = {
  desktop: {
    size: '1280,720',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    label: 'Desktop'
  },
  tablet: {
    size: '768,1024',
    ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    label: 'Tablet'
  },
  mobile: {
    size: '375,812',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    label: 'Mobile'
  }
}

function frameSVG(type, w, h) {
  const pad = type === 'iphone' ? 24 : type === 'mac' ? 40 : 0
  const bw = w + pad * 2
  const bh = h + pad * 2 + (type === 'mac' ? 30 : type === 'iphone' ? 60 : type === 'android' ? 50 : 0)

  if (type === 'mac') return `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><defs><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity=".35"/></filter></defs><rect width="${bw}" height="${bh}" rx="16" fill="#1a1a2e" filter="url(#s)"/><rect x="${pad}" y="${pad + 30}" width="${w}" height="${h}" rx="2" fill="#000"/><circle cx="${bw / 2}" cy="14" r="4" fill="#333"/><circle cx="${pad + 14}" cy="14" r="6" fill="#ff5f57"/><circle cx="${pad + 30}" cy="14" r="6" fill="#febc2e"/><circle cx="${pad + 46}" cy="14" r="6" fill="#28c840"/></svg>`
  if (type === 'iphone') return `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><defs><filter id="s"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity=".4"/></filter></defs><rect width="${bw}" height="${bh}" rx="40" fill="#111" filter="url(#s)"/><rect x="${pad}" y="${pad + 60}" width="${w}" height="${h}" rx="2" fill="#000"/><rect x="${bw / 2 - 40}" y="12" width="80" height="28" rx="14" fill="#222"/></svg>`
  if (type === 'android') return `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><defs><filter id="s"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity=".4"/></filter></defs><rect width="${bw}" height="${bh}" rx="36" fill="#111" filter="url(#s)"/><rect x="${pad}" y="${pad + 50}" width="${w}" height="${h}" rx="1" fill="#000"/><circle cx="${bw / 2}" cy="${bh - 18}" r="3" fill="#444"/></svg>`
  if (type === 'ipad') return `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><defs><filter id="s"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity=".4"/></filter></defs><rect width="${bw}" height="${bh}" rx="28" fill="#111" filter="url(#s)"/><rect x="${pad}" y="${pad + 50}" width="${w}" height="${h}" rx="2" fill="#000"/><rect x="${bw / 2 - 30}" y="12" width="60" height="20" rx="10" fill="#222"/></svg>`
  if (type === 'windows') return `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}"><defs><filter id="s"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity=".3"/></filter></defs><rect width="${bw}" height="${bh}" rx="4" fill="#f0f0f0" filter="url(#s)"/><rect x="${pad}" y="${pad + 34}" width="${w}" height="${h}" rx="1" fill="#fff" stroke="#ddd" stroke-width="1"/><rect x="0" y="0" width="${bw}" height="34" fill="#e0e0e0" rx="4"/><text x="${pad + 6}" y="22" font-family="sans-serif" font-size="12" fill="#666">📂</text></svg>`
  return null
}

async function wrapFrame(imgBuf, type) {
  const meta = await sharp(imgBuf).metadata()
  const svg = frameSVG(type, meta.width, meta.height)
  if (!svg) return imgBuf

  const s = await sharp(Buffer.from(svg)).png().toBuffer()
  const sm = await sharp(s).metadata()

  const pad = type === 'iphone' ? 24 : type === 'mac' ? 40 : 0
  const top = type === 'mac' ? 40 : type === 'iphone' ? 60 : type === 'android' ? 50 : type === 'ipad' ? 50 : 34
  const sW = sm.width
  const screensW = sW - pad * 2

  const resized = await sharp(imgBuf)
    .resize(screensW, null, { fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  return sharp(s)
    .composite([{ input: resized, top, left: Math.round((sW - (await sharp(resized).metadata()).width) / 2) }])
    .png()
    .toBuffer()
}

export default async ({ sock, m, args }) => {
  const raw = args.join(' ')
  const parts = raw.split(/\s+/)
  const url = parts[0]
  const mode = (parts[1] || 'desktop').toLowerCase()

  if (!url) return m.reply('Usage: .ss <url> [desktop|tablet|mobile|mac|iphone|android|ipad|windows] [width]x[height]')

  const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url

  let size, ua, label, frameType

  if (devices[mode]) {
    size = devices[mode].size
    ua = devices[mode].ua
    label = devices[mode].label
  } else if (/^\d+x\d+$/.test(mode)) {
    size = mode.replace('x', ',')
    ua = devices.desktop.ua
    label = mode
  } else if (['mac', 'iphone', 'android', 'ipad', 'windows'].includes(mode)) {
    frameType = mode
    const preset = mode === 'mac' ? 'desktop' : mode === 'ipad' ? 'tablet' : 'mobile'
    size = devices[preset].size
    ua = devices[preset].ua
    label = mode.charAt(0).toUpperCase() + mode.slice(1)
  } else {
    size = devices.desktop.size
    ua = devices.desktop.ua
    label = 'Desktop'
  }

  if (parts[2] && /^\d+x\d+$/.test(parts[2])) {
    size = parts[2].replace('x', ',')
  }

  try {
    await m.reply(`Taking screenshot${frameType ? ' (' + label + ')' : ' (' + label + ')'}...`)

    const output = join(tmpdir(), `ss_${randomBytes(4).toString('hex')}.png`)

    await new Promise((resolve, reject) => {
      execFile('google-chrome', [
        '--headless', '--no-sandbox', '--disable-gpu',
        '--screenshot=' + output,
        '--window-size=' + size,
        '--hide-scrollbars',
        '--user-agent=' + ua,
        fullUrl
      ], { timeout: 30000 }, (err) => {
        if (err) reject(new Error('Screenshot failed'))
        else resolve()
      })
    })

    let img = readFileSync(output)
    unlinkSync(output)

    if (frameType) img = await wrapFrame(img, frameType)

    await sock.sendMessage(m.chat, { image: img, caption: fullUrl + ' (' + label + ')' }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['ss', 'screenshot']

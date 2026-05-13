import { execFile } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { readFileSync, unlinkSync } from 'fs'

const devices = {
  desktop: {
    size: '1280,720',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  tablet: {
    size: '768,1024',
    ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  mobile: {
    size: '375,812',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
}

export default async ({ sock, m, args }) => {
  const url = args[0]
  const device = (args[1] || 'desktop').toLowerCase()
  if (!url) return m.reply('Usage: .ss <url> [desktop|tablet|mobile]')

  const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url
  const cfg = devices[device] || devices.desktop

  try {
    await m.reply(`Taking screenshot (${device})...`)

    const output = join(tmpdir(), `ss_${randomBytes(4).toString('hex')}.png`)

    await new Promise((resolve, reject) => {
      execFile('google-chrome', [
        '--headless', '--no-sandbox', '--disable-gpu',
        '--screenshot=' + output,
        '--window-size=' + cfg.size,
        '--hide-scrollbars',
        '--user-agent=' + cfg.ua,
        fullUrl
      ], { timeout: 30000 }, (err) => {
        if (err) reject(new Error('Screenshot failed'))
        else resolve()
      })
    })

    const img = readFileSync(output)
    unlinkSync(output)

    await sock.sendMessage(m.chat, { image: img, caption: fullUrl + ' (' + device + ')' }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['ss', 'screenshot']

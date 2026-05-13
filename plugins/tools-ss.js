import { execFile } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { readFileSync, unlinkSync } from 'fs'

export default async ({ sock, m, args }) => {
  const url = args.join(' ') || (m.quoted?.text || '')
  if (!url) return m.reply('Usage: .ss <url>')
  const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url

  try {
    await m.reply('Taking screenshot...')

    const output = join(tmpdir(), `ss_${randomBytes(4).toString('hex')}.png`)

    await new Promise((resolve, reject) => {
      execFile('google-chrome', [
        '--headless', '--no-sandbox', '--disable-gpu',
        '--screenshot=' + output,
        '--window-size=1280,720',
        '--hide-scrollbars',
        fullUrl
      ], { timeout: 30000 }, (err) => {
        if (err) reject(new Error('Screenshot failed'))
        else resolve()
      })
    })

    const img = readFileSync(output)
    unlinkSync(output)

    await sock.sendMessage(m.chat, { image: img, caption: fullUrl }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['ss', 'screenshot']

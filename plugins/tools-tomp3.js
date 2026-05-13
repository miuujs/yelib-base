import { execSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { save } from '../src/utils/tmp.js'

export default async ({ sock, m }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/video|audio/.test(mime)) return m.reply('Reply to a video/audio')

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    const ext = mime.split('/')[1] || 'mp4'
    const input = join(tmpdir(), `in_${randomBytes(4).toString('hex')}.${ext}`)
    const output = join(tmpdir(), `out_${randomBytes(4).toString('hex')}.mp3`)

    writeFileSync(input, buf)
    execSync(`ffmpeg -y -i "${input}" -codec:a libmp3lame -b:a 128k "${output}"`, { timeout: 60000 })

    const mp3 = readFileSync(output)
    save('tomp3_' + Date.now() + '.mp3', mp3)

    await sock.sendMessage(m.chat, { audio: mp3, mimetype: 'audio/mpeg' }, { quoted: m })

    unlinkSync(input)
    unlinkSync(output)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['tomp3']

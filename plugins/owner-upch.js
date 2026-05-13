import { execSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

export default async ({ sock, m, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/audio/.test(mime)) return m.reply('Reply to an audio')

  const ch = '120363425402680588@newsletter'

  try {
    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    const ext = mime.split('/')[1] || 'mp3'
    const input = join(tmpdir(), `upch_${randomBytes(4).toString('hex')}.${ext}`)
    const output = join(tmpdir(), `upch_${randomBytes(4).toString('hex')}.opus`)

    writeFileSync(input, buf)
    execSync(`ffmpeg -y -i "${input}" -c:a libopus -b:a 64k -vbr on -compression_level 10 "${output}"`, { timeout: 60000 })

    const opus = readFileSync(output)
    unlinkSync(input)
    unlinkSync(output)

    await sock.sendMessage(ch, { audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true })
    m.reply('Done')
  } catch (e) {
    console.error('upch error:', e)
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['upch']

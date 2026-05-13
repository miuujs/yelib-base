import { execSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { menuBuffer, clockString } from '../src/utils/reply.js'

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

    const bodyText = 'Runtime: ' + clockString(Date.now() - global.start)
    await sock.sendMessage(ch, {
      audio: opus,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: 'yelib-base',
          body: bodyText,
          thumbnail: menuBuffer,
          mediaType: 1,
          sourceUrl: 'https://github.com/miuujs/yelib-base',
          sourceType: '1'
        }
      }
    })
    m.reply('Done')
  } catch (e) {
    console.error('upch error:', e)
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['upch']

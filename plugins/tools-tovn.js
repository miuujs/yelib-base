import { execSync, execFileSync } from 'child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { save } from '../src/utils/tmp.js'

export default async ({ sock, m }) => {
  const q = m.quoted || m
  const mime = (q.msg || q).mimetype || ''
  if (!/audio/.test(mime)) return m.reply('Reply to an audio')

  try {
    try { execFileSync('which', ['ffmpeg']) } catch {
      return m.reply('This feature requires ffmpeg.\nInstall it with:\n• apt install ffmpeg (Debian/Ubuntu)\n• yum install ffmpeg (CentOS/RHEL)\n• pacman -S ffmpeg (Arch)')
    }

    const buf = await q.download()
    if (!buf) return m.reply('Download failed')

    const ext = mime.split('/')[1] || 'mp3'
    const input = join(tmpdir(), `in_${randomBytes(4).toString('hex')}.${ext}`)
    const output = join(tmpdir(), `out_${randomBytes(4).toString('hex')}.opus`)

    writeFileSync(input, buf)
    execSync(`ffmpeg -y -i "${input}" -c:a libopus -b:a 64k -vbr on -compression_level 10 "${output}"`, { timeout: 60000 })

    const opus = readFileSync(output)
    save('tovn_' + Date.now() + '.opus', opus)

    await sock.sendMessage(m.chat, { audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })

    unlinkSync(input)
    unlinkSync(output)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['tovn']

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { mkdirSync } from 'fs'

export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  if (!m.quoted) return m.reply('Reply to an audio message')
  if (m.quoted.mtype !== 'audioMessage') return m.reply('Reply must be an audio message')

  try {
    let chJid = args[0] || '120363425402680588@newsletter'
    if (!chJid.includes('@newsletter')) {
      const meta = await sock.newsletterMetadata('invite', chJid).catch(() => null)
      if (!meta?.id) return m.reply('Invalid channel invite code')
      chJid = meta.id
    }

    await sock.newsletterFollow(chJid).catch(() => {})

    const audio = await m.quoted.download()
    const mimetype = m.quoted.msg?.mimetype || 'audio/ogg; codecs=opus'
    const ptt = m.quoted.msg?.ptt || false

    mkdirSync(join(process.cwd(), 'tmp'), { recursive: true })
    const tmp = join(process.cwd(), 'tmp', 'dur_' + Date.now())
    writeFileSync(tmp, audio)
    let seconds = 0
    try {
      const out = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${tmp}`,
        { encoding: 'utf-8', timeout: 10000 }
      )
      seconds = Math.ceil(parseFloat(out.trim()) || 0)
    } catch (e) {
      console.log('ffprobe error:', e.message)
    }
    try { unlinkSync(tmp) } catch {}

    console.log('sending audio to', chJid, { mimetype, ptt, seconds, size: audio.length })

    await sock.sendMessage(chJid, { audio, mimetype, ptt, seconds })
    m.reply('Audio sent to channel successfully')
  } catch (e) {
    m.reply('Error: ' + (e.stack || e.message))
  }
}

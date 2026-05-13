import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export default async ({ sock, m, args, cmd, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  const q = m.quoted || m
  const type = q.mtype || ''
  const mime = (q.msg || q).mimetype || ''
  const cap = args.join(' ').trim() || q.text || ''

  let content

  try {
    if (type === 'imageMessage' || /image/i.test(mime)) {
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'jpg'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { image: { url: tmp }, caption: cap }
    } else if (type === 'videoMessage' || /video/i.test(mime)) {
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'mp4'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { video: { url: tmp }, caption: cap }
    } else if (type === 'audioMessage' || /audio/i.test(mime)) {
      if (cap) m.reply('Audio does not support caption')
      const buf = await q.download()
      if (!buf) throw new Error('Download failed')
      const ext = mime.split('/')[1] || 'mp3'
      const tmp = join(tmpdir(), 'swgc_' + Date.now() + '.' + ext)
      await writeFile(tmp, buf)
      content = { audio: { url: tmp }, mimetype: mime || 'audio/mpeg' }
    } else if (cap) {
      content = { text: cap }
    } else {
      throw new Error('Reply media or text')
    }
  } catch (e) {
    return m.reply(e.message)
  }

  const tmpFiles = []
  if (content.image?.url && typeof content.image.url === 'string' && content.image.url.includes('swgc_')) tmpFiles.push(content.image.url)
  if (content.video?.url && typeof content.video.url === 'string' && content.video.url.includes('swgc_')) tmpFiles.push(content.video.url)
  if (content.audio?.url && typeof content.audio.url === 'string' && content.audio.url.includes('swgc_')) tmpFiles.push(content.audio.url)

  if (m.isGroup) {
    try {
      await sock.sendMessage(m.chat, { groupStatusMessage: content })
      m.reply('Group status posted')
    } catch (e) {
      m.reply('Failed: ' + e.message)
    } finally {
      for (const f of tmpFiles) unlink(f).catch(() => {})
    }
    return
  }

  try {
    const groups = Object.entries(sock.chats || {}).filter(([id, g]) => id.endsWith('@g.us') && !g.isCommunity && !g.isCommunityAnnounce)
    if (!groups.length) return m.reply('No groups found')

    if (groups.length === 1) {
      try {
        await sock.sendMessage(groups[0][0], { groupStatusMessage: content })
        m.reply('Posted to ' + (groups[0][1]?.subject || groups[0][0]))
      } finally {
        for (const f of tmpFiles) unlink(f).catch(() => {})
      }
      return
    }

    global.pendingStatus.set(m.sender, { content, timestamp: Date.now() })

    const rows = groups.map(([id, g], i) => ({
      title: (i + 1) + '. ' + (g?.subject || id.split('@')[0]),
      id
    }))

    await sock.sendMessage(m.chat, {
      interactiveMessage: {
        title: 'Pilih grup untuk status',
        footer: 'Powered by miuujs',
        buttons: [{
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: 'Daftar Grup',
            sections: [{ title: 'Grup', rows }]
          })
        }]
      }
    })
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['statusgroup', 'swgc']

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
    const origMimetype = m.quoted.msg?.mimetype || 'audio/mpeg'
    const ptt = m.quoted.msg?.ptt || false

    await sock.sendMessage(chJid, { audio, mimetype: origMimetype, ptt })
    m.reply('Audio sent to channel successfully')
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

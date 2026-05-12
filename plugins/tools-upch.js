export default async ({ sock, m, args, isOwner }) => {
  if (!isOwner) return m.reply('Owner only')

  if (!m.quoted) return m.reply('Reply to an audio message')
  if (m.quoted.mtype !== 'audioMessage') return m.reply('Reply must be an audio message')

  try {
    let chJid = args[0] || global.newsletter_ch || ''

    if (!chJid || !chJid.includes('@newsletter')) {
      if (!args.length) return m.reply('Specify channel name or JID: .upch MyChannel')
      const name = args.join(' ')
      const created = await sock.newsletterCreate(name, '')
      if (!created?.id) return m.reply('Failed to create channel')
      chJid = created.id
      global.newsletter_ch = chJid
      m.reply('Channel created: ' + chJid)
    }

    await sock.newsletterFollow(chJid).catch(() => {})

    const audio = await m.quoted.download()
    const origMimetype = m.quoted.msg?.mimetype || 'audio/mpeg'
    const ptt = m.quoted.msg?.ptt || false

    await sock.sendMessage(chJid, { audio, mimetype: origMimetype, ptt })
    m.reply('Audio sent to channel: ' + chJid)
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

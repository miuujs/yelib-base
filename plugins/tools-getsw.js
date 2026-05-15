export default async ({ sock, m, isOwner }) => {
  if (!isOwner && !m.isAdmin) return m.reply('Admin only')
  if (!m.quoted) return m.reply('Reply to a status/story message')

  try {
    let content = m.quoted.fakeObj.message
    if (!content) return m.reply('No message content found')

    for (let i = 0; i < 5; i++) {
      const wrap = content?.ephemeralMessage || content?.viewOnceMessage || content?.viewOnceMessageV2 || content?.viewOnceMessageV2Extension || content?.documentWithCaptionMessage || content?.editedMessage || content?.groupStatusMessageV2 || content?.associatedChildMessage
      if (!wrap) break
      content = wrap.message || wrap
    }

    const type = Object.keys(content)[0]
    if (!type) return m.reply('Unknown message type')

    if (content[type]?.contextInfo) {
      delete content[type].contextInfo
    }

    await sock.relayMessage(m.chat, content, {})
  } catch (e) {
    m.reply('Error: ' + e.message)
  }
}

export const aliases = ['gsw']
